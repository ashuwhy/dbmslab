from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case, text
from database import get_db
from models import Student, Course, Enrollment, Topic, CourseTopic, Instructor, TeachingAssignment
from dependencies import RoleChecker
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    dependencies=[Depends(RoleChecker(["analyst", "admin"]))]
)

@router.get("/module-analytics")
async def get_module_analytics(db: AsyncSession = Depends(get_db)):
    """
    Cohort Analysis: Track retention or completion rates.
    Simple version: Avg scores per program type.
    """
    stmt = (
        select(
            Course.program_id, 
            func.avg(Enrollment.evaluation_score).label("avg_score"),
            func.count(Enrollment.student_id).label("total_students")
        )
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .group_by(Course.program_id)
    )
    result = await db.execute(stmt)
    return [{"program_id": r[0], "avg_score": round(r[1], 2) if r[1] else 0, "students": r[2]} for r in result]

@router.get("/instructor-performance")
async def instructor_performance(db: AsyncSession = Depends(get_db)):
    """
    Instructor Performance Index (IPI) = Instructor Avg / Global Topic Avg
    """
    # 1. Global Topic Avg
    topic_avg_stmt = (
        select(
            Topic.topic_id, 
            func.avg(Enrollment.evaluation_score).label("global_avg")
        )
        .join(CourseTopic, Topic.topic_id == CourseTopic.topic_id)
        .join(Course, CourseTopic.course_id == Course.course_id)
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .group_by(Topic.topic_id)
    )
    top_avg_res = await db.execute(topic_avg_stmt)
    topic_avgs = {r[0]: r[1] for r in top_avg_res}

    # 2. Instructor stats per topic
    stmt = (
        select(
            Instructor.instructor_id,
            Instructor.full_name,
            Topic.topic_id,
            Topic.topic_name,
            func.avg(Enrollment.evaluation_score).label("instructor_avg")
        )
        .join(TeachingAssignment, Instructor.instructor_id == TeachingAssignment.instructor_id)
        .join(Course, TeachingAssignment.course_id == Course.course_id)
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .join(CourseTopic, Course.course_id == CourseTopic.course_id)
        .join(Topic, CourseTopic.topic_id == Topic.topic_id)
        .group_by(Instructor.instructor_id, Instructor.full_name, Topic.topic_id, Topic.topic_name)
    )
    
    result = await db.execute(stmt)
    data = []
    for r in result:
        i_id, i_name, t_id, t_name, i_avg = r
        g_avg = topic_avgs.get(t_id) or 0
        i_avg = i_avg or 0
        ipi = i_avg / g_avg if g_avg and g_avg > 0 else 0
        data.append({
            "instructor": i_name,
            "topic": t_name,
            "instructor_avg": round(i_avg, 2) if i_avg else 0,
            "global_topic_avg": round(g_avg, 2) if g_avg else 0,
            "ipi": round(ipi, 2)
        })
    
    return data

@router.get("/at-risk-students")
async def at_risk_students(threshold: int = 40, db: AsyncSession = Depends(get_db)):
    """
    Identify students with avg score < threshold.
    """
    stmt = (
        select(
            Student.student_id,
            Student.full_name,
            Student.email,
            func.avg(Enrollment.evaluation_score).label("avg_score")
        )
        .join(Enrollment, Student.student_id == Enrollment.student_id)
        .group_by(Student.student_id, Student.full_name, Student.email)
        .having(func.avg(Enrollment.evaluation_score) < threshold)
    )
    result = await db.execute(stmt)
    return [
        {
            "student_id": r[0], 
            "name": r[1], 
            "email": r[2], 
            "avg_score": round(r[3], 2) if r[3] else 0
        } 
        for r in result
    ]

@router.get("/topic-trends")
async def topic_trends(db: AsyncSession = Depends(get_db)):
    """
    Topic trends: Count enrollments per topic.
    """
    stmt = (
        select(Topic.topic_name, func.count(Enrollment.student_id).label("enrollments"))
        .join(CourseTopic, Topic.topic_id == CourseTopic.topic_id)
        .join(Course, CourseTopic.course_id == Course.course_id)
        .join(Enrollment, Course.course_id == Enrollment.course_id)
        .group_by(Topic.topic_name)
        .order_by(desc("enrollments"))
    )
    result = await db.execute(stmt)
    return [{"topic": r[0], "enrollments": r[1]} for r in result]
