from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from database import get_db
from models import AppUser, TeachingAssignment, Student, Enrollment, Instructor, Course, University, Program
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
    total_enrollments: int

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
    db_user = AppUser(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return {"message": "User created successfully", "user_id": db_user.id}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a user."""
    result = await db.execute(select(AppUser).where(AppUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.execute(delete(AppUser).where(AppUser.id == user_id))
    await db.commit()
    return {"message": "User deleted"}

@router.get("/courses", response_model=List[CourseResponse])
async def list_courses(db: AsyncSession = Depends(get_db)):
    """List all courses with enrollment counts."""
    stmt = (
        select(
            Course,
            University.name.label("university_name"),
            Program.program_name,
            func.count(Enrollment.student_id).label("enrollment_count")
        )
        .outerjoin(University, Course.university_id == University.university_id)
        .outerjoin(Program, Course.program_id == Program.program_id)
        .outerjoin(Enrollment, Course.course_id == Enrollment.course_id)
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
            enrollment_count=row[3] or 0
        ))
    return courses

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
    """Delete a student (cascades to enrollments)."""
    student = (await db.execute(select(Student).where(Student.student_id == student_id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Delete enrollments first (if cascade not handled by DB)
    await db.execute(delete(Enrollment).where(Enrollment.student_id == student_id))
    await db.execute(delete(Student).where(Student.student_id == student_id))
    await db.commit()
    return {"message": "Student deleted"}

@router.delete("/enrollments/{student_id}/{course_id}")
async def delete_enrollment(
    student_id: int,
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an enrollment."""
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
