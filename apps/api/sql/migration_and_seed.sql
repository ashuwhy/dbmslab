-- ═══════════════════════════════════════════════════════════════════
-- DBMS Lab: Schema Migration & Seed Data Script
-- Run this AFTER the base 23CS10005_A2.sql has been executed
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. ADD MISSING COLUMNS TO EXISTING TABLES ───────────────────

-- 1a. Add email column to student table (needed by ORM but missing in original SQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student' AND column_name = 'email'
    ) THEN
        ALTER TABLE student ADD COLUMN email VARCHAR(100) UNIQUE;
    END IF;
END $$;

-- 1b. Add max_capacity and current_enrollment to course table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course' AND column_name = 'max_capacity'
    ) THEN
        ALTER TABLE course ADD COLUMN max_capacity INTEGER DEFAULT 100 NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course' AND column_name = 'current_enrollment'
    ) THEN
        ALTER TABLE course ADD COLUMN current_enrollment INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- 1c. Add user_id FK column to instructor table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'instructor' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE instructor ADD COLUMN user_id INTEGER;
    END IF;
END $$;

-- 1d. Add FK constraint for instructor.user_id -> app_user.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_instructor_app_user'
    ) THEN
        ALTER TABLE instructor 
        ADD CONSTRAINT fk_instructor_app_user 
        FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE SET NULL;
    END IF;
END $$;


-- ── 2. CREATE MISSING TABLES ────────────────────────────────────

