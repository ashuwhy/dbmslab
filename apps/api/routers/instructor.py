from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date
from database import get_db
from models import Course, TeachingAssignment, ContentItem, Instructor, AppUser, Enrollment, Student, CourseProposal, TopicProposal, University, Program, Textbook, Topic
from dependencies import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter(
    prefix="/instructor",
    tags=["instructor"],
    dependencies=[Depends(RoleChecker(["instructor", "admin"]))]
)

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
    # Find instructor record
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    
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

@router.get("/courses/{course_id}/students", response_model=List[StudentInCourse])
async def get_course_students(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all students enrolled in a course."""
    # Verify instructor teaches this course
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
        if not assignment.scalar_one_or_none():
            # Check if admin
            if current_user.role != "admin":
                raise HTTPException(status_code=403, detail="You are not assigned to this course")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an instructor")

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

@router.post("/courses/{course_id}/content-items")
async def add_content_item(
    course_id: int,
    item: ContentItemCreate,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a content item to a course."""
    # Verify instructor teaches this course
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    
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

@router.get("/stats")
async def get_instructor_stats(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for the current instructor."""
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    
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
