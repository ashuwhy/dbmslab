import pytest
from httpx import AsyncClient
from uuid import uuid4

def random_email():
    return f"user_{uuid4()}@example.com"

@pytest.mark.asyncio
async def test_register_student(client: AsyncClient):
    email = random_email()
    response = await client.post("/auth/register/student", json={
        "email": email,
        "password": "password123",
        "full_name": "Test Student",
        "age": 20,
        "country": "Test Country",
        "skill_level": "intermediate"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["role"] == "student"
    assert "id" in data

@pytest.mark.asyncio
async def test_register_instructor(client: AsyncClient):
    email = random_email()
    response = await client.post("/auth/register/instructor", json={
        "email": email,
        "password": "password123",
        "full_name": "Test Instructor",
        "teaching_years": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["role"] == "instructor"

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register a student first
    email = random_email()
    await client.post("/auth/register/student", json={
        "email": email,
        "password": "password123",
        "full_name": "Login Test",
        "age": 20,
        "country": "Test Country",
        "skill_level": "beginner"
    })
    
    # Login
    response = await client.post("/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "student"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_instructor_pending_approval(client: AsyncClient):
    # Register instructor
    email = random_email()
    await client.post("/auth/register/instructor", json={
        "email": email,
        "password": "password123",
        "full_name": "Pending Instructor",
        "teaching_years": 2
    })
    
    # Try login (should fail because not approved)
    response = await client.post("/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert response.status_code == 403
    assert response.json()["detail"] == "pending_approval"
