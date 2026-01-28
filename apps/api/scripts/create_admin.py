import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from apps.api.database import engine, AsyncSessionLocal
from apps.api.models import AppUser
from apps.api.routers.auth import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with AsyncSessionLocal() as db:
        print("Checking for existing admin...")
        result = await db.execute(select(AppUser).where(AppUser.email == "admin@example.com"))
        if result.scalar_one_or_none():
            print("Admin already exists.")
            return

        print("Creating admin user...")
        admin_user = AppUser(
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
        await db.commit()
        print("Admin user created (admin@example.com / admin123).")

if __name__ == "__main__":
    asyncio.run(create_admin())
