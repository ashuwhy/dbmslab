import asyncio
import sys
import os

# Add parent directory to path to import database module
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from sqlalchemy import text
from apps.api.database import engine

async def inspect():
    async with engine.connect() as conn:
        print("--- Tables in Database ---")
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        )
        tables = result.fetchall()
        for table in tables:
            print(f"Table: {table[0]}")
            
            # Get columns for each table
            cols = await conn.execute(
                text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table[0]}'")
            )
            for col in cols.fetchall():
                print(f"  - {col[0]} ({col[1]})")
        print("--------------------------")

if __name__ == "__main__":
    try:
        asyncio.run(inspect())
    except Exception as e:
        print(f"Error inspecting DB: {e}")
