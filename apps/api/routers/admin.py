from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
from models import AppUser, TeachingAssignment, Student, Enrollment, Instructor, Course, University, Program, CourseProposal, TopicProposal, Topic, Textbook, Executive, CourseTopic
from dependencies import RoleChecker
from routers.auth import get_password_hash
from pydantic import BaseModel

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(RoleChecker(["admin"]))]
)

# Schemas
class UserCreateRequest(BaseModel):
    email: str
    password: str
    role: str
    # Student specific fields
    full_name: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    skill_level: Optional[str] = None
    # Instructor specific fields
    teaching_years: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: str

class AssignInstructorRequest(BaseModel):
    instructor_id: int
    role: str = "instructor"

class CourseResponse(BaseModel):
    course_id: int
    course_name: str
    duration_weeks: int
    university_name: Optional[str] = None
    program_name: Optional[str] = None
    enrollment_count: int = 0
    instructor_names: Optional[str] = None

class InstructorResponse(BaseModel):
    instructor_id: int
    full_name: str
    email: Optional[str] = None

class StudentResponse(BaseModel):
    student_id: int
    full_name: str
    email: Optional[str] = None
    country: str
    age: int
    skill_level: Optional[str] = None

class DashboardStats(BaseModel):
    total_users: int
    total_courses: int
    total_students: int
    total_instructors: int
    total_instructors: int
    total_enrollments: int

class StudentUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None
    age: Optional[int] = None
    skill_level: Optional[str] = None

class InstructorUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None

class CourseUpdateRequest(BaseModel):
    course_name: Optional[str] = None
    duration_weeks: Optional[int] = None
    university_id: Optional[int] = None
    program_id: Optional[int] = None
    topic_ids: Optional[List[int]] = None


class CourseCreateRequest(BaseModel):
    course_name: str
    duration_weeks: int
    university_id: int
    program_id: int
    textbook_id: int
    max_capacity: Optional[int] = 100
    topic_ids: Optional[List[int]] = []


class ApproveCourseProposalRequest(BaseModel):
    topic_ids: Optional[List[int]] = []


class PendingInstructorResponse(BaseModel):
    id: int
    email: str
    full_name: str
    teaching_years: Optional[int] = None

    class Config:
        from_attributes = True


class PendingAnalystResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class CourseProposalListItem(BaseModel):
    id: int
    instructor_id: int
    instructor_name: str
    course_name: str
    duration_weeks: int
    status: str


class TopicProposalListItem(BaseModel):
    id: int
    instructor_id: int
    instructor_name: str
    topic_name: str
    status: str


# Endpoints
@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics for admin."""
    users = (await db.execute(select(func.count(AppUser.id)))).scalar() or 0
    courses = (await db.execute(select(func.count(Course.course_id)))).scalar() or 0
    students = (await db.execute(select(func.count(Student.student_id)))).scalar() or 0
    instructors = (await db.execute(select(func.count(Instructor.instructor_id)))).scalar() or 0
    enrollments = (await db.execute(select(func.count()).select_from(Enrollment))).scalar() or 0
    
    return DashboardStats(
        total_users=users,
        total_courses=courses,
        total_students=students,
        total_instructors=instructors,
        total_enrollments=enrollments
    )

@router.get("/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all app users."""
    result = await db.execute(select(AppUser))
    return result.scalars().all()

