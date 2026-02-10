from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, case, text, delete as sql_delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date
from database import get_db
from models import Course, TeachingAssignment, ContentItem, Instructor, AppUser, Enrollment, Student, AuditLog, CourseProposal, TopicProposal, University, Program, Textbook, Topic, CourseTopic
from dependencies import get_current_user, RoleChecker
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(
    prefix="/instructor",
    tags=["instructor"],
    dependencies=[Depends(RoleChecker(["instructor", "admin"]))]
)

# ── Pydantic Schemas ─────────────────────────────────────────────

class CourseResponse(BaseModel):
    course_id: int
    course_name: str
    duration_weeks: int
    student_count: int = 0
    
    class Config:
        from_attributes = True

class ContentItemCreate(BaseModel):
    content_type: str
    title: str
    url: str

class ContentItemResponse(BaseModel):
    content_id: int
    title: str
    content_type: str
    url: Optional[str] = None
    
    class Config:
        from_attributes = True

class StudentInCourse(BaseModel):
    student_id: int
    full_name: str
    email: Optional[str] = None
    evaluation_score: Optional[int] = None
    
    class Config:
        from_attributes = True

class GradeUpdate(BaseModel):
    evaluation_score: int = Field(..., ge=0, le=100, description="Score between 0-100")

class AnalyticsResponse(BaseModel):
    distribution: dict
    pass_rate: float
    at_risk_count: int
    total_students: int
    avg_score: Optional[float] = None

# ── Helper: Resolve Instructor from AppUser ──────────────────────

async def get_instructor_from_user(current_user: AppUser, db: AsyncSession) -> Optional[Instructor]:
    """Resolve instructor record from current user. Uses user_id FK if available, falls back to email match."""
    # Try FK-based lookup first
    result = await db.execute(
        select(Instructor).where(
            (Instructor.user_id == current_user.id) | (Instructor.email == current_user.email)
        )
    )
    return result.scalar_one_or_none()


async def verify_course_ownership(instructor: Optional[Instructor], course_id: int, current_user: AppUser, db: AsyncSession):
    """Verify the instructor is assigned to this course, or user is admin."""
    if not instructor and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")
    
    if instructor:
        assignment = await db.execute(
            select(TeachingAssignment).where(
                and_(
                    TeachingAssignment.instructor_id == instructor.instructor_id,
                    TeachingAssignment.course_id == course_id
                )
            )
        )
        if not assignment.scalar_one_or_none() and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not assigned to this course")

# ── GET /instructor/courses ──────────────────────────────────────


class ApplicationItem(BaseModel):
    student_id: int
    full_name: str
    email: Optional[str] = None
    enroll_date: str


class ApproveRejectRequest(BaseModel):
    student_id: int


class GradeRequest(BaseModel):
    evaluation_score: int


class CourseProposalCreate(BaseModel):
    course_name: str
    duration_weeks: int
    university_id: int
    program_id: int
    textbook_id: int


class TopicProposalCreate(BaseModel):
    topic_name: str


class TopicLinkRequest(BaseModel):
    topic_id: int


class CourseProposalResponse(BaseModel):
    id: int
    course_name: str
    duration_weeks: int
    university_id: int
    program_id: int
    textbook_id: int
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TopicProposalResponse(BaseModel):
    id: int
    topic_name: str
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/courses", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get courses assigned to the current instructor."""
    instructor = await get_instructor_from_user(current_user, db)
    
    if not instructor:
        return []

    # Get courses with approved student count
    stmt = (
        select(
            Course,
            func.count(Enrollment.student_id).label("student_count")
        )
        .join(TeachingAssignment, TeachingAssignment.course_id == Course.course_id)
        .outerjoin(
            Enrollment,
            and_(
                Enrollment.course_id == Course.course_id,
                Enrollment.status == "approved",
            ),
        )
        .where(TeachingAssignment.instructor_id == instructor.instructor_id)
        .group_by(Course.course_id)
    )
    result = await db.execute(stmt)
    
    courses = []
    for row in result:
        courses.append(CourseResponse(
            course_id=row[0].course_id,
            course_name=row[0].course_name,
            duration_weeks=row[0].duration_weeks,
            student_count=row[1] or 0
        ))
    return courses

