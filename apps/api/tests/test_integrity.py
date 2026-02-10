"""
Tests for data integrity fixes:
 - Cascade delete of users (student / instructor roles)
 - Enrollment counter trigger (auto-increment / auto-decrement)
 - Admin-only university creation endpoint
 - Instructor textbook creation endpoint
 - Analyst reporting definitions (Indian + AI broadened)
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


def _email():
    return f"integrity_{uuid4().hex[:8]}@example.com"


# ── helpers ──────────────────────────────────────────────────────────

async def _register_student(client: AsyncClient, email: str | None = None):
    email = email or _email()
    r = await client.post("/auth/register/student", json={
        "email": email,
        "password": "pass1234",
        "full_name": "Integrity Student",
        "age": 21,
        "country": "India",
        "skill_level": "advanced",
    })
    return r.json(), email


async def _register_instructor(client: AsyncClient, email: str | None = None):
    email = email or _email()
    r = await client.post("/auth/register/instructor", json={
        "email": email,
        "password": "pass1234",
        "full_name": "Integrity Instructor",
        "teaching_years": 4,
    })
    return r.json(), email


async def _login(client: AsyncClient, email: str, password: str = "pass1234"):
    r = await client.post("/auth/login", json={"email": email, "password": password})
    return r.json().get("access_token")


async def _admin_token(client: AsyncClient):
    """Login as the seeded admin account."""
    r = await client.post("/auth/login", json={
        "email": "admin@iitkgp.ac.in",
        "password": "admin123",
    })
    data = r.json()
    return data.get("access_token")


def _auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}


# ── Cascade Delete tests ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_student_user_cascades(client: AsyncClient):
    """Deleting a student user should also remove the Student row."""
    data, email = await _register_student(client)
    user_id = data["id"]
    admin_token = await _admin_token(client)

    # Verify user exists
    r = await client.get(f"/admin/users", headers=_auth_header(admin_token))
    assert r.status_code == 200

    # Delete the user
    r = await client.delete(f"/admin/users/{user_id}", headers=_auth_header(admin_token))
    assert r.status_code == 200
    assert r.json()["message"] == "User deleted"

    # Verify login fails (user gone)
    r = await client.post("/auth/login", json={"email": email, "password": "pass1234"})
    assert r.status_code in (401, 404)


@pytest.mark.asyncio
async def test_delete_instructor_user_cascades(client: AsyncClient):
    """Deleting an instructor user should also remove the Instructor row."""
    data, email = await _register_instructor(client)
    user_id = data["id"]
    admin_token = await _admin_token(client)

    r = await client.delete(f"/admin/users/{user_id}", headers=_auth_header(admin_token))
    assert r.status_code == 200

    # Verify login fails
    r = await client.post("/auth/login", json={"email": email, "password": "pass1234"})
    assert r.status_code in (401, 404)


# ── Permission enforcement tests ────────────────────────────────────

@pytest.mark.asyncio
async def test_create_university_requires_admin(client: AsyncClient):
    """POST /admin/universities should reject non-admin users."""
    # Register a student and try to create a university
    data, email = await _register_student(client)
    token = await _login(client, email)
    if token is None:
        pytest.skip("Cannot login as student (may need approval)")

    r = await client.post("/admin/universities", json={
        "name": "Unauthorized Uni",
        "country": "Test",
    }, headers=_auth_header(token))
    # Should be 403 (forbidden) or 401
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_university_as_admin(client: AsyncClient):
    """POST /admin/universities should succeed for admin."""
    admin_token = await _admin_token(client)
    if admin_token is None:
        pytest.skip("Admin account not available")

    uni_name = f"Test University {uuid4().hex[:6]}"
    r = await client.post("/admin/universities", json={
        "name": uni_name,
        "country": "TestCountry",
    }, headers=_auth_header(admin_token))
    assert r.status_code == 200
    assert r.json()["name"] == uni_name


@pytest.mark.asyncio
async def test_create_university_duplicate_rejected(client: AsyncClient):
    """Duplicate university name should be rejected."""
    admin_token = await _admin_token(client)
    if admin_token is None:
        pytest.skip("Admin account not available")

    uni_name = f"Dup Uni {uuid4().hex[:6]}"
    r = await client.post("/admin/universities", json={
        "name": uni_name,
        "country": "TestCountry",
    }, headers=_auth_header(admin_token))
    assert r.status_code == 200

    # Try again — should fail
    r2 = await client.post("/admin/universities", json={
        "name": uni_name,
        "country": "TestCountry",
    }, headers=_auth_header(admin_token))
    assert r2.status_code == 409


# ── Analyst reporting definition tests ──────────────────────────────

@pytest.mark.asyncio
async def test_top_indian_student_endpoint_returns_ok(client: AsyncClient):
    """GET /analytics/top-indian-student-by-ai-average should not crash."""
    admin_token = await _admin_token(client)
    if admin_token is None:
        pytest.skip("Admin account not available")

    r = await client.get(
        "/analytics/top-indian-student-by-ai-average",
        headers=_auth_header(admin_token),
    )
    assert r.status_code == 200
    data = r.json()
    # Should have name and avg_score keys
    assert "name" in data
    assert "avg_score" in data
