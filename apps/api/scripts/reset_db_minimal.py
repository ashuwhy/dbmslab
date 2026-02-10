
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from sqlalchemy import text
from database import engine, AsyncSessionLocal, Base
from models import AppUser

async def main():
    print("=" * 60)
    print(" RESET DB - MINIMAL (Admin Only)")
    print("=" * 60)

    print("1. Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("   Tables recreated.")
    
    print("   Creating Trigger for Enrollment Count...")
    async with engine.begin() as conn:
        await conn.execute(text("""
        CREATE OR REPLACE FUNCTION fn_update_enrollment_count()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT' THEN
                UPDATE course SET current_enrollment = current_enrollment + 1
                WHERE course_id = NEW.course_id;
            ELSIF TG_OP = 'DELETE' THEN
                UPDATE course SET current_enrollment = current_enrollment - 1
                WHERE course_id = OLD.course_id;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        """))
        await conn.execute(text("""
        CREATE TRIGGER trg_auto_enrollment_count
        AFTER INSERT OR DELETE ON enrollment
        FOR EACH ROW EXECUTE FUNCTION fn_update_enrollment_count();
        """))
    print("   Trigger created.")


    print("2. Creating ONLY Admin user...")
    async with AsyncSessionLocal() as session:
        # Create single admin
        # Using hardcoded password hash for 'admin123' to avoid dependency issues if bcrypt differs
        # But safest is to re-hash.
        pwd_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        admin = AppUser(
            email="admin@iitkgp.ac.in",
            password_hash=pwd_hash,
            role="admin",
            approved_at=None # Admins might not need approval or auto-approved
        )
        # Using execute to ensure ID=1 or just add
        session.add(admin)
        await session.commit()
        print(f"   Admin created: admin@iitkgp.ac.in / admin123")

    print("=" * 60)
    print(" DONE. Only admin exists.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