# ── GET /instructor/courses/{id}/students ────────────────────────

@router.get("/courses/{course_id}/students", response_model=List[StudentInCourse])
async def get_course_students(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all students enrolled in a course."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    stmt = (
        select(Student, Enrollment.evaluation_score)
        .join(Enrollment, Enrollment.student_id == Student.student_id)
        .where(
            Enrollment.course_id == course_id,
            Enrollment.status == "approved",
        )
    )
    result = await db.execute(stmt)
    
    students = []
    for student, score in result:
        students.append(StudentInCourse(
            student_id=student.student_id,
            full_name=student.full_name,
            email=student.email,
            evaluation_score=score
        ))
    return students


@router.get("/courses/{course_id}/applications", response_model=List[ApplicationItem])
async def get_course_applications(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending applications (enrollments) for this course."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if instructor:
        assignment = await db.execute(
            select(TeachingAssignment).where(
                and_(
                    TeachingAssignment.instructor_id == instructor.instructor_id,
                    TeachingAssignment.course_id == course_id
                )
            )
        )
        if not assignment.scalar_one_or_none() and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not assigned to this course")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")

    stmt = (
        select(Student, Enrollment.enroll_date)
        .join(Enrollment, Enrollment.student_id == Student.student_id)
        .where(
            Enrollment.course_id == course_id,
            Enrollment.status == "pending",
        )
    )
    result = await db.execute(stmt)
    return [
        ApplicationItem(
            student_id=student.student_id,
            full_name=student.full_name,
            email=student.email,
            enroll_date=ed.isoformat() if isinstance(ed, date) else str(ed),
        )
        for student, ed in result
    ]


@router.post("/courses/{course_id}/applications/approve")
async def approve_application(
    course_id: int,
    body: ApproveRejectRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending enrollment. Capacity already reserved."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if instructor:
        assignment = await db.execute(
            select(TeachingAssignment).where(
                and_(
                    TeachingAssignment.instructor_id == instructor.instructor_id,
                    TeachingAssignment.course_id == course_id
                )
            )
        )
        if not assignment.scalar_one_or_none() and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not assigned to this course")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")

    enroll_result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == body.student_id,
            Enrollment.status == "pending",
        )
    )
    enrollment = enroll_result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Application not found or already processed")
    enrollment.status = "approved"
    await db.commit()
    return {"message": "Application approved"}


@router.post("/courses/{course_id}/applications/reject")
async def reject_application(
    course_id: int,
    body: ApproveRejectRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending enrollment and free the reserved slot."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if instructor:
        assignment = await db.execute(
            select(TeachingAssignment).where(
                and_(
                    TeachingAssignment.instructor_id == instructor.instructor_id,
                    TeachingAssignment.course_id == course_id
                )
            )
        )
        if not assignment.scalar_one_or_none() and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not assigned to this course")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")

    enroll_result = await db.execute(
        select(Enrollment, Course).join(Course, Enrollment.course_id == Course.course_id).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == body.student_id,
            Enrollment.status == "pending",
        )
    )
    row = enroll_result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found or already processed")
    enrollment, course = row
    enrollment.status = "rejected"
    course.current_enrollment -= 1
    await db.commit()
    return {"message": "Application rejected"}


@router.patch("/courses/{course_id}/students/{student_id}/grade")
async def set_student_grade(
    course_id: int,
    student_id: int,
    body: GradeRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set or update evaluation score (grade) for a student in this course."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if instructor:
        assignment = await db.execute(
            select(TeachingAssignment).where(
                and_(
                    TeachingAssignment.instructor_id == instructor.instructor_id,
                    TeachingAssignment.course_id == course_id
                )
            )
        )
        if not assignment.scalar_one_or_none() and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="You are not assigned to this course")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")

    enroll_result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
            Enrollment.status == "approved",
        )
    )
    enrollment = enroll_result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if body.evaluation_score < 0 or body.evaluation_score > 100:
        raise HTTPException(status_code=400, detail="evaluation_score must be between 0 and 100")
    enrollment.evaluation_score = body.evaluation_score
    await db.commit()
    return {"message": "Grade updated", "evaluation_score": body.evaluation_score}