@router.post("/users")
async def create_user(
    user: UserCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user."""
    result = await db.execute(select(AppUser).where(AppUser.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    # Admin-created instructor/analyst are immediately approved
    now_utc = datetime.now(timezone.utc)
    approved_at = now_utc if user.role in ("instructor", "analyst", "admin") else None
    db_user = AppUser(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        approved_at=approved_at,
    )
    db.add(db_user)
    
    # If role is instructor, create Instructor record and approve
    if user.role == "instructor":
        if not user.full_name:
            raise HTTPException(status_code=400, detail="Full name is required for instructor users")
        instructor = Instructor(
            full_name=user.full_name,
            email=user.email,
            teaching_years=user.teaching_years,
        )
        db.add(instructor)
    
    # If role is admin or analyst, create Executive record (stores full_name)
    if user.role in ("admin", "analyst"):
        if not user.full_name:
            raise HTTPException(status_code=400, detail="Full name is required for admin and analyst users")
        await db.flush()
        executive = Executive(
            app_user_id=db_user.id,
            full_name=user.full_name,
            executive_type=user.role,
        )
        db.add(executive)

    # If role is student, create Student record
    if user.role == "student":
        if not all([user.full_name, user.age, user.country]):
            raise HTTPException(
                status_code=400, 
                detail="Full name, age, and country are required for student users"
            )
            
        if user.age < 13:
            raise HTTPException(
                status_code=400,
                detail="Student must be at least 13 years old"
            )
            
        student = Student(
            email=user.email,
            full_name=user.full_name,
            age=user.age,
            country=user.country,
            skill_level=user.skill_level or "beginner",
            category="student"
        )
        db.add(student)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        # Clean up the error message
        error_msg = str(e)
        if "student_age_check" in error_msg:
            raise HTTPException(status_code=400, detail="Student must be at least 13 years old")
        raise HTTPException(status_code=400, detail=str(e))
    await db.refresh(db_user)
    return {"message": "User created successfully", "user_id": db_user.id}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a user and all related records (student/instructor/executive + dependents)."""
    result = await db.execute(select(AppUser).where(AppUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Clean up role-specific records linked by email (not FK-cascaded)
    if user.role == "student":
        stu_result = await db.execute(select(Student).where(Student.email == user.email))
        student = stu_result.scalar_one_or_none()
        if student:
            # Delete enrollments (trigger trg_auto_enrollment_count auto-decrements counters)
            await db.execute(delete(Enrollment).where(Enrollment.student_id == student.student_id))
            await db.execute(delete(Student).where(Student.student_id == student.student_id))

    elif user.role == "instructor":
        inst_result = await db.execute(select(Instructor).where(Instructor.email == user.email))
        instructor = inst_result.scalar_one_or_none()
        if instructor:
            # teaching_assignments, course_proposals, topic_proposals cascade via DB FK
            await db.execute(delete(Instructor).where(Instructor.instructor_id == instructor.instructor_id))

    # Executive is FK-cascaded (app_user_id ON DELETE CASCADE), deleted automatically

    await db.execute(delete(AppUser).where(AppUser.id == user_id))
    await db.commit()
    return {"message": "User deleted"}


@router.get("/pending-instructors", response_model=List[PendingInstructorResponse])
async def list_pending_instructors(db: AsyncSession = Depends(get_db)):
    """List instructors waiting for admin approval (approved_at is null)."""
    stmt = (
        select(AppUser.id, AppUser.email, Instructor.full_name, Instructor.teaching_years)
        .join(Instructor, Instructor.email == AppUser.email)
        .where(AppUser.role == "instructor", AppUser.approved_at.is_(None))
    )
    result = await db.execute(stmt)
    return [
        PendingInstructorResponse(
            id=row[0],
            email=row[1],
            full_name=row[2],
            teaching_years=row[3],
        )
        for row in result
    ]


@router.get("/pending-analysts", response_model=List[PendingAnalystResponse])
async def list_pending_analysts(db: AsyncSession = Depends(get_db)):
    """List analysts waiting for admin approval (approved_at is null)."""
    result = await db.execute(
        select(AppUser).where(AppUser.role == "analyst", AppUser.approved_at.is_(None))
    )
    users = result.scalars().all()
    return [PendingAnalystResponse(id=u.id, email=u.email) for u in users]


@router.post("/approve-instructor/{user_id}")
async def approve_instructor(user_id: int, db: AsyncSession = Depends(get_db)):
    """Set approved_at for an instructor so they can log in and use instructor routes."""
    result = await db.execute(select(AppUser).where(AppUser.id == user_id, AppUser.role == "instructor"))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or not an instructor")
    user.approved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Instructor approved"}


@router.post("/approve-analyst/{user_id}")
async def approve_analyst(user_id: int, db: AsyncSession = Depends(get_db)):
    """Set approved_at for an analyst so they can log in and use analyst routes."""
    result = await db.execute(select(AppUser).where(AppUser.id == user_id, AppUser.role == "analyst"))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or not an analyst")
    user.approved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Analyst approved"}


@router.get("/course-proposals", response_model=List[CourseProposalListItem])
async def list_pending_course_proposals(db: AsyncSession = Depends(get_db)):
    """List course proposals with status pending."""
    stmt = (
        select(CourseProposal, Instructor.full_name)
        .join(Instructor, CourseProposal.instructor_id == Instructor.instructor_id)
        .where(CourseProposal.status == "pending")
    )
    result = await db.execute(stmt)
    return [
        CourseProposalListItem(
            id=row[0].id,
            instructor_id=row[0].instructor_id,
            instructor_name=row[1],
            course_name=row[0].course_name,
            duration_weeks=row[0].duration_weeks,
            status=row[0].status,
        )
        for row in result
    ]


@router.post("/course-proposals/{proposal_id}/approve")
async def approve_course_proposal(
    proposal_id: int,
    body: Optional[ApproveCourseProposalRequest] = Body(None),
    db: AsyncSession = Depends(get_db),
):
    """Create Course from proposal, assign instructor, link topics; set proposal status approved."""
    if body is None:
        body = ApproveCourseProposalRequest()
    result = await db.execute(select(CourseProposal).where(CourseProposal.id == proposal_id, CourseProposal.status == "pending"))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or already processed")
    course = Course(
        course_name=proposal.course_name,
        duration_weeks=proposal.duration_weeks,
        university_id=proposal.university_id,
        program_id=proposal.program_id,
        textbook_id=proposal.textbook_id,
        max_capacity=100,
        current_enrollment=0,
    )
    db.add(course)
    await db.flush()
    db.add(TeachingAssignment(
        instructor_id=proposal.instructor_id,
        course_id=course.course_id,
        role="instructor",
    ))
    for topic_id in body.topic_ids or []:
        existing = (await db.execute(select(Topic).where(Topic.topic_id == topic_id))).scalar_one_or_none()
        if existing:
            db.add(CourseTopic(course_id=course.course_id, topic_id=topic_id))
    proposal.status = "approved"
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        msg = str(e.orig) if getattr(e, "orig", None) else str(e)
        if "course_name" in msg or "unique" in msg.lower():
            raise HTTPException(status_code=400, detail="A course with this name already exists")
        if "foreign key" in msg.lower() or "violates" in msg.lower():
            raise HTTPException(status_code=400, detail="Invalid university, program, textbook, or instructor reference")
        raise HTTPException(status_code=400, detail="Database constraint violation")
    return {"message": "Course approved and created", "course_id": course.course_id}


@router.post("/course-proposals/{proposal_id}/reject")
async def reject_course_proposal(proposal_id: int, db: AsyncSession = Depends(get_db)):
    """Set course proposal status to rejected."""
    result = await db.execute(select(CourseProposal).where(CourseProposal.id == proposal_id, CourseProposal.status == "pending"))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or already processed")
    proposal.status = "rejected"
    await db.commit()
    return {"message": "Proposal rejected"}


@router.get("/topic-proposals", response_model=List[TopicProposalListItem])
async def list_pending_topic_proposals(db: AsyncSession = Depends(get_db)):
    """List topic proposals with status pending."""
    stmt = (
        select(TopicProposal, Instructor.full_name)
        .join(Instructor, TopicProposal.instructor_id == Instructor.instructor_id)
        .where(TopicProposal.status == "pending")
    )
    result = await db.execute(stmt)
    return [
        TopicProposalListItem(
            id=row[0].id,
            instructor_id=row[0].instructor_id,
            instructor_name=row[1],
            topic_name=row[0].topic_name,
            status=row[0].status,
        )
        for row in result
    ]


@router.post("/topic-proposals/{proposal_id}/approve")
async def approve_topic_proposal(proposal_id: int, db: AsyncSession = Depends(get_db)):
    """Create Topic if not exists; set proposal status approved."""
    result = await db.execute(select(TopicProposal).where(TopicProposal.id == proposal_id, TopicProposal.status == "pending"))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or already processed")
    existing = await db.execute(select(Topic).where(Topic.topic_name == proposal.topic_name))
    if not existing.scalar_one_or_none():
        topic = Topic(topic_name=proposal.topic_name)
        db.add(topic)
    proposal.status = "approved"
    await db.commit()
    return {"message": "Topic proposal approved"}


@router.post("/topic-proposals/{proposal_id}/reject")
async def reject_topic_proposal(proposal_id: int, db: AsyncSession = Depends(get_db)):
    """Set topic proposal status to rejected."""
    result = await db.execute(select(TopicProposal).where(TopicProposal.id == proposal_id, TopicProposal.status == "pending"))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or already processed")
    proposal.status = "rejected"
    await db.commit()
    return {"message": "Proposal rejected"}


@router.get("/topics")
async def list_topics(db: AsyncSession = Depends(get_db)):
    """List all topics for linking to courses."""
    result = await db.execute(select(Topic).order_by(Topic.topic_name))
    return [{"topic_id": t.topic_id, "topic_name": t.topic_name} for t in result.scalars().all()]


@router.post("/courses")
async def create_course(body: CourseCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new course (admin) and link topics via course_topic."""
    course = Course(
        course_name=body.course_name,
        duration_weeks=body.duration_weeks,
        university_id=body.university_id,
        program_id=body.program_id,
        textbook_id=body.textbook_id,
        max_capacity=body.max_capacity or 100,
    )
    db.add(course)
    await db.flush()
    topic_ids = body.topic_ids or []
    for topic_id in topic_ids:
        existing = (await db.execute(select(Topic).where(Topic.topic_id == topic_id))).scalar_one_or_none()
        if existing:
            db.add(CourseTopic(course_id=course.course_id, topic_id=topic_id))
    await db.commit()
    await db.refresh(course)
    return {"message": "Course created", "course_id": course.course_id}


class CourseDetailForAdmin(BaseModel):
    course_id: int
    course_name: str
    duration_weeks: int
    university_id: int
    program_id: int
    textbook_id: int
    max_capacity: int
    topic_ids: List[int] = []

    class Config:
        from_attributes = True


@router.get("/courses/{course_id}", response_model=CourseDetailForAdmin)
async def get_course_for_admin(course_id: int, db: AsyncSession = Depends(get_db)):
    """Get one course with topic_ids for admin edit. Joins course_topic in DB."""
    stmt = (
        select(Course)
        .options(selectinload(Course.topics))
        .where(Course.course_id == course_id)
    )
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    topic_ids = [ct.topic_id for ct in course.topics] if course.topics else []
    return CourseDetailForAdmin(
        course_id=course.course_id,
        course_name=course.course_name,
        duration_weeks=course.duration_weeks,
        university_id=course.university_id,
        program_id=course.program_id,
        textbook_id=course.textbook_id,
        max_capacity=course.max_capacity,
        topic_ids=topic_ids,
    )


@router.get("/courses", response_model=List[CourseResponse])
async def list_courses(db: AsyncSession = Depends(get_db)):
    """List all courses with enrollment counts and assigned instructors."""
    stmt = (
        select(
            Course,
            University.name.label("university_name"),
            Program.program_name,
            func.count(func.distinct(Enrollment.student_id)).label("enrollment_count"),
            func.string_agg(func.distinct(Instructor.full_name), ', ').label("instructor_names")
        )
        .outerjoin(University, Course.university_id == University.university_id)
        .outerjoin(Program, Course.program_id == Program.program_id)
        .outerjoin(Enrollment, and_(Enrollment.course_id == Course.course_id, Enrollment.status == "approved"))
        .outerjoin(TeachingAssignment, Course.course_id == TeachingAssignment.course_id)
        .outerjoin(Instructor, TeachingAssignment.instructor_id == Instructor.instructor_id)
        .group_by(Course.course_id, University.name, Program.program_name)
    )
    result = await db.execute(stmt)
    
    courses = []
    for row in result:
        courses.append(CourseResponse(
            course_id=row[0].course_id,
            course_name=row[0].course_name,
            duration_weeks=row[0].duration_weeks,
            university_name=row[1],
            program_name=row[2],
            enrollment_count=row[3] or 0,
            instructor_names=row[4]
        ))
    return courses


@router.get("/universities")
async def list_universities(db: AsyncSession = Depends(get_db)):
    """List universities for course creation dropdown."""
    result = await db.execute(select(University))
    return [{"university_id": u.university_id, "name": u.name} for u in result.scalars().all()]


@router.get("/programs")
async def list_programs(db: AsyncSession = Depends(get_db)):
    """List programs for course creation dropdown."""
    result = await db.execute(select(Program))
    return [{"program_id": p.program_id, "program_name": p.program_name} for p in result.scalars().all()]


@router.get("/textbooks")
async def list_textbooks(db: AsyncSession = Depends(get_db)):
    """List textbooks for course creation dropdown."""
    result = await db.execute(select(Textbook))
    return [{"textbook_id": t.textbook_id, "title": t.title} for t in result.scalars().all()]


@router.get("/instructors", response_model=List[InstructorResponse])
async def list_instructors(db: AsyncSession = Depends(get_db)):
    """List all instructors."""
    result = await db.execute(select(Instructor))
    return result.scalars().all()

@router.get("/students", response_model=List[StudentResponse])
async def list_students(db: AsyncSession = Depends(get_db)):
    """List all students."""
    result = await db.execute(select(Student))
    return result.scalars().all()

@router.post("/courses/{course_id}/assign-instructor")
async def assign_instructor(
    course_id: int,
    request: AssignInstructorRequest,
    db: AsyncSession = Depends(get_db)
):
    """Assign an instructor to a course."""
    # Check if course exists
    course = (await db.execute(select(Course).where(Course.course_id == course_id))).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if instructor exists
    instructor = (await db.execute(select(Instructor).where(Instructor.instructor_id == request.instructor_id))).scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    
    # Check if assignment exists
    existing = await db.execute(
        select(TeachingAssignment).where(
            (TeachingAssignment.course_id == course_id) & 
            (TeachingAssignment.instructor_id == request.instructor_id)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Instructor already assigned to this course")

    new_assignment = TeachingAssignment(
        course_id=course_id,
        instructor_id=request.instructor_id,
        role=request.role
    )
    db.add(new_assignment)
    await db.commit()
    return {"message": "Instructor assigned successfully"}

@router.delete("/courses/{course_id}/instructors/{instructor_id}")
async def remove_instructor_assignment(
    course_id: int,
    instructor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Remove an instructor from a course."""
    await db.execute(
        delete(TeachingAssignment).where(
            (TeachingAssignment.course_id == course_id) & 
            (TeachingAssignment.instructor_id == instructor_id)
        )
    )
    await db.commit()
    return {"message": "Instructor removed from course"}

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a student and cascade to enrollments (trigger handles counter updates)."""
    student = (await db.execute(select(Student).where(Student.student_id == student_id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Delete enrollments (trigger trg_auto_enrollment_count auto-decrements counters)
    await db.execute(delete(Enrollment).where(Enrollment.student_id == student_id))

    # Also remove the linked AppUser if it exists
    if student.email:
        await db.execute(delete(AppUser).where(AppUser.email == student.email))

    await db.execute(delete(Student).where(Student.student_id == student_id))
    await db.commit()
    return {"message": "Student deleted"}

@router.delete("/enrollments/{student_id}/{course_id}")
async def delete_enrollment(
    student_id: int,
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an enrollment (trigger handles counter update)."""
    # Check enrollment exists
    enr_result = await db.execute(
        select(Enrollment).where(
            (Enrollment.student_id == student_id) &
            (Enrollment.course_id == course_id)
        )
    )
    enrollment = enr_result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Delete — trigger trg_auto_enrollment_count auto-decrements course.current_enrollment
    await db.execute(
        delete(Enrollment).where(
            (Enrollment.student_id == student_id) &
            (Enrollment.course_id == course_id)
        )
    )
    await db.commit()
    return {"message": "Enrollment deleted"}

@router.get("/course-assignments/{course_id}", response_model=List[InstructorResponse])
async def get_course_instructors(course_id: int, db: AsyncSession = Depends(get_db)):
    """Get all instructors assigned to a course."""
    stmt = (
        select(Instructor)
        .join(TeachingAssignment, TeachingAssignment.instructor_id == Instructor.instructor_id)
        .where(TeachingAssignment.course_id == course_id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/students/{student_id}")
async def update_student(
    student_id: int,
    student_update: StudentUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update student details."""
    result = await db.execute(select(Student).where(Student.student_id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student_update.full_name is not None:
        student.full_name = student_update.full_name
    if student_update.email is not None:
        student.email = student_update.email
    if student_update.country is not None:
        student.country = student_update.country
    if student_update.age is not None:
        student.age = student_update.age
    if student_update.skill_level is not None:
        student.skill_level = student_update.skill_level

    await db.commit()
    await db.refresh(student)
    return {"message": "Student updated successfully", "student": {
        "student_id": student.student_id,
        "full_name": student.full_name,
        "email": student.email,
        "country": student.country,
        "age": student.age,
        "skill_level": student.skill_level
    }}

@router.put("/courses/{course_id}")
async def update_course(
    course_id: int,
    course_update: CourseUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update course details and optionally replace topic links via course_topic."""
    result = await db.execute(select(Course).where(Course.course_id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course_update.course_name is not None:
        course.course_name = course_update.course_name
    if course_update.duration_weeks is not None:
        course.duration_weeks = course_update.duration_weeks
    if course_update.university_id is not None:
        course.university_id = course_update.university_id
    if course_update.program_id is not None:
        course.program_id = course_update.program_id

    if course_update.topic_ids is not None:
        await db.execute(delete(CourseTopic).where(CourseTopic.course_id == course_id))
        for topic_id in course_update.topic_ids:
            existing = (await db.execute(select(Topic).where(Topic.topic_id == topic_id))).scalar_one_or_none()
            if existing:
                db.add(CourseTopic(course_id=course_id, topic_id=topic_id))

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    await db.refresh(course)
    return {"message": "Course updated successfully"}

@router.put("/instructors/{instructor_id}")
async def update_instructor(
    instructor_id: int,
    instructor_update: InstructorUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update instructor details."""
    result = await db.execute(select(Instructor).where(Instructor.instructor_id == instructor_id))
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    if instructor_update.full_name is not None:
        instructor.full_name = instructor_update.full_name
    if instructor_update.email is not None:
        instructor.email = instructor_update.email

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    await db.refresh(instructor)
    return {"message": "Instructor updated successfully"}


# --- University management (admin-only) ---

class UniversityCreateRequest(BaseModel):
    name: str
    country: str

@router.post("/universities")
async def create_university(
    body: UniversityCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new university (admin only, enforced by router-level RoleChecker)."""
    # Check for duplicate
    existing = await db.execute(select(University).where(University.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="University with this name already exists")

    uni = University(name=body.name, country=body.country)
    db.add(uni)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    await db.refresh(uni)
    return {
        "university_id": uni.university_id,
        "name": uni.name,
        "country": uni.country,
        "message": "University created"
    }
