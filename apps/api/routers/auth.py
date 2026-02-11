from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, datetime, timezone
from typing import Annotated
from jose import jwt
from database import get_db
from models import AppUser, Student, Instructor, Executive
from schemas import (
    UserCreate,
    UserResponse,
    Token,
    UserLogin,
    StudentRegister,
    InstructorRegister,
    AnalystRegister,
)
from dependencies import get_current_user, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

import bcrypt

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AppUser).where(AppUser.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = AppUser(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/register/student", response_model=UserResponse)
async def register_student(data: StudentRegister, db: AsyncSession = Depends(get_db)):
    """Self-registration for students. No approval required."""
    result = await db.execute(select(AppUser).where(AppUser.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    if data.age < 13:
        raise HTTPException(status_code=400, detail="Student must be at least 13 years old")
    hashed = get_password_hash(data.password)
    db_user = AppUser(email=data.email, password_hash=hashed, role="student")
    db.add(db_user)
    await db.flush()
    student = Student(
        email=data.email,
        full_name=data.full_name,
        age=data.age,
        country=data.country,
        skill_level=data.skill_level,
        category="student",
    )
    db.add(student)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.post("/register/instructor", response_model=UserResponse)
async def register_instructor(data: InstructorRegister, db: AsyncSession = Depends(get_db)):
    """Self-registration for instructors. Requires admin approval (approved_at set later)."""
    result = await db.execute(select(AppUser).where(AppUser.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(data.password)
    db_user = AppUser(
        email=data.email,
        password_hash=hashed,
        role="instructor",
        approved_at=None,
    )
    db.add(db_user)
    await db.flush()
    instructor = Instructor(
        full_name=data.full_name,
        email=data.email,
        teaching_years=data.teaching_years,
    )
    db.add(instructor)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.post("/register/analyst", response_model=UserResponse)
async def register_analyst(data: AnalystRegister, db: AsyncSession = Depends(get_db)):
    """Self-registration for analysts. Requires admin approval (approved_at set later). Name saved in executive table."""
    result = await db.execute(select(AppUser).where(AppUser.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(data.password)
    db_user = AppUser(
        email=data.email,
        password_hash=hashed,
        role="analyst",
        approved_at=None,
    )
    db.add(db_user)
    await db.flush()
    executive = Executive(
        app_user_id=db_user.id,
        full_name=data.full_name,
        executive_type="analyst",
    )
    db.add(executive)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AppUser).where(AppUser.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Instructor and analyst need admin approval before using the platform
    if user.role in ("instructor", "analyst") and getattr(user, "approved_at", None) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="pending_approval",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: AppUser = Depends(get_current_user)):
    return current_user
