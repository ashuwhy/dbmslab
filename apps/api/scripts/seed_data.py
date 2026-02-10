"""
Seed Script v3: Handles FRESH or RESET DB state.
Creates instructors, links them, seeds everything needed.

Run from: apps/api/
Command:  python scripts/seed_data.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from sqlalchemy import text, select
from database import engine, AsyncSessionLocal, Base
from models import AppUser, Instructor, Student, ContentItem, Course


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


INSTRUCTOR_PWD = hash_password("instructor123")

# Instructor data: (full_name, email)
INSTRUCTOR_DATA = [
    ("Andrew Ng", "andrew.ng@stanford.edu"),
    ("Yann LeCun", "yann.lecun@mit.edu"),
    ("Yoshua Bengio", "yoshua.bengio@oxford.edu"),
    ("Fei-Fei Li", "fei-fei@stanford.edu"),
    ("Ian Goodfellow", "ian.goodfellow@mit.edu"),
]


async def ensure_columns():
    """Add missing columns if needed."""
    print("\n-- 1. Schema columns --")
    async with engine.begin() as conn:
        checks = [
            ("student", "email", "ALTER TABLE student ADD COLUMN email VARCHAR(100) UNIQUE"),
            ("course", "max_capacity", "ALTER TABLE course ADD COLUMN max_capacity INTEGER DEFAULT 100 NOT NULL"),
            ("course", "current_enrollment", "ALTER TABLE course ADD COLUMN current_enrollment INTEGER DEFAULT 0 NOT NULL"),
            ("instructor", "user_id", "ALTER TABLE instructor ADD COLUMN user_id INTEGER"),
        ]
        for table, col, sql in checks:
            r = await conn.execute(text(
                f"SELECT 1 FROM information_schema.columns WHERE table_name='{table}' AND column_name='{col}'"
            ))
            if not r.fetchone():
                await conn.execute(text(sql))
                print(f"  Added {table}.{col}")
            else:
                print(f"  {table}.{col} OK")


async def ensure_tables():
    """Create missing tables."""
    print("\n-- 2. ORM tables --")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  Synced OK")


async def ensure_instructors(session):
    """Make sure the 5 standard instructors exist in the instructor table."""
    print("\n-- 3. Ensuring instructors --")
    for name, email in INSTRUCTOR_DATA:
        r = await session.execute(select(Instructor).where(Instructor.email == email))
        if r.scalar_one_or_none():
            print(f"  {name} ({email}) exists OK")
            continue
        
        # Insert using raw SQL to handle IDENTITY column
        await session.execute(
            text("INSERT INTO instructor (full_name, email) VALUES (:name, :email)"),
            {"name": name, "email": email}
        )
        print(f"  {name} ({email}) CREATED")
    await session.commit()


async def ensure_app_users(session):
    """Create app_user records for instructors."""
    print("\n-- 4. Instructor app_user records --")
    for name, email in INSTRUCTOR_DATA:
        r = await session.execute(select(AppUser).where(AppUser.email == email))
        if r.scalar_one_or_none():
            print(f"  {email} app_user exists OK")
            continue
        user = AppUser(email=email, password_hash=INSTRUCTOR_PWD, role="instructor")
        session.add(user)
        print(f"  {email} CREATED (pwd: instructor123)")
    await session.commit()


async def link_instructors(session):
    """Link instructor.user_id -> app_user.id."""
    print("\n-- 5. Linking instructors --")
    r = await session.execute(select(Instructor))
    instructors = r.scalars().all()
    linked = 0
    for inst in instructors:
        if inst.user_id:
            print(f"  {inst.full_name} already linked (user_id={inst.user_id}) OK")
            continue
        if inst.email:
            ur = await session.execute(select(AppUser).where(AppUser.email == inst.email))
            user = ur.scalar_one_or_none()
            if user:
                inst.user_id = user.id
                linked += 1
                print(f"  {inst.full_name} -> user_id={user.id}")
    await session.commit()
    print(f"  Linked {linked} instructors")


async def ensure_teaching_assignments(session):
    """Create teaching assignments if missing."""
    print("\n-- 6. Teaching assignments --")
    
    # Get course and instructor IDs
    courses = {}
    r = await session.execute(text("SELECT course_id, course_name FROM course"))
    for row in r.fetchall():
        courses[row[1]] = row[0]
    
    instructors = {}
    r = await session.execute(text("SELECT instructor_id, email FROM instructor"))
    for row in r.fetchall():
        instructors[row[1]] = row[0]
    
    if not courses or not instructors:
        print("  No courses or instructors found, skipping")
        return
    
    # Define assignments: (instructor_email, course_name, role)
    assignments = [
        ("andrew.ng@stanford.edu", "GenAI", "instructor"),
        ("andrew.ng@stanford.edu", "AI Basics", "instructor"),
        ("andrew.ng@stanford.edu", "Python Essentials", "teaching_assistant"),
        ("andrew.ng@stanford.edu", "NLP Fundamentals", "instructor"),
        ("andrew.ng@stanford.edu", "Deep Learning Specialization", "instructor"),
        ("yann.lecun@mit.edu", "Advanced Machine Learning", "instructor"),
        ("yann.lecun@mit.edu", "Deep Learning Specialization", "instructor"),
        ("yoshua.bengio@oxford.edu", "NLP Fundamentals", "instructor"),
        ("fei-fei@stanford.edu", "Computer Vision 101", "instructor"),
        ("ian.goodfellow@mit.edu", "Data Science Masterclass", "instructor"),
    ]
    
    created = 0
    for email, cname, role in assignments:
        iid = instructors.get(email)
        cid = courses.get(cname)
        if not iid or not cid:
            print(f"  SKIP: {email} -> {cname} (not found)")
            continue
        
        # Check if exists
        r = await session.execute(text(
            "SELECT 1 FROM teaching_assignment WHERE instructor_id=:iid AND course_id=:cid"
        ), {"iid": iid, "cid": cid})
        if r.fetchone():
            print(f"  {email} -> {cname} exists OK")
            continue
        
        await session.execute(text(
            "INSERT INTO teaching_assignment (instructor_id, course_id, role) VALUES (:iid, :cid, :role)"
        ), {"iid": iid, "cid": cid, "role": role})
        created += 1
        print(f"  {email} -> {cname} ({role}) CREATED")
    
    await session.commit()
    print(f"  Created {created} assignments")


async def backfill_student_emails(session):
    """Generate emails for students missing email."""
    print("\n-- 7. Student emails --")
    r = await session.execute(select(Student).where(Student.email.is_(None)))
    students = r.scalars().all()
    if not students:
        print("  All have emails OK")
        return
    for s in students:
        s.email = s.full_name.lower().replace(" ", ".").replace("'", "") + "@student.edu"
        print(f"  {s.full_name} -> {s.email}")
    await session.commit()


async def update_enrollment_counts(session):
    print("\n-- 8. Enrollment counts --")
    await session.execute(text(
        "UPDATE course c SET current_enrollment = "
        "(SELECT COUNT(*) FROM enrollment e WHERE e.course_id = c.course_id)"
    ))
    await session.commit()
    print("  Synced OK")


async def seed_content_items(session):
    print("\n-- 9. Content items --")
    r = await session.execute(select(ContentItem))
    if r.scalars().first():
        print("  Already seeded OK")
        return
    
    cr = await session.execute(select(Course))
    course_ids = [c.course_id for c in cr.scalars().all()]
    
    data = [
        (1, 'video', 'Introduction to Generative AI', 'https://youtube.com/watch?v=genai-intro'),
        (1, 'notes', 'GenAI Lecture Notes - Week 1', 'https://docs.google.com/genai-notes'),
        (1, 'book', 'GenAI Textbook Chapter 1', 'https://example.com/genai-ch1'),
        (2, 'video', 'What is Artificial Intelligence?', 'https://youtube.com/watch?v=ai-basics'),
        (2, 'notes', 'AI History and Evolution', 'https://docs.google.com/ai-history'),
        (3, 'video', 'SVM Deep Dive', 'https://youtube.com/watch?v=svm-deep'),
        (3, 'book', 'ML Yearbook Guide', 'https://example.com/ml-reading'),
        (4, 'video', 'Backpropagation Explained', 'https://youtube.com/watch?v=backprop'),
        (4, 'notes', 'CNN Architecture Notes', 'https://docs.google.com/cnn-notes'),
        (5, 'video', 'Tokenization & Embeddings', 'https://youtube.com/watch?v=nlp-tok'),
        (5, 'notes', 'NLP Getting Started', 'https://docs.google.com/nlp-start'),
        (6, 'video', 'Image Classification 101', 'https://youtube.com/watch?v=cv-101'),
        (7, 'video', 'Python Crash Course', 'https://youtube.com/watch?v=python-crash'),
        (7, 'notes', 'Python Cheat Sheet', 'https://docs.google.com/python-cheat'),
        (8, 'video', 'Pandas Data Wrangling', 'https://youtube.com/watch?v=pandas'),
        (8, 'notes', 'Matplotlib Guide', 'https://docs.google.com/matplotlib'),
    ]
    n = 0
    for cid, t, title, url in data:
        if cid in course_ids:
            session.add(ContentItem(course_id=cid, content_type=t, title=title, url=url))
            n += 1
    await session.commit()
    print(f"  Created {n} items")


async def create_triggers(session):
    print("\n-- 10. Triggers --")
    try:
        await session.execute(text("""
            CREATE OR REPLACE FUNCTION fn_audit_grade_change()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.evaluation_score IS DISTINCT FROM NEW.evaluation_score THEN
                    INSERT INTO audit_log (student_id, course_id, old_score, new_score, changed_at)
                    VALUES (OLD.student_id, OLD.course_id, OLD.evaluation_score, NEW.evaluation_score, NOW());
                END IF;
                RETURN NEW;
            END; $$ LANGUAGE plpgsql;
        """))
        await session.execute(text("DROP TRIGGER IF EXISTS trg_audit_grade_change ON enrollment"))
        await session.execute(text("""
            CREATE TRIGGER trg_audit_grade_change
            AFTER UPDATE OF evaluation_score ON enrollment
            FOR EACH ROW EXECUTE FUNCTION fn_audit_grade_change();
        """))
        await session.execute(text("""
            CREATE OR REPLACE FUNCTION fn_auto_update_enrollment_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    UPDATE course SET current_enrollment = current_enrollment + 1 WHERE course_id = NEW.course_id;
                ELSIF TG_OP = 'DELETE' THEN
                    UPDATE course SET current_enrollment = current_enrollment - 1 WHERE course_id = OLD.course_id;
                END IF;
                RETURN NULL;
            END; $$ LANGUAGE plpgsql;
        """))
        await session.execute(text("DROP TRIGGER IF EXISTS trg_auto_enrollment_count ON enrollment"))
        await session.execute(text("""
            CREATE TRIGGER trg_auto_enrollment_count
            AFTER INSERT OR DELETE ON enrollment
            FOR EACH ROW EXECUTE FUNCTION fn_auto_update_enrollment_count();
        """))
        await session.commit()
        print("  Audit + enrollment triggers OK")
    except Exception as e:
        print(f"  Note: {e}")
        await session.rollback()


async def create_indexes(session):
    print("\n-- 11. Indexes --")
    for name, sql in [
        ("idx_instructor_user_id", "CREATE INDEX IF NOT EXISTS idx_instructor_user_id ON instructor(user_id)"),
        ("idx_student_country", "CREATE INDEX IF NOT EXISTS idx_student_country ON student(country)"),
        ("idx_enrollment_score", "CREATE INDEX IF NOT EXISTS idx_enrollment_score ON enrollment(evaluation_score)"),
    ]:
        try:
            await session.execute(text(sql))
            print(f"  {name} OK")
        except Exception as e:
            print(f"  {name}: {e}")
    await session.commit()


async def verify(session):
    print("\n" + "=" * 60)
    print(" VERIFICATION")
    print("=" * 60)
    
    for label, sql in [
        ("app_user", "SELECT COUNT(*) FROM app_user"),
        ("instructor", "SELECT COUNT(*) FROM instructor"),
        ("instructor (linked)", "SELECT COUNT(*) FROM instructor WHERE user_id IS NOT NULL"),
        ("student", "SELECT COUNT(*) FROM student"),
        ("course", "SELECT COUNT(*) FROM course"),
        ("enrollment", "SELECT COUNT(*) FROM enrollment"),
        ("content_item", "SELECT COUNT(*) FROM content_item"),
        ("teaching_assignment", "SELECT COUNT(*) FROM teaching_assignment"),
    ]:
        r = await session.execute(text(sql))
        print(f"  {label}: {r.scalar()}")
    
    print("\n  Instructor linkage:")
    r = await session.execute(text(
        "SELECT i.instructor_id, i.full_name, i.email, i.user_id FROM instructor i ORDER BY i.instructor_id"
    ))
    for row in r.fetchall():
        link = f"-> user_id={row[3]}" if row[3] else "!! NOT LINKED"
        print(f"    [{row[0]}] {row[1]} ({row[2]}) {link}")
    
    print("\n  Teaching assignments:")
    r = await session.execute(text("""
        SELECT i.full_name, c.course_name, ta.role
        FROM teaching_assignment ta
        JOIN instructor i ON ta.instructor_id = i.instructor_id
        JOIN course c ON ta.course_id = c.course_id
        ORDER BY i.full_name, c.course_name
    """))
    for row in r.fetchall():
        print(f"    {row[0]} -> {row[1]} ({row[2]})")
    
    print("""
  +------------------------------------------------+
  | LOGIN CREDENTIALS                              |
  +------------------------------------------------+
  | ADMIN                                          |
  |   admin@iitkgp.ac.in / admin123                |
  |                                                |
  | INSTRUCTORS (pwd: instructor123)               |
  |   andrew.ng@stanford.edu                       |
  |   yann.lecun@mit.edu                           |
  |   yoshua.bengio@oxford.edu                     |
  |   fei-fei@stanford.edu                         |
  |   ian.goodfellow@mit.edu                       |
  +------------------------------------------------+
""")


async def main():
    print("=" * 60)
    print(" DBMS Lab -- Seed Script v3")
    print(" Admin: admin@iitkgp.ac.in / admin123")
    print("=" * 60)
    
    await ensure_columns()
    await ensure_tables()
    
    async with AsyncSessionLocal() as session:
        await ensure_instructors(session)
        await ensure_app_users(session)
        await link_instructors(session)
        await ensure_teaching_assignments(session)
        await backfill_student_emails(session)
        await update_enrollment_counts(session)
        await seed_content_items(session)
        await create_triggers(session)
        await create_indexes(session)
        await verify(session)
    
    print("=" * 60)
    print(" SEED COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
