import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from apps.api.database import engine, Base
from apps.api.models import AppUser, University # Import models to register them

async def init_models():
    async with engine.begin() as conn:
        print("Creating tables...")
        # This will create tables that don't exist (like app_user)
        # It won't recreate existing tables
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")

if __name__ == "__main__":
    asyncio.run(init_models())
