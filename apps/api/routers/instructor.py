from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from database import get_db
from models import Course, TeachingAssignment, ContentItem, Instructor, AppUser
from dependencies import get_current_user, RoleChecker
from pydantic import BaseModel

router = APIRouter(
    prefix="/instructor",
    tags=["instructor"],
    dependencies=[Depends(RoleChecker(["instructor", "admin"]))]
)

class CourseResponse(BaseModel):
    course_id: str
    title: str
    credits: int
    
    class Config:
        from_attributes = True

class ContentItemCreate(BaseModel):
    content_type: str
    title: str
    url: str

@router.get("/courses", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find instructor record
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    
    if not instructor:
         # For demo, if admin, maybe return all? or empty.
         # If no instructor profile, return empty
         return []

    stmt = select(Course).join(TeachingAssignment, TeachingAssignment.course_id == Course.course_id).where(TeachingAssignment.instructor_id == instructor.instructor_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/courses/{course_id}/content-items")
async def add_content_item(
    course_id: str,
    item: ContentItemCreate,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify instructor teaches this course
    result = await db.execute(select(Instructor).where(Instructor.email == current_user.email))
    instructor = result.scalar_one_or_none()
    
    if not instructor:
        raise HTTPException(status_code=403, detail="Not an instructor")

    assignment = await db.execute(
        select(TeachingAssignment).where(
            and_(
                TeachingAssignment.instructor_id == instructor.instructor_id,
                TeachingAssignment.course_id == course_id
            )
        )
    )
    if not assignment.scalar_one_or_none():
         raise HTTPException(status_code=403, detail="You are not assigned to this course")

    new_content = ContentItem(
        course_id=course_id,
        title=item.title,
        content_type=item.content_type,
        url=item.url
    )
    db.add(new_content)
    await db.commit()
    return {"message": "Content added successfully"}
