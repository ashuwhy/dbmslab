import asyncio
import sys
import os

# Add parent directory to path to import database module
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from sqlalchemy import text
from apps.api.database import engine

async def check_data():
    async with engine.connect() as conn:
        print("--- Checking Database Connection ---")
        try:
            # Check University table
            result = await conn.execute(text("SELECT count(*) FROM university"))
            count = result.scalar()
            print(f"Universities found: {count}")
            
            # Check Student table
            result = await conn.execute(text("SELECT count(*) FROM student"))
            count = result.scalar()
            print(f"Students found: {count}")

             # Check Course table
            result = await conn.execute(text("SELECT count(*) FROM course"))
            count = result.scalar()
            print(f"Courses found: {count}")

            print("Database check PASSED.")
        except Exception as e:
            print(f"Database check FAILED: {e}")
        finally:
            print("--------------------------------")

if __name__ == "__main__":
    asyncio.run(check_data())
