# Instructor Module — Full Upgrade Implementation Report

**Date**: 2026-02-10  
**Scope**: Backend (`apps/api/routers/instructor.py`), Frontend (`apps/web/app/instructor/`), Models (`apps/api/models/__init__.py`), SQL Schema

---

## Current State Analysis

### Backend (`instructor.py`) — 4 Endpoints
| Endpoint | Method | Status |
|---|---|---|
| `/instructor/courses` | GET | ✅ Working (lists assigned courses with student counts) |
| `/instructor/courses/{id}/students` | GET | ✅ Working (lists enrolled students + scores) |
| `/instructor/courses/{id}/content-items` | GET | ✅ Working (lists content items) |
| `/instructor/courses/{id}/content-items` | POST | ✅ Working (add content item) |
| `/instructor/stats` | GET | ✅ Working (aggregate instructor stats) |

### Frontend — 3 Pages
| Page | File | Issues |
|---|---|---|
| Dashboard | `instructor/page.tsx` | ✅ Uses Shadcn `Card`, `Button` — well styled |
| Courses List | `instructor/courses/page.tsx` | ⚠️ Uses custom `card`, `btn btn-primary` CSS classes — NOT Shadcn |
| Course Detail | `instructor/courses/[id]/page.tsx` | ⚠️ Uses custom `tabs`, `tab`, `input`, `data-table`, `badge-*` CSS — NOT Shadcn |

### Database — Missing Linkage
- `app_user` table has `id`, `email`, `role` — used for JWT auth
- `instructor` table has `instructor_id`, `full_name`, `email` — domain table
- **NO FK relationship** between `app_user` and `instructor` — they are linked only by matching `email` string (fragile!)

---

## Planned Upgrades

### 🔗 1. Database: Link `app_user` ↔ `instructor` (FK Relationship)

**Problem**: Currently `instructor.py` does `SELECT instructor WHERE instructor.email == current_user.email` — a string-match join across two unlinked tables.

**Solution**: Add `user_id` FK column to `instructor` table referencing `app_user.id`.

**Changes**:
- **Model** (`models/__init__.py`): Add `user_id = Column(Integer, ForeignKey("app_user.id"))` to `Instructor`
- **SQL Migration**: `ALTER TABLE instructor ADD COLUMN user_id INTEGER REFERENCES app_user(id);`
- **Backend**: Update queries to use FK join instead of email matching

---

### 🆕 2. Backend: New Endpoints

| New Endpoint | Method | Purpose |
|---|---|---|
| `PUT /instructor/enrollments/{student_id}/{course_id}` | PUT | Grade a student (update `evaluation_score`) |
| `GET /instructor/courses/{id}/analytics` | GET | Course analytics (score distribution, pass rate, at-risk) |
| `DELETE /instructor/courses/{course_id}/content-items/{content_id}` | DELETE | Delete a content item |

#### 2a. Grading Endpoint (`PUT`)
- Accepts `{ "evaluation_score": int }` body (0-100 range validated)
- Verifies instructor is assigned to the course
- Updates `enrollment.evaluation_score`
- Manually inserts row into `audit_log` table for grade change tracking

#### 2b. Analytics Endpoint (`GET`)
- Returns score distribution buckets: `0-20`, `21-40`, `41-60`, `61-80`, `81-100`
- Calculates `pass_rate` (score ≥ 40)
- Counts `at_risk_count` (score < 40 or NULL)
- All via SQL aggregation with `CASE WHEN`

#### 2c. Delete Content Endpoint (`DELETE`)
- Verifies instructor ownership
- Removes content item from DB

---

### 🎨 3. Frontend: UI Modernization

#### 3a. Courses List Page (`courses/page.tsx`)
- **BEFORE**: Custom `.card`, `.btn .btn-primary` CSS classes
- **AFTER**: Shadcn `Card`, `CardContent`, `Button` components
- Add Lucide icons (`BookOpen`, `Users`, `Clock`)