@router.post("/course-proposals", response_model=CourseProposalResponse)
async def create_course_proposal(
    body: CourseProposalCreate,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a course proposal for admin approval."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if not instructor and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")
    if not instructor:
        raise HTTPException(status_code=403, detail="Only instructors can create course proposals")
    proposal = CourseProposal(
        instructor_id=instructor.instructor_id,
        course_name=body.course_name,
        duration_weeks=body.duration_weeks,
        university_id=body.university_id,
        program_id=body.program_id,
        textbook_id=body.textbook_id,
        status="pending",
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return CourseProposalResponse(
        id=proposal.id,
        course_name=proposal.course_name,
        duration_weeks=proposal.duration_weeks,
        university_id=proposal.university_id,
        program_id=proposal.program_id,
        textbook_id=proposal.textbook_id,
        status=proposal.status,
        created_at=proposal.created_at.isoformat() if proposal.created_at else None,
    )


@router.get("/course-proposals", response_model=List[CourseProposalResponse])
async def list_my_course_proposals(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List current instructor's course proposals."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if not instructor and current_user.role != "admin":
        return []
    if not instructor:
        return []
    stmt = select(CourseProposal).where(CourseProposal.instructor_id == instructor.instructor_id)
    result = await db.execute(stmt)
    proposals = result.scalars().all()
    return [
        CourseProposalResponse(
            id=p.id,
            course_name=p.course_name,
            duration_weeks=p.duration_weeks,
            university_id=p.university_id,
            program_id=p.program_id,
            textbook_id=p.textbook_id,
            status=p.status,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in proposals
    ]


@router.post("/topic-proposals", response_model=TopicProposalResponse)
async def create_topic_proposal(
    body: TopicProposalCreate,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a topic proposal for admin approval."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if not instructor and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")
    if not instructor:
        raise HTTPException(status_code=403, detail="Only instructors can create topic proposals")
    proposal = TopicProposal(
        instructor_id=instructor.instructor_id,
        topic_name=body.topic_name,
        status="pending",
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return TopicProposalResponse(
        id=proposal.id,
        topic_name=proposal.topic_name,
        status=proposal.status,
        created_at=proposal.created_at.isoformat() if proposal.created_at else None,
    )


@router.get("/options/universities")
async def list_universities(db: AsyncSession = Depends(get_db)):
    """List universities for course proposal dropdown."""
    result = await db.execute(select(University.university_id, University.name))
    return [{"id": r[0], "name": r[1]} for r in result]


@router.get("/options/programs")
async def list_programs(db: AsyncSession = Depends(get_db)):
    """List programs for course proposal dropdown."""
    result = await db.execute(select(Program.program_id, Program.program_name))
    return [{"id": r[0], "name": r[1]} for r in result]


@router.get("/options/textbooks")
async def list_textbooks(db: AsyncSession = Depends(get_db)):
    """List textbooks for course proposal dropdown."""
    result = await db.execute(select(Textbook.textbook_id, Textbook.title))
    return [{"id": r[0], "title": r[1]} for r in result]


@router.get("/topic-proposals", response_model=List[TopicProposalResponse])
async def list_my_topic_proposals(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List current instructor's topic proposals."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    if not instructor and current_user.role != "admin":
        return []
    if not instructor:
        return []
    stmt = select(TopicProposal).where(TopicProposal.instructor_id == instructor.instructor_id)
    result = await db.execute(stmt)
    proposals = result.scalars().all()
    return [
        TopicProposalResponse(
            id=p.id,
            topic_name=p.topic_name,
            status=p.status,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in proposals
    ]


@router.get("/courses/{course_id}/content-items", response_model=List[ContentItemResponse])
async def get_course_content(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all content items for a course."""
    stmt = select(ContentItem).where(ContentItem.course_id == course_id)
    result = await db.execute(stmt)
    return result.scalars().all()

# ── POST /instructor/courses/{id}/content-items ──────────────────

@router.post("/courses/{course_id}/content-items")
async def add_content_item(
    course_id: int,
    item: ContentItemCreate,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a content item to a course."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    new_content = ContentItem(
        course_id=course_id,
        title=item.title,
        content_type=item.content_type,
        url=item.url
    )
    db.add(new_content)
    await db.commit()
    await db.refresh(new_content)
    return {"message": "Content added successfully", "content_id": new_content.content_id}

# ── DELETE /instructor/courses/{id}/content-items/{content_id} ───

@router.delete("/courses/{course_id}/content-items/{content_id}")
async def delete_content_item(
    course_id: int,
    content_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a content item from a course."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    result = await db.execute(
        select(ContentItem).where(
            and_(ContentItem.content_id == content_id, ContentItem.course_id == course_id)
        )
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content item not found")
    
    await db.delete(content)
    await db.commit()
    return {"message": "Content item deleted successfully"}

# ── PUT /instructor/enrollments/{student_id}/{course_id} ─────────

@router.put("/enrollments/{student_id}/{course_id}")
async def grade_student(
    student_id: int,
    course_id: int,
    grade: GradeUpdate,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Grade a student — update evaluation_score with audit logging."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    # Find the enrollment
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == student_id,
                Enrollment.course_id == course_id
            )
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    old_score = enrollment.evaluation_score

    # Insert audit log entry (application-level audit)
    audit_entry = AuditLog(
        student_id=student_id,
        course_id=course_id,
        old_score=old_score,
        new_score=grade.evaluation_score,
        changed_by=f"instructor_{instructor.instructor_id}" if instructor else f"admin_{current_user.id}"
    )
    db.add(audit_entry)

    # Update the score
    enrollment.evaluation_score = grade.evaluation_score
    await db.commit()

    return {
        "message": "Grade updated successfully",
        "student_id": student_id,
        "course_id": course_id,
        "old_score": old_score,
        "new_score": grade.evaluation_score
    }

# ── GET /instructor/courses/{id}/analytics ───────────────────────

@router.get("/courses/{course_id}/analytics", response_model=AnalyticsResponse)
async def get_course_analytics(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get analytics for a specific course — score distribution, pass rate, at-risk count."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    # Score distribution using SUM(CASE WHEN ...) — universally compatible
    stmt = select(
        func.sum(case(
            (and_(Enrollment.evaluation_score >= 0, Enrollment.evaluation_score <= 20), 1),
            else_=0
        )).label("bucket_0_20"),
        func.sum(case(
            (and_(Enrollment.evaluation_score >= 21, Enrollment.evaluation_score <= 40), 1),
            else_=0
        )).label("bucket_21_40"),
        func.sum(case(
            (and_(Enrollment.evaluation_score >= 41, Enrollment.evaluation_score <= 60), 1),
            else_=0
        )).label("bucket_41_60"),
        func.sum(case(
            (and_(Enrollment.evaluation_score >= 61, Enrollment.evaluation_score <= 80), 1),
            else_=0
        )).label("bucket_61_80"),
        func.sum(case(
            (and_(Enrollment.evaluation_score >= 81, Enrollment.evaluation_score <= 100), 1),
            else_=0
        )).label("bucket_81_100"),
        func.count().label("total"),
        func.sum(case(
            (Enrollment.evaluation_score >= 40, 1),
            else_=0
        )).label("passed"),
        func.sum(case(
            ((Enrollment.evaluation_score < 40) | (Enrollment.evaluation_score.is_(None)), 1),
            else_=0
        )).label("at_risk"),
        func.avg(Enrollment.evaluation_score).label("avg_score"),
    ).where(
        Enrollment.course_id == course_id,
        Enrollment.status == "approved",
    )

    result = await db.execute(stmt)
    row = result.one()

    total = row.total or 0
    passed = row.passed or 0

    return AnalyticsResponse(
        distribution={
            "0-20": row.bucket_0_20 or 0,
            "21-40": row.bucket_21_40 or 0,
            "41-60": row.bucket_41_60 or 0,
            "61-80": row.bucket_61_80 or 0,
            "81-100": row.bucket_81_100 or 0,
        },
        pass_rate=round((passed / total) * 100, 1) if total > 0 else 0.0,
        at_risk_count=row.at_risk or 0,
        total_students=total,
        avg_score=round(row.avg_score, 2) if row.avg_score else None
    )

# ── Topic ↔ Course Linking ────────────────────────────────────────

@router.get("/options/topics")
async def list_topics(db: AsyncSession = Depends(get_db)):
    """List all available topics."""
    result = await db.execute(select(Topic.topic_id, Topic.topic_name))
    return [{"id": r[0], "name": r[1]} for r in result]


@router.get("/courses/{course_id}/topics")
async def get_course_topics(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get topics linked to a course."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    stmt = (
        select(Topic)
        .join(CourseTopic, CourseTopic.topic_id == Topic.topic_id)
        .where(CourseTopic.course_id == course_id)
    )
    result = await db.execute(stmt)
    topics = result.scalars().all()
    return [{"id": t.topic_id, "name": t.topic_name} for t in topics]


@router.post("/courses/{course_id}/topics")
async def add_topic_to_course(
    course_id: int,
    body: TopicLinkRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Link an approved topic to a course."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    # Verify topic exists
    topic_res = await db.execute(select(Topic).where(Topic.topic_id == body.topic_id))
    topic = topic_res.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Check if already linked
    existing = await db.execute(
        select(CourseTopic).where(
            and_(
                CourseTopic.course_id == course_id,
                CourseTopic.topic_id == body.topic_id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Topic already linked to this course")

    new_link = CourseTopic(course_id=course_id, topic_id=body.topic_id)
    db.add(new_link)
    await db.commit()
    return {"message": "Topic added to course"}


@router.delete("/courses/{course_id}/topics/{topic_id}")
async def remove_topic_from_course(
    course_id: int,
    topic_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a topic from a course."""
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    await db.execute(
        sql_delete(CourseTopic).where(
            and_(
                CourseTopic.course_id == course_id,
                CourseTopic.topic_id == topic_id
            )
        )
    )
    await db.commit()
    return {"message": "Topic removed from course"}


# ── GET /instructor/stats ────────────────────────────────────────

@router.get("/stats")
async def get_instructor_stats(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for the current instructor."""
    instructor = await get_instructor_from_user(current_user, db)
    
    if not instructor:
        return {"total_courses": 0, "total_students": 0, "avg_student_score": None}

    # Count courses
    course_count_stmt = select(func.count(TeachingAssignment.course_id)).where(
        TeachingAssignment.instructor_id == instructor.instructor_id
    )
    course_count = (await db.execute(course_count_stmt)).scalar() or 0
    
    # Count total students (approved enrollments only) across all courses
    student_count_stmt = (
        select(func.count(func.distinct(Enrollment.student_id)))
        .join(TeachingAssignment, TeachingAssignment.course_id == Enrollment.course_id)
        .where(
            TeachingAssignment.instructor_id == instructor.instructor_id,
            Enrollment.status == "approved",
        )
    )
    student_count = (await db.execute(student_count_stmt)).scalar() or 0
    
    # Average score across approved enrollments in instructor's courses
    avg_score_stmt = (
        select(func.avg(Enrollment.evaluation_score))
        .join(TeachingAssignment, TeachingAssignment.course_id == Enrollment.course_id)
        .where(
            and_(
                TeachingAssignment.instructor_id == instructor.instructor_id,
                Enrollment.status == "approved",
                Enrollment.evaluation_score.isnot(None)
            )
        )
    )
    avg_score = (await db.execute(avg_score_stmt)).scalar()
    
    return {
        "total_courses": course_count,
        "total_students": student_count,
        "avg_student_score": round(avg_score, 2) if avg_score else None
    }

# ═══════════════════════════════════════════════════════════════════
#  ADVANCED DBMS FEATURES
# ═══════════════════════════════════════════════════════════════════

# ── GET /instructor/courses/{id}/rankings (Window Functions) ─────

@router.get("/courses/{course_id}/rankings")
async def get_student_rankings(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Advanced Analytics: Uses PostgreSQL window functions
    - RANK()         : class rank (ties get same rank)
    - DENSE_RANK()   : no gaps in rank sequence
    - PERCENT_RANK() : percentile position (0.0 = worst, 1.0 = best)
    - ROW_NUMBER()   : unique ordering

    Demonstrates: Window Functions (OVER, PARTITION BY, ORDER BY)
    """
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    # Raw SQL with window functions — cannot be expressed cleanly in ORM
    stmt = text("""
        SELECT
            s.student_id,
            s.full_name,
            s.email,
            e.evaluation_score,
            RANK()         OVER (ORDER BY e.evaluation_score DESC NULLS LAST) AS rank,
            DENSE_RANK()   OVER (ORDER BY e.evaluation_score DESC NULLS LAST) AS dense_rank,
            PERCENT_RANK() OVER (ORDER BY e.evaluation_score ASC  NULLS FIRST) AS percentile,
            ROW_NUMBER()   OVER (ORDER BY e.evaluation_score DESC NULLS LAST) AS row_num,
            COUNT(*)       OVER () AS total_students,
            AVG(e.evaluation_score) OVER () AS class_avg
        FROM enrollment e
        JOIN student s ON s.student_id = e.student_id
        WHERE e.course_id = :course_id AND e.status = 'approved'
        ORDER BY rank ASC
    """)

    result = await db.execute(stmt, {"course_id": course_id})
    rows = result.fetchall()

    rankings = []
    for row in rows:
        rankings.append({
            "student_id": row[0],
            "full_name": row[1],
            "email": row[2],
            "evaluation_score": row[3],
            "rank": row[4],
            "dense_rank": row[5],
            "percentile": round(float(row[6]) * 100, 1) if row[6] is not None else None,
            "row_number": row[7],
            "total_students": row[8],
            "class_average": round(float(row[9]), 2) if row[9] is not None else None,
        })

    return {
        "course_id": course_id,
        "ranking_method": "Window Functions: RANK(), DENSE_RANK(), PERCENT_RANK(), ROW_NUMBER()",
        "students": rankings
    }

# ── GET /instructor/courses/{id}/audit-log (Trigger + Audit) ────

@router.get("/courses/{course_id}/audit-log")
async def get_course_audit_log(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Audit Log Viewer: Shows grade change history captured by the
    database trigger `trg_audit_grade_change`.

    Demonstrates: Active Database (Triggers), Audit Trail Querying
    """
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    stmt = text("""
        SELECT
            al.log_id,
            al.student_id,
            s.full_name AS student_name,
            al.old_score,
            al.new_score,
            (al.new_score - COALESCE(al.old_score, 0)) AS score_delta,
            al.changed_by,
            al.changed_at
        FROM audit_log al
        LEFT JOIN student s ON s.student_id = al.student_id
        WHERE al.course_id = :course_id
        ORDER BY al.changed_at DESC
        LIMIT 50
    """)

    result = await db.execute(stmt, {"course_id": course_id})
    rows = result.fetchall()

    entries = []
    for row in rows:
        entries.append({
            "audit_id": row[0],
            "student_id": row[1],
            "student_name": row[2],
            "old_score": row[3],
            "new_score": row[4],
            "score_delta": row[5],
            "changed_by": row[6],
            "changed_at": str(row[7]) if row[7] else None,
        })

    return {
        "course_id": course_id,
        "feature": "DB Trigger: trg_audit_grade_change -> audit_log table",
        "total_entries": len(entries),
        "entries": entries
    }

# ── POST /instructor/courses/{id}/safe-enroll (Pessimistic Lock) ─

class SafeEnrollRequest(BaseModel):
    student_id: int

@router.post("/courses/{course_id}/safe-enroll")
async def safe_enroll_student(
    course_id: int,
    request: SafeEnrollRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Safe Enrollment with Pessimistic Locking (SELECT ... FOR UPDATE).
    Prevents race conditions when multiple users try to enroll in the
    last remaining seat simultaneously.

    Flow:
    1. Lock the course row (SELECT FOR UPDATE)
    2. Check if current_enrollment < max_capacity
    3. Check if student is not already enrolled
    4. Insert enrollment
    5. The enrollment count trigger auto-increments current_enrollment

    Demonstrates: Transaction Isolation, Pessimistic Locking, Concurrency Control
    """
    instructor = await get_instructor_from_user(current_user, db)
    await verify_course_ownership(instructor, course_id, current_user, db)

    student_id = request.student_id

    try:
        # Step 1: Lock the course row — no other transaction can modify it
        lock_result = await db.execute(
            text("SELECT course_id, course_name, max_capacity, current_enrollment "
                 "FROM course WHERE course_id = :cid FOR UPDATE"),
            {"cid": course_id}
        )
        course_row = lock_result.fetchone()

        if not course_row:
            raise HTTPException(status_code=404, detail="Course not found")

        course_name = course_row[1]
        max_cap = course_row[2]
        current_enr = course_row[3]

        # Step 2: Capacity check (inside the lock)
        if current_enr >= max_cap:
            raise HTTPException(
                status_code=409,
                detail=f"Course '{course_name}' is full ({current_enr}/{max_cap})"
            )

        # Step 3: Duplicate check
        dup_result = await db.execute(
            text("SELECT 1 FROM enrollment WHERE student_id = :sid AND course_id = :cid"),
            {"sid": student_id, "cid": course_id}
        )
        if dup_result.fetchone():
            raise HTTPException(
                status_code=409,
                detail=f"Student {student_id} is already enrolled in '{course_name}'"
            )

        # Step 4: Verify student exists
        student_result = await db.execute(
            text("SELECT full_name FROM student WHERE student_id = :sid"),
            {"sid": student_id}
        )
        student_row = student_result.fetchone()
        if not student_row:
            raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

        # Step 5: Insert enrollment (trigger auto-updates current_enrollment)
        await db.execute(
            text("INSERT INTO enrollment (student_id, course_id, enroll_date, status) VALUES (:sid, :cid, CURRENT_DATE, 'approved')"),
            {"sid": student_id, "cid": course_id}
        )

        await db.commit()

        return {
            "message": "Student enrolled successfully (with pessimistic lock)",
            "student_id": student_id,
            "student_name": student_row[0],
            "course_id": course_id,
            "course_name": course_name,
            "enrollment_count": f"{current_enr + 1}/{max_cap}",
            "locking_method": "SELECT ... FOR UPDATE (Pessimistic Lock)"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


# --- Textbook management (instructor + admin) ---

class TextbookCreateRequest(BaseModel):
    title: str
    isbn: Optional[str] = None
    url: Optional[str] = None

@router.post("/textbooks")
async def create_textbook(
    body: TextbookCreateRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new textbook record. Instructors and admins can use this."""
    # Check for duplicate ISBN if provided
    if body.isbn:
        existing = await db.execute(select(Textbook).where(Textbook.isbn == body.isbn))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Textbook with this ISBN already exists")

    textbook = Textbook(title=body.title, isbn=body.isbn, url=body.url)
    db.add(textbook)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    await db.refresh(textbook)
    return {"message": "Textbook created", "textbook_id": textbook.textbook_id}

@router.get("/textbooks")
async def list_textbooks(db: AsyncSession = Depends(get_db)):
    """List all textbooks."""
    result = await db.execute(select(Textbook).order_by(Textbook.title))
    return [{"textbook_id": t.textbook_id, "title": t.title, "isbn": t.isbn, "url": t.url} for t in result.scalars().all()]
