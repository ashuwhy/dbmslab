from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models import AppUser, TeachingAssignment, Student, Enrollment
from dependencies import RoleChecker
from routers.auth import get_password_hash
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(RoleChecker(["admin"]))]
)

class UserCreateRequest(BaseModel):
    email: str
    password: str
    role: str

class AssignInstructorRequest(BaseModel):
    instructor_id: int
    role: str = "Lead" # Optional role description

@router.post("/users")
async def create_user(
    user: UserCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AppUser).where(AppUser.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = AppUser(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    await db.commit()
    return {"message": "User created successfully", "user_id": db_user.id}

@router.post("/courses/{course_id}/assign-instructor")
async def assign_instructor(
    course_id: str,
    request: AssignInstructorRequest,
    db: AsyncSession = Depends(get_db)
):
    # Check if assignment exists
    stmt = select(TeachingAssignment).where(
        (TeachingAssignment.course_id == course_id) & 
        (TeachingAssignment.instructor_id == request.instructor_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Instructor already assigned")

    new_assignment = TeachingAssignment(
        course_id=course_id,
        instructor_id=request.instructor_id,
        semester="Spring", # Placeholder
        year=2024
    )
    db.add(new_assignment)
    await db.commit()
    return {"message": "Instructor assigned successfully"}

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db)
):
    # Cascade delete is usually handled by DB FKs, but explicit delete of enrollments might be needed if cascade not set
    # prompt says "cascade enrollments"
    
    # Check if student exists
    student_res = await db.execute(select(Student).where(Student.student_id == student_id))
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Delete enrollments
    await db.execute(delete(Enrollment).where(Enrollment.student_id == student_id))
    
    # Delete student
    await db.execute(delete(Student).where(Student.student_id == student_id))
    
    # If there is a linked AppUser, we might want to delete that too, but link logic isn't strictly defined yet.
    
    await db.commit()
    return {"message": "Student deleted"}
