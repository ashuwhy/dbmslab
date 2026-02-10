-- ============================================================
-- Theory registration and approval – schema migration
-- Run: psql -d your_db -f apps/api/sql/theory_registration_migration.sql
-- ============================================================

-- 1. AppUser: add approval timestamp for instructor/analyst
ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN app_user.approved_at IS 'Set when admin approves instructor/analyst; NULL = pending';

-- 2. Instructor: add teaching_years
ALTER TABLE instructor
ADD COLUMN IF NOT EXISTS teaching_years INTEGER DEFAULT NULL;

COMMENT ON COLUMN instructor.teaching_years IS 'Years of teaching experience';

-- 3. Enrollment: add status (pending / approved / rejected)
ALTER TABLE enrollment
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved';

-- Backfill existing enrollments as approved
UPDATE enrollment SET status = 'approved' WHERE status IS NULL OR status = '';

-- Enforce not null and default for new rows
ALTER TABLE enrollment ALTER COLUMN status SET NOT NULL;
ALTER TABLE enrollment ALTER COLUMN status SET DEFAULT 'pending';

COMMENT ON COLUMN enrollment.status IS 'pending | approved | rejected';

-- 4. Course proposals (instructor proposes; admin approves)
CREATE TABLE IF NOT EXISTS course_proposal (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES instructor(instructor_id) ON DELETE CASCADE,
    course_name VARCHAR(150) NOT NULL,
    duration_weeks INTEGER NOT NULL,
    university_id INTEGER NOT NULL REFERENCES university(university_id),
    program_id INTEGER NOT NULL REFERENCES program(program_id),
    textbook_id INTEGER NOT NULL REFERENCES textbook(textbook_id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_proposal_status ON course_proposal(status);
CREATE INDEX IF NOT EXISTS idx_course_proposal_instructor ON course_proposal(instructor_id);

-- 5. Topic proposals (instructor proposes; admin approves)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'topic_proposal') THEN
        CREATE TABLE topic_proposal (
            id SERIAL PRIMARY KEY,
            instructor_id INTEGER NOT NULL REFERENCES instructor(instructor_id) ON DELETE CASCADE,
            topic_name VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_topic_proposal_status ON topic_proposal(status);
CREATE INDEX IF NOT EXISTS idx_topic_proposal_instructor ON topic_proposal(instructor_id);
