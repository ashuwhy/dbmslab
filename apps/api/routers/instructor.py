from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from database import get_db
from models import Course, TeachingAssignment, ContentItem, Instructor, AppUser, Enrollment, Student
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

    # Get courses with student count
    stmt = (
        select(
            Course,
            func.count(Enrollment.student_id).label("student_count")
        )
        .join(TeachingAssignment, TeachingAssignment.course_id == Course.course_id)
        .outerjoin(Enrollment, Enrollment.course_id == Course.course_id)
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
        .where(Enrollment.course_id == course_id)
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
    
    # Count total students across all courses
    student_count_stmt = (
        select(func.count(func.distinct(Enrollment.student_id)))
        .join(TeachingAssignment, TeachingAssignment.course_id == Enrollment.course_id)
        .where(TeachingAssignment.instructor_id == instructor.instructor_id)
    )
    student_count = (await db.execute(student_count_stmt)).scalar() or 0
    
    # Average score across all students in instructor's courses
    avg_score_stmt = (
        select(func.avg(Enrollment.evaluation_score))
        .join(TeachingAssignment, TeachingAssignment.course_id == Enrollment.course_id)
        .where(
            and_(
                TeachingAssignment.instructor_id == instructor.instructor_id,
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
