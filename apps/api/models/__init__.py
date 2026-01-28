from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, DateTime, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Authentication User (separate from domain tables)
class AppUser(Base):
    __tablename__ = "app_user"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, instructor, student, analyst
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Domain tables matching 23CS10005_A2.sql schema
class University(Base):
    __tablename__ = "university"
    
    university_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    country = Column(String(50), nullable=False)
    
    # Relationships
    courses = relationship("Course", back_populates="university")


class Program(Base):
    __tablename__ = "program"
    
    program_id = Column(Integer, primary_key=True, autoincrement=True)
    program_name = Column(String(100), nullable=False)
    program_type = Column(String(50), nullable=False)  # certificate/diploma/degree
    duration_weeks_or_months = Column(Integer, nullable=False)
    
    # Relationships
    courses = relationship("Course", back_populates="program")


class Topic(Base):
    __tablename__ = "topic"
    
    topic_id = Column(Integer, primary_key=True, autoincrement=True)
    topic_name = Column(String(100), nullable=False, unique=True)
    
    # Relationships
    courses = relationship("CourseTopic", back_populates="topic")


class Textbook(Base):
    __tablename__ = "textbook"
    
    textbook_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    isbn = Column(String(20), unique=True)
    url = Column(Text)
    
    # Relationships
    courses = relationship("Course", back_populates="textbook")


class Course(Base):
    __tablename__ = "course"
    
    course_id = Column(Integer, primary_key=True, autoincrement=True)
    course_name = Column(String(150), nullable=False, unique=True)
    duration_weeks = Column(Integer, nullable=False)
    university_id = Column(Integer, ForeignKey("university.university_id"), nullable=False)
    program_id = Column(Integer, ForeignKey("program.program_id"), nullable=False)
    textbook_id = Column(Integer, ForeignKey("textbook.textbook_id"), nullable=False)
    
    # Relationships
    university = relationship("University", back_populates="courses")
    program = relationship("Program", back_populates="courses")
    textbook = relationship("Textbook", back_populates="courses")
    topics = relationship("CourseTopic", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
    teaching_assignments = relationship("TeachingAssignment", back_populates="course")
    content_items = relationship("ContentItem", back_populates="course")


class CourseTopic(Base):
    __tablename__ = "course_topic"
    
    course_id = Column(Integer, ForeignKey("course.course_id", ondelete="CASCADE"), primary_key=True)
    topic_id = Column(Integer, ForeignKey("topic.topic_id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    course = relationship("Course", back_populates="topics")
    topic = relationship("Topic", back_populates="courses")


class Instructor(Base):
    __tablename__ = "instructor"
    
    instructor_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    
    # Relationships
    teaching_assignments = relationship("TeachingAssignment", back_populates="instructor")


class TeachingAssignment(Base):
    __tablename__ = "teaching_assignment"
    
    instructor_id = Column(Integer, ForeignKey("instructor.instructor_id", ondelete="CASCADE"), primary_key=True)
    course_id = Column(Integer, ForeignKey("course.course_id", ondelete="CASCADE"), primary_key=True)
    role = Column(String(50))
    
    # Relationships
    instructor = relationship("Instructor", back_populates="teaching_assignments")
    course = relationship("Course", back_populates="teaching_assignments")


class Student(Base):
    __tablename__ = "student"
    
    student_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    country = Column(String(50), nullable=False)
    category = Column(String(50))  # student/professional
    skill_level = Column(String(50))  # beginner/intermediate/advanced
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="student")


class Enrollment(Base):
    __tablename__ = "enrollment"
    
    student_id = Column(Integer, ForeignKey("student.student_id", ondelete="CASCADE"), primary_key=True)
    course_id = Column(Integer, ForeignKey("course.course_id", ondelete="CASCADE"), primary_key=True)
    enroll_date = Column(Date, nullable=False)
    evaluation_score = Column(Integer)
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class ContentItem(Base):
    __tablename__ = "content_item"
    
    content_id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("course.course_id", ondelete="CASCADE"), nullable=False)
    content_type = Column(String(30), nullable=False)  # book/video/notes
    title = Column(String(150), nullable=False)
    url = Column(Text)
    
    # Relationships
    course = relationship("Course", back_populates="content_items")
