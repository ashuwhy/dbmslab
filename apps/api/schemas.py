from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "student"  # admin, instructor, student, analyst


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


# Role-specific registration (self-sign-up)
class StudentRegister(BaseModel):
    full_name: str
    email: str
    age: int
    skill_level: str = "beginner"  # beginner, intermediate, advanced
    country: str
    password: str


class InstructorRegister(BaseModel):
    full_name: str
    email: str
    teaching_years: int
    password: str


class AnalystRegister(BaseModel):
    full_name: str
    email: str
    password: str