#### 3b. Course Detail Page (`courses/[id]/page.tsx`) — FULL REWRITE
- **Tabs**: Replace custom `<button>` tabs → Shadcn-compatible tab system (manual state, no Radix Tab dependency needed since it's not installed)
- **Tables**: Replace `<table class="data-table">` → Shadcn `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`
- **Forms**: Replace `<input class="input">` → Shadcn `Input`, `Label`
- **Badges**: Replace `badge-success/warning/danger` → Shadcn `Badge` component
- **NEW**: Grading Dialog using Shadcn `Dialog` component
- **NEW**: Analytics tab with visual charts (pure CSS bar charts — no recharts dependency needed)
- **NEW**: Bulk Operations (Export CSV, Copy Emails)
- **NEW**: Delete content item button

---

### 📄 4. API Documentation Update (`docs/API.md`)
- Add all new instructor endpoints to the API documentation

---

## Implementation Order

1. ✅ **Model**: Add `user_id` FK to `Instructor` model — `models/__init__.py`
2. ✅ **Backend**: Add `PUT` grading, `GET` analytics, `DELETE` content — `routers/instructor.py`
3. ✅ **Frontend**: Rewrite `courses/page.tsx` with Shadcn components
4. ✅ **Frontend**: Full rewrite `courses/[id]/page.tsx` — Shadcn tabs, tables, grading dialog, analytics, bulk ops
5. ✅ **Docs**: Updated `docs/API.md` with all new endpoints
6. ✅ **SQL**: Migration SQL provided below

---

## Files Changed

| File | Action |
|---|---|
| `apps/api/models/__init__.py` | Added `user_id` FK + relationship to `Instructor` |
| `apps/api/routers/instructor.py` | Full rewrite — 3 new endpoints, helper functions |
| `apps/web/app/instructor/courses/page.tsx` | Migrated to Shadcn UI |
| `apps/web/app/instructor/courses/[id]/page.tsx` | Full rewrite — Shadcn, grading, analytics, bulk ops |
| `docs/API.md` | Added 5 new endpoint entries |

---

## SQL — `app_user ↔ instructor` Linkage + Audit Trigger

Run the following SQL against your PostgreSQL database:

```sql
-- ═══════════════════════════════════════════════════════════════════
-- 1. LINK app_user TABLE WITH instructor TABLE (FK Relationship)
-- ═══════════════════════════════════════════════════════════════════

-- 1a. Add user_id column to instructor table
ALTER TABLE instructor ADD COLUMN user_id INTEGER;

-- 1b. Add FK constraint referencing app_user.id
ALTER TABLE instructor 
ADD CONSTRAINT fk_instructor_app_user 
FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE SET NULL;

-- 1c. Backfill existing data — link instructors to app_user by email match
UPDATE instructor i
SET user_id = au.id
FROM app_user au
WHERE i.email = au.email AND au.role = 'instructor';

-- 1d. Create index on user_id for fast lookups
CREATE INDEX idx_instructor_user_id ON instructor(user_id);

-- 1e. (Optional) Add UNIQUE constraint to prevent multiple instructors per user
-- ALTER TABLE instructor ADD CONSTRAINT uq_instructor_user_id UNIQUE (user_id);


-- ═══════════════════════════════════════════════════════════════════
-- 2. AUDIT TRIGGER — Automatic grade change logging (PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════

-- 2a. Create the trigger function
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

-- 2b. Attach the trigger to the enrollment table
CREATE TRIGGER trg_audit_grade_change
AFTER UPDATE OF evaluation_score ON enrollment
FOR EACH ROW
EXECUTE FUNCTION fn_audit_grade_change();


-- ═══════════════════════════════════════════════════════════════════
-- 3. VERIFY — Check the linkage
-- ═══════════════════════════════════════════════════════════════════

-- See linked instructors
SELECT i.instructor_id, i.full_name, i.email, i.user_id, au.id AS app_user_id, au.role
FROM instructor i
LEFT JOIN app_user au ON i.user_id = au.id;
```