-- 2a. app_user table (authentication layer)
CREATE TABLE IF NOT EXISTS app_user (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. audit_log table (grade change tracking)
CREATE TABLE IF NOT EXISTS audit_log (
    log_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    old_score INTEGER,
    new_score INTEGER,
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2c. content_item table
CREATE TABLE IF NOT EXISTS content_item (
    content_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    content_type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    url TEXT
);


-- ── 3. CREATE INDEXES ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_student_country ON student(country);
CREATE INDEX IF NOT EXISTS idx_course_duration ON course(duration_weeks);
CREATE INDEX IF NOT EXISTS idx_enrollment_score ON enrollment(evaluation_score);
CREATE INDEX IF NOT EXISTS idx_instructor_user_id ON instructor(user_id);


-- ── 4. BACKFILL STUDENT EMAILS ──────────────────────────────────
-- Generate emails from names for existing students without email

UPDATE student SET email = LOWER(REPLACE(full_name, ' ', '.')) || '@student.edu'
WHERE email IS NULL;


-- ── 5. UPDATE current_enrollment COUNTS ─────────────────────────

UPDATE course c
SET current_enrollment = (
    SELECT COUNT(*) FROM enrollment e WHERE e.course_id = c.course_id
);


-- ── 6. SEED APP_USER RECORDS ────────────────────────────────────
-- Password for ALL dummy users: "password123"
-- bcrypt hash of "password123":
-- $2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa

-- 6a. Admin user
INSERT INTO app_user (email, password_hash, role) VALUES
('admin@dbms.com', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 6b. Instructor users (matching instructor table emails)
INSERT INTO app_user (email, password_hash, role) VALUES
('andrew.ng@stanford.edu', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'instructor'),
('yann.lecun@mit.edu', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'instructor'),
('yoshua.bengio@oxford.edu', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'instructor'),
('fei-fei@stanford.edu', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'instructor'),
('ian.goodfellow@mit.edu', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'instructor')
ON CONFLICT (email) DO NOTHING;

-- 6c. Student users (matching student table emails)
INSERT INTO app_user (email, password_hash, role) 
SELECT email, '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'student'
FROM student
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- 6d. Analyst user
INSERT INTO app_user (email, password_hash, role) VALUES
('analyst@dbms.com', '$2b$12$LQv3c1yqBo9SkvXS7QTJPerGBBGEw1K.vr7FoIE9eFm5FPjVIHfHa', 'analyst')
ON CONFLICT (email) DO NOTHING;


-- ── 7. LINK instructor.user_id TO app_user.id ───────────────────

UPDATE instructor i
SET user_id = au.id
FROM app_user au
WHERE i.email = au.email AND au.role = 'instructor';


-- ── 8. SEED CONTENT ITEMS ───────────────────────────────────────

INSERT INTO content_item (course_id, content_type, title, url) VALUES
-- GenAI (course_id=1)
(1, 'video', 'Introduction to Generative AI', 'https://youtube.com/watch?v=genai-intro'),
(1, 'notes', 'GenAI Lecture Notes - Week 1', 'https://docs.google.com/genai-notes'),
(1, 'book', 'GenAI Textbook Chapter 1', 'https://example.com/genai-ch1'),

-- AI Basics (course_id=2)
(2, 'video', 'What is Artificial Intelligence?', 'https://youtube.com/watch?v=ai-basics'),
(2, 'notes', 'AI History and Evolution', 'https://docs.google.com/ai-history'),

-- Advanced ML (course_id=3)
(3, 'video', 'Support Vector Machines Deep Dive', 'https://youtube.com/watch?v=svm-deep'),
(3, 'book', 'ML Yearbook Reading Guide', 'https://example.com/ml-reading'),

-- Deep Learning (course_id=4)
(4, 'video', 'Backpropagation Explained', 'https://youtube.com/watch?v=backprop'),
(4, 'notes', 'CNN Architecture Notes', 'https://docs.google.com/cnn-notes'),

-- NLP Fundamentals (course_id=5)
(5, 'video', 'Tokenization and Word Embeddings', 'https://youtube.com/watch?v=nlp-tok'),

-- Computer Vision (course_id=6)
(6, 'video', 'Image Classification 101', 'https://youtube.com/watch?v=cv-101'),

-- Python Essentials (course_id=7)
(7, 'video', 'Python Crash Course', 'https://youtube.com/watch?v=python-crash'),
(7, 'notes', 'Python Cheat Sheet', 'https://docs.google.com/python-cheat'),

-- Data Science Masterclass (course_id=8)
(8, 'video', 'Data Wrangling with Pandas', 'https://youtube.com/watch?v=pandas-wrangle')
ON CONFLICT DO NOTHING;


-- ── 9. AUDIT TRIGGER ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_grade_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.evaluation_score IS DISTINCT FROM NEW.evaluation_score THEN
        INSERT INTO audit_log (student_id, course_id, old_score, new_score, changed_at)
        VALUES (OLD.student_id, OLD.course_id, OLD.evaluation_score, NEW.evaluation_score, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_grade_change ON enrollment;
CREATE TRIGGER trg_audit_grade_change
AFTER UPDATE OF evaluation_score ON enrollment
FOR EACH ROW
EXECUTE FUNCTION fn_audit_grade_change();


-- ── 10. AUTO-INCREMENT ENROLLMENT TRIGGER ───────────────────────

CREATE OR REPLACE FUNCTION fn_auto_update_enrollment_count()
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

DROP TRIGGER IF EXISTS trg_auto_enrollment_count ON enrollment;
CREATE TRIGGER trg_auto_enrollment_count
AFTER INSERT OR DELETE ON enrollment
FOR EACH ROW
EXECUTE FUNCTION fn_auto_update_enrollment_count();


-- ── 11. VERIFICATION ────────────────────────────────────────────

SELECT '=== APP_USER TABLE ===' AS section;
SELECT id, email, role FROM app_user ORDER BY role, email;

SELECT '=== INSTRUCTOR LINKAGE ===' AS section;
SELECT i.instructor_id, i.full_name, i.email, i.user_id, au.id AS app_user_id
FROM instructor i
LEFT JOIN app_user au ON i.user_id = au.id;

SELECT '=== COURSE ENROLLMENT COUNTS ===' AS section;
SELECT c.course_id, c.course_name, c.current_enrollment, c.max_capacity
FROM course c ORDER BY c.course_id;

SELECT '=== CONTENT ITEMS ===' AS section;
SELECT ci.content_id, c.course_name, ci.content_type, ci.title
FROM content_item ci JOIN course c ON ci.course_id = c.course_id
ORDER BY ci.course_id;
