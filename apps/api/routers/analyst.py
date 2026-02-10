from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from database import get_db
from models import Course, Enrollment, Student, University, Topic, CourseTopic
from dependencies import RoleChecker

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(RoleChecker(["analyst", "admin"]))]
)

@router.get("/stats")
async def get_overall_stats(db: AsyncSession = Depends(get_db)):
    """Get overall platform statistics."""
    total_courses = (await db.execute(select(func.count(Course.course_id)))).scalar() or 0
    total_students = (await db.execute(select(func.count(Student.student_id)))).scalar() or 0
    total_enrollments = (await db.execute(select(func.count()).select_from(Enrollment))).scalar() or 0
    avg_score = (await db.execute(
        select(func.avg(Enrollment.evaluation_score)).where(Enrollment.evaluation_score.isnot(None))
    )).scalar()
    
    return {
        "total_courses": total_courses,
        "total_students": total_students,
        "total_enrollments": total_enrollments,
        "average_score": round(avg_score, 2) if avg_score else 0
    }

@router.get("/most-popular-course")
async def most_popular_course(
    university: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get the most popular course by enrollment count."""
    stmt = (
        select(Course.course_name, func.count(Enrollment.student_id).label("count"))
        .join(Enrollment, Course.course_id == Enrollment.course_id)
    )
    
    if university:
        stmt = stmt.join(University, Course.university_id == University.university_id).where(
            University.name.ilike(f"%{university}%")
        )
    
    stmt = stmt.group_by(Course.course_id, Course.course_name).order_by(desc("count")).limit(1)
    result = await db.execute(stmt)
    row = result.first()
    
    if row:
        return {"course": row[0], "enrollments": row[1]}
    return {"course": None, "enrollments": 0}

@router.get("/enrollments-per-course")
async def enrollments_per_course(db: AsyncSession = Depends(get_db)):
    """Get enrollment count for each course."""
    stmt = (
        select(Course.course_id, Course.course_name, func.count(Enrollment.student_id).label("count"))
        .outerjoin(Enrollment, Course.course_id == Enrollment.course_id)
        .group_by(Course.course_id, Course.course_name)
        .order_by(desc("count"))
    )
    result = await db.execute(stmt)
    return [{"course_id": r[0], "title": r[1], "count": r[2]} for r in result]

@router.get("/avg-score-by-course")
async def avg_score_by_course(db: AsyncSession = Depends(get_db)):
    """Get average evaluation score per course."""
    stmt = (
        select(Course.course_name, func.avg(Enrollment.evaluation_score).label("avg_score"))
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .where(Enrollment.evaluation_score.isnot(None))
        .group_by(Course.course_id, Course.course_name)
        .order_by(desc("avg_score"))
    )
    result = await db.execute(stmt)
    return [{"course": r[0], "avg_score": round(r[1], 2) if r[1] else 0} for r in result]

@router.get("/top-indian-student-by-ai-average")
async def top_indian_student(db: AsyncSession = Depends(get_db)):
    """
    Get the top Indian student by average score in AI-topic courses.

    Reporting Definitions:
      - "Indian" = student.country ILIKE '%India%'
        (catches 'India', 'Republic of India', etc.)
      - "AI" = topic_name ILIKE '%AI%' OR topic_name ILIKE '%Artificial Intelligence%'
        (catches 'AI', 'AI/ML', 'Deep Learning AI', 'Artificial Intelligence', etc.)
    """
    stmt = (
        select(Student.full_name, func.avg(Enrollment.evaluation_score).label("avg_score"))
        .join(Enrollment, Student.student_id == Enrollment.student_id)
        .join(Course, Enrollment.course_id == Course.course_id)
        .join(CourseTopic, CourseTopic.course_id == Course.course_id)
        .join(Topic, CourseTopic.topic_id == Topic.topic_id)
        # "Indian" definition: case-insensitive partial match on country
        .where(Student.country.ilike("%India%"))
        # "AI" definition: topic name contains 'AI' or 'Artificial Intelligence'
        .where(
            Topic.topic_name.ilike("%AI%") | Topic.topic_name.ilike("%Artificial Intelligence%")
        )
        .group_by(Student.student_id, Student.full_name)
        .order_by(desc("avg_score"))
        .limit(1)
    )
    result = await db.execute(stmt)
    row = result.first()
    
    if row:
        return {"name": row[0], "avg_score": round(row[1], 2) if row[1] else 0}
    return {"name": None, "avg_score": 0}

@router.get("/courses-by-university")
async def courses_by_university(db: AsyncSession = Depends(get_db)):
    """Get course count per university."""
    stmt = (
        select(University.name, func.count(Course.course_id).label("count"))
        .join(Course, University.university_id == Course.university_id)
        .group_by(University.university_id, University.name)
        .order_by(desc("count"))
    )
    result = await db.execute(stmt)
    return [{"university": r[0], "count": r[1]} for r in result]

@router.get("/students-by-country")
async def students_by_country(db: AsyncSession = Depends(get_db)):
    """Get student count by country."""
    stmt = (
        select(Student.country, func.count(Student.student_id).label("count"))
        .group_by(Student.country)
        .order_by(desc("count"))
    )
    result = await db.execute(stmt)
    return [{"country": r[0], "count": r[1]} for r in result]

@router.get("/skill-level-distribution")
async def skill_level_distribution(db: AsyncSession = Depends(get_db)):
    """Get student distribution by skill level."""
    stmt = (
        select(Student.skill_level, func.count(Student.student_id).label("count"))
        .where(Student.skill_level.isnot(None))
        .group_by(Student.skill_level)
        .order_by(desc("count"))
    )
    result = await db.execute(stmt)
    return [{"skill_level": r[0], "count": r[1]} for r in result]

@router.get("/top-courses")
async def top_courses(limit: int = 5, db: AsyncSession = Depends(get_db)):
    """Get top courses by enrollment."""
    stmt = (
        select(
            Course.course_id,
            Course.course_name,
            func.count(Enrollment.student_id).label("enrollments"),
            func.avg(Enrollment.evaluation_score).label("avg_score")
        )
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .group_by(Course.course_id, Course.course_name)
        .order_by(desc("enrollments"))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [
        {
            "course_id": r[0],
            "course_name": r[1],
            "enrollments": r[2],
            "avg_score": round(r[3], 2) if r[3] else None
        }
        for r in result
    ]
