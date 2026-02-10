from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date
from database import get_db
from models import Course, Enrollment, Student, AppUser, University, Program, Topic, CourseTopic, TeachingAssignment, Instructor
from dependencies import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter(
    prefix="/student",
    tags=["student"],
    dependencies=[Depends(RoleChecker(["student", "admin"]))]
)

class CourseResponse(BaseModel):
    course_id: int
    course_name: str
    duration_weeks: int
    university_name: Optional[str] = None
    program_name: Optional[str] = None
    topics: List[str] = []
    
    class Config:
        from_attributes = True

class EnrollmentRequest(BaseModel):
    course_id: int

class EnrollmentResponse(BaseModel):
    course_id: int
    course_name: str
    enroll_date: date
    evaluation_score: Optional[int] = None
    
    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    course_id: int
    course_name: str
    enroll_date: date
    status: str

    class Config:
        from_attributes = True


class ContentItemResponse(BaseModel):
    content_id: int
    title: str
    content_type: str
    url: Optional[str] = None

    class Config:
        from_attributes = True

class InstructorInfo(BaseModel):
    instructor_id: int
    full_name: str
    email: Optional[str] = None
    role: Optional[str] = None

    class Config:
        from_attributes = True

class CourseDetailResponse(BaseModel):
    course_id: int
    course_name: str
    duration_weeks: int
    max_capacity: int
    current_enrollment: int
    university_name: Optional[str] = None
    program_name: Optional[str] = None
    textbook_title: Optional[str] = None
    textbook_url: Optional[str] = None
    topics: List[str] = []
    evaluation_score: Optional[int] = None
    enroll_date: Optional[date] = None
    content_items: List[ContentItemResponse] = []
    instructors: List[InstructorInfo] = []
    
    class Config:
        from_attributes = True

@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(
    query: Optional[str] = None,
    topic: Optional[str] = None,
    program_type: Optional[str] = None,
    university: Optional[str] = None,
    max_duration_weeks: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all available courses with optional filtering."""
    stmt = (
        select(Course)
        .options(
            selectinload(Course.university),
            selectinload(Course.program),
            selectinload(Course.topics).selectinload(CourseTopic.topic)
        )
    )
    
    if query:
        stmt = stmt.where(
            or_(
                Course.course_name.ilike(f"%{query}%"),
            )
        )
    
    if max_duration_weeks:
        stmt = stmt.where(Course.duration_weeks <= max_duration_weeks)
    
    if university:
        stmt = stmt.join(University).where(University.name.ilike(f"%{university}%"))
    
    if program_type:
        stmt = stmt.join(Program).where(Program.program_type == program_type)
    
    if topic:
        stmt = stmt.join(CourseTopic).join(Topic).where(Topic.topic_name.ilike(f"%{topic}%"))
        
    result = await db.execute(stmt)
    courses = result.scalars().unique().all()
    
    # Format response
    response = []
    for course in courses:
        response.append(CourseResponse(
            course_id=course.course_id,
            course_name=course.course_name,
            duration_weeks=course.duration_weeks,
            university_name=course.university.name if course.university else None,
            program_name=course.program.program_name if course.program else None,
            topics=[ct.topic.topic_name for ct in course.topics] if course.topics else []
        ))
    return response

@router.post("/enrollments")
async def enroll_course(
    request: EnrollmentRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll current user in a course."""
    # Find student record linked to AppUser
    result = await db.execute(select(Student).where(Student.email == current_user.email))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")
    
    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == student.student_id,
                Enrollment.course_id == request.course_id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    # Lock the course row to prevent race conditions (Concurrency Control)
    # This prevents multiple students from grabbing the last seat simultaneously
    course_stmt = select(Course).where(Course.course_id == request.course_id).with_for_update()
    course_result = await db.execute(course_stmt)
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.current_enrollment >= course.max_capacity:
        raise HTTPException(status_code=400, detail="Course is full")

    # Increment enrollment count
    course.current_enrollment += 1

    # Create enrollment as pending (instructor must approve)
    new_enrollment = Enrollment(
        student_id=student.student_id,
        course_id=request.course_id,
        enroll_date=date.today(),
        evaluation_score=None,
        status="pending",
    )
    db.add(new_enrollment)
    await db.commit()
    return {"message": "Application submitted. Instructor will review."}

@router.get("/enrollments/me", response_model=List[EnrollmentResponse])
async def get_my_enrollments(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all enrollments for the current user."""
    result = await db.execute(select(Student).where(Student.email == current_user.email))
    student = result.scalar_one_or_none()
    
    if not student:
        return []

    stmt = (
        select(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.course_id)
        .where(
            Enrollment.student_id == student.student_id,
            Enrollment.status == "approved",
        )
    )
    result = await db.execute(stmt)
    
    enrollments = []
    for enrollment, course in result:
        enrollments.append(EnrollmentResponse(
            course_id=course.course_id,
            course_name=course.course_name,
            enroll_date=enrollment.enroll_date,
            evaluation_score=enrollment.evaluation_score
        ))
    return enrollments

@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    course_id: int,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get course details for the current student (must be enrolled)."""
    stmt = (
        select(Course)
        .options(
            selectinload(Course.university),
            selectinload(Course.program),
            selectinload(Course.textbook),
            selectinload(Course.topics).selectinload(CourseTopic.topic),
            selectinload(Course.content_items),
            selectinload(Course.teaching_assignments).selectinload(TeachingAssignment.instructor)
        )
        .where(Course.course_id == course_id)
    )
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    evaluation_score = None
    enroll_date = None

    if current_user.role != "admin":
        student_result = await db.execute(select(Student).where(Student.email == current_user.email))
        student = student_result.scalar_one_or_none()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found for this user")

        enrollment_result = await db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student.student_id,
                    Enrollment.course_id == course_id
                )
            )
        )
        enrollment = enrollment_result.scalar_one_or_none()
        
        if not enrollment:
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")
        
        evaluation_score = enrollment.evaluation_score
        enroll_date = enrollment.enroll_date

    content_items = []
    if course.content_items:
        content_items = [
            ContentItemResponse(
                content_id=item.content_id,
                title=item.title,
                content_type=item.content_type,
                url=item.url
            )
            for item in course.content_items
        ]

    instructors = []
    if course.teaching_assignments:
        for assignment in course.teaching_assignments:
            if assignment.instructor:
                instructors.append(
                    InstructorInfo(
                        instructor_id=assignment.instructor.instructor_id,
                        full_name=assignment.instructor.full_name,
                        email=assignment.instructor.email,
                        role=assignment.role
                    )
                )

    return CourseDetailResponse(
        course_id=course.course_id,
        course_name=course.course_name,
        duration_weeks=course.duration_weeks,
        max_capacity=course.max_capacity,
        current_enrollment=course.current_enrollment,
        university_name=course.university.name if course.university else None,
        program_name=course.program.program_name if course.program else None,
        textbook_title=course.textbook.title if course.textbook else None,
        textbook_url=course.textbook.url if course.textbook else None,
        topics=[ct.topic.topic_name for ct in course.topics] if course.topics else [],
        evaluation_score=evaluation_score,
        enroll_date=enroll_date,
        content_items=content_items,
        instructors=instructors
    )

