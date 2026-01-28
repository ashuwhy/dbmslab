from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List, Optional
from database import get_db
from models import Course, Enrollment, Student, AppUser
from dependencies import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter(
    prefix="/student",
    tags=["student"],
    dependencies=[Depends(RoleChecker(["student", "admin"]))] # Admin can likely view student stuff too for debugging
)

class CourseResponse(BaseModel):
    course_id: str
    title: str
    credits: int
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class EnrollmentRequest(BaseModel):
    course_id: str

@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(
    query: Optional[str] = None,
    # topic: Optional[str] = None, # Requires joining course_topic
    # program_type: Optional[str] = None, # Requires joining program
    # max_duration_weeks: Optional[int] = None, 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Course)
    
    if query:
        stmt = stmt.where(
            or_(
                Course.title.ilike(f"%{query}%"),
                Course.course_id.ilike(f"%{query}%")
            )
        )
        
    result = await db.execute(stmt)
    courses = result.scalars().all()
    return courses

@router.post("/enrollments")
async def enroll_course(
    request: EnrollmentRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find student record linked to AppUser
    # For this assignment, we might assume AppUser.email matches Student.email
    result = await db.execute(select(Student).where(Student.email == current_user.email))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")
    
    # Check if existing enrollment
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == student.student_id,
                Enrollment.course_id == request.course_id
            )
        )
    )
    if existing.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Already enrolled")

    # Create enrollment
    # Assuming current semester/year hardcoded or logic needed
    new_enrollment = Enrollment(
        student_id=student.student_id,
        course_id=request.course_id,
        semester="Spring", # Placeholder
        year=2024
    )
    db.add(new_enrollment)
    await db.commit()
    return {"message": "Enrolled successfully"}

@router.get("/enrollments/me")
async def get_my_enrollments(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.email == current_user.email))
    student = result.scalar_one_or_none()
    
    if not student:
        return []

    stmt = select(Enrollment, Course).join(Course, Enrollment.course_id == Course.course_id).where(Enrollment.student_id == student.student_id)
    result = await db.execute(stmt)
    # format result
    enrollments = []
    for enrollment, course in result:
        enrollments.append({
            "course_id": course.course_id,
            "title": course.title,
            "semester": enrollment.semester,
            "year": enrollment.year,
            "grade": enrollment.grade
        })
    return enrollments
