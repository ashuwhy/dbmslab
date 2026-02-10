# Bug Fix Report — 2026-02-10

## Summary

Audited and fixed **6 bugs** across the backend (`apps/api`) and frontend (`apps/web`).

---

## Bug 1: Enrollment Count Mismatch (Student ≠ Instructor)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 High |
| **Location** | `apps/api/routers/student.py` → `get_course_detail()` |
| **Symptom** | Student page showed "4/100" enrollment but Instructor page showed "2 Total Students" for the same course. |
| **Root Cause** | The student course detail endpoint returned `course.current_enrollment`, a **stale counter** on the `Course` model. This counter is incremented when a student *applies* (status = `pending`), so it includes pending + approved + rejected enrollments. Meanwhile, the instructor endpoints correctly counted only `approved` enrollments via live `COUNT` queries. |
| **Fix** | Replaced `course.current_enrollment` with a live `COUNT` query filtering by `Enrollment.status == "approved"`. Now both views show the same number. |
| **Files Changed** | `apps/api/routers/student.py` (lines 303–314) |

---

## Bug 2: Instructor Page Shows "Course #ID" Instead of Course Name

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Location** | `apps/web/app/instructor/courses/[id]/page.tsx` → header |
| **Symptom** | The instructor course detail page displayed "Course #10" instead of the actual course name (e.g., "DBMS"). |
| **Root Cause** | The page only used `courseId` from URL params. No fetch was made to retrieve the course name. |
| **Fix** | Added a fetch to `/instructor/courses` on mount, finds the matching course, and sets `courseName` state. Header now shows `{courseName || \`Course #${courseId}\`}` as fallback. |
| **Files Changed** | `apps/web/app/instructor/courses/[id]/page.tsx` (lines 69, 101–113, 248) |

---

## Bug 3: Analytics Counted ALL Enrollments (Not Just Approved)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 High |
| **Location** | `apps/api/routers/instructor.py` → `get_course_analytics()` |
| **Symptom** | Analytics "Total Students", score distribution, and pass/fail stats included students with `pending` or `rejected` status, inflating numbers and skewing averages. |
| **Root Cause** | The analytics query had `.where(Enrollment.course_id == course_id)` with **no status filter**. |
| **Fix** | Added `Enrollment.status == "approved"` to the `.where()` clause. |
| **Files Changed** | `apps/api/routers/instructor.py` (line 684) |

---

## Bug 4: Rankings Endpoint Included Non-Approved Students

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Location** | `apps/api/routers/instructor.py` → `get_student_rankings()` |
| **Symptom** | Window function rankings included students who had not been approved yet, potentially showing pending students in class rank lists. |
| **Root Cause** | Raw SQL `WHERE e.course_id = :course_id` had no status filter. |
| **Fix** | Changed to `WHERE e.course_id = :course_id AND e.status = 'approved'`. |
| **Files Changed** | `apps/api/routers/instructor.py` (line 795) |

---

## Bug 5: Safe-Enroll Used Inconsistent Status Value

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Location** | `apps/api/routers/instructor.py` → `safe_enroll_student()` |
| **Symptom** | Direct enrollment via pessimistic locking used `status='active'` while the rest of the codebase uses `'approved'`/`'pending'`/`'rejected'`. Students enrolled this way would never appear in approved-filtered queries. |
| **Root Cause** | Inconsistent status string: `'active'` vs `'approved'`. |
| **Fix** | Changed to `status='approved'`. |
| **Files Changed** | `apps/api/routers/instructor.py` (line 956) |

---

## Bug 6: Duplicate API Constant in Instructor Detail Page

| Field | Value |
|-------|-------|
| **Severity** | 🟢 Low |
| **Location** | `apps/web/app/instructor/courses/[id]/page.tsx` |
| **Symptom** | Two constants defined for the same API URL: `const API = ...` (line 20) and `const API_URL = ...` (line 33). Confusing and error-prone. |
| **Root Cause** | Copy-paste leftover. |
| **Fix** | Removed the duplicate `API_URL` constant, using only `API` throughout the file. |
| **Files Changed** | `apps/web/app/instructor/courses/[id]/page.tsx` (line 33 removed) |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/api/routers/student.py` | Live enrollment count instead of stale counter |
| `apps/api/routers/instructor.py` | Analytics + Rankings: added `status='approved'` filter; safe-enroll: fixed status value |
| `apps/web/app/instructor/courses/[id]/page.tsx` | Course name display; removed duplicate constant |

---

## How to Verify

1. Navigate to `/student/courses/10` — enrollment count should now match the instructor's view.
2. Navigate to `/instructor/courses/10` — header should show the course name (e.g., "DBMS").
3. On the Analytics tab, "Total Students" should match the Students tab count.
4. Check rankings endpoint (`/instructor/courses/10/rankings`) — should only list approved students.