@router.get("/applications/me", response_model=List[ApplicationResponse])
async def get_my_applications(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's course applications (pending or rejected)."""
    result = await db.execute(select(Student).where(Student.email == current_user.email))
    student = result.scalar_one_or_none()
    if not student:
        return []
    stmt = (
        select(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.course_id)
        .where(
            Enrollment.student_id == student.student_id,
            Enrollment.status.in_(["pending", "rejected"]),
        )
    )
    result = await db.execute(stmt)
    return [
        ApplicationResponse(
            course_id=course.course_id,
            course_name=course.course_name,
            enroll_date=enrollment.enroll_date,
            status=enrollment.status,
        )
        for enrollment, course in result
    ]


@router.get("/stats")
async def get_student_stats(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for the current student."""
    result = await db.execute(select(Student).where(Student.email == current_user.email))
    student = result.scalar_one_or_none()
    
    if not student:
        return {"total_enrollments": 0, "avg_score": None, "courses_completed": 0}

    # Count approved enrollments only
    count_stmt = select(func.count(Enrollment.course_id)).where(
        Enrollment.student_id == student.student_id,
        Enrollment.status == "approved",
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    # Average score (approved enrollments only)
    avg_stmt = select(func.avg(Enrollment.evaluation_score)).where(
        and_(
            Enrollment.student_id == student.student_id,
            Enrollment.status == "approved",
            Enrollment.evaluation_score.isnot(None)
        )
    )
    avg_result = await db.execute(avg_stmt)
    avg_score = avg_result.scalar()
    
    # Courses with score (completed, approved only)
    completed_stmt = select(func.count(Enrollment.course_id)).where(
        and_(
            Enrollment.student_id == student.student_id,
            Enrollment.status == "approved",
            Enrollment.evaluation_score.isnot(None)
        )
    )
    completed_result = await db.execute(completed_stmt)
    completed = completed_result.scalar() or 0
    
    return {
        "total_enrollments": total,
        "avg_score": round(avg_score, 2) if avg_score else None,
        "courses_completed": completed
    }
