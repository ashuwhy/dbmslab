from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Float, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class AppUser(Base):
    __tablename__ = "app_user"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, instructor, student, analyst
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships can be added if we link users to student/instructor tables
    # For now, we might keep them loose or add foreign keys if strict mapping is needed.

class University(Base):
    __tablename__ = "university"
    
    # Assuming schema based on typical assignment
    # Adjust types after inspection if needed
    university_id = Column(Integer, primary_key=True)
    university_name = Column(String, nullable=False)
    address = Column(String)

class Program(Base):
    __tablename__ = "program"
    
    program_id = Column(Integer, primary_key=True)
    program_name = Column(String, nullable=False)
    duration_years = Column(Integer)
    # university_id might be here

class Course(Base):
    __tablename__ = "course"
    
    course_id = Column(String, primary_key=True) # ID often string like CS101
    title = Column(String, nullable=False)
    credits = Column(Integer)
    description = Column(Text)
    # program_id usually here

class Student(Base):
    __tablename__ = "student"
    
    student_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    # program_id usually here
    
class Instructor(Base):
    __tablename__ = "instructor"
    
    instructor_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    dept_name = Column(String)

class Enrollment(Base):
    __tablename__ = "enrollment"
    
    enrollment_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("student.student_id"))
    course_id = Column(String, ForeignKey("course.course_id"))
    semester = Column(String)
    year = Column(Integer)
    grade = Column(String)
    evaluation_score = Column(Float)

class TeachingAssignment(Base):
    __tablename__ = "teaching_assignment"
    
    assignment_id = Column(Integer, primary_key=True)
    instructor_id = Column(Integer, ForeignKey("instructor.instructor_id"))
    course_id = Column(String, ForeignKey("course.course_id"))
    semester = Column(String)
    year = Column(Integer)

class ContentItem(Base):
    __tablename__ = "content_item"
    
    content_id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(String, ForeignKey("course.course_id"))
    title = Column(String, nullable=False)
    content_type = Column(String) # video, pdf, etc
    url = Column(String)
    
# Other tables: topic, textbook, course_topic can be added as needed
