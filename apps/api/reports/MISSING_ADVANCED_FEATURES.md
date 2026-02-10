# Missing Advanced Features Report

This report outlines key features, architectural improvements, and database optimizations that are currently **missing** from the project. Implementing these will elevate the project from a standard CRUD application to an **Advanced DBMS Laboratory** submission.

The improvements are categorized by priority: **Necessary** (Baseline), **Must Add** (Core Advanced DBMS), **Optional** (Breadth), and **Fancy** (Wow Factor).

---

## 1. Necessary (Baseline Robustness)
*These features address technical debt and standard practices missing from the current implementation.*

### 1.1 Database Indexing
**Missing:** The current schema defines `PRIMARY KEY`s but lacks secondary indexes on frequently queried columns.
**Impact:** Slow performance on filtering and sorting as data grows.
**Recommendation:**
*   Add B-Tree indexes on:
    *   `student.country` (Used in analytics)
    *   `course.duration_weeks` (Used in filters)
    *   `enrollment.evaluation_score` (Used for averages/ranking)
*   Add specific indexes for search patterns (e.g., `pg_trgm` or `text_pattern_ops` for `course_name` `LIKE` queries).

### 1.2 Input Validation & Constraints
**Missing:** Database-level checks for logical consistency beyond simple types.
**Impact:** Data integrity issues (e.g., negative ages, impossible dates).
**Recommendation:**
*   **Check Constraints:**
    *   `CHECK (end_date > start_date)` for course terms.
    *   `CHECK (evaluation_score BETWEEN 0 AND 100)`.
*   **Unique Constraints:**
    *   Prevent duplicate enrollments (already handled via composite PK, but explicit constraints on `(student_id, course_id)` with status flags are better).

### 1.3 Error Handling (Database Level)
**Missing:** The API often relies on Python `try/except` rather than leveraging database error codes efficiently. Differentiating between `Foreign Key Violation` vs `Unique Violation` allows cleaner user feedback.

---

## 2. Must Add (Core Advanced DBMS Concepts)
*These features demonstrate understanding of transaction management, concurrency, and active database rules.*

### 2.1 Transaction Locking (Concurrency Control)
**Missing:** **"Safe Enrollment" (The Banking Scenario)**.
**Current State:** Enrollment checks if a user is already enrolled, then inserts. Race conditions exist if two users click "Enroll" on the last available seat simultaneously.
**Recommendation:**
*   Add `max_capacity` and `current_enrollment` columns to `Course`.
*   Implement `SELECT ... FOR UPDATE` (Pessimistic Locking) during enrollment.
*   **Scenario:** Validate that `current_enrollment < max_capacity` inside a locked transaction block before inserting the record.

### 2.2 Database Triggers (Active Schema)
**Missing:** Automated actions performed by the database itself.
**Recommendation:**
*   **Audit Logging:** Create a trigger on `enrollment` table. When `evaluation_score` is updated:
    *   Insert a row into a new `grade_audit_log` table: `(student_id, course_id, old_score, new_score, changed_by, timestamp)`.
    *   *Why?* Vital for academic integrity and demonstrates "Active Database" concepts.
*   **Auto-Update Stats:** A trigger that increments `course.current_enrollment` automatically when an `INSERT` occurs on `enrollment`.

### 2.3 Advanced Analytics (Window Functions)
**Missing:** Complex analytical queries beyond simple `GROUP BY`.
**Recommendation:**
*   **Class Rank:** Use `RANK() OVER (PARTITION BY course_id ORDER BY evaluation_score DESC)` to show a student their standing.
*   **Percentile Calculation:** `PERCENT_RANK()` to show "You are in the top 10% of students".
*   **Moving Averages:** calculate trend of student performance over time.

---

## 3. Optional (Breadth of Knowledge)
*Features that show you know SQL deeply.*

### 3.1 Stored Procedures (PL/pgSQL)
**Missing:** Server-side logic encapsulation. Currently, business logic (check capacity -> enrolled -> update) is in Python.
**Recommendation:**
*   Move the entire "enroll_student" logic into a PostgreSQL Function: `fn_enroll_student(p_student_id, p_course_id)`.
*   Call simply `SELECT fn_enroll_student(1, 101)` from Python.
*   *Benefit:* Reduces network round trips and ensures atomic execution.

### 3.2 Views & Materialized Views
**Missing:** Pre-defined query structures.
**Recommendation:**
*   **Security View:** `view_public_student_profile` (excludes sensitive fields like DOB/Email, exposes only Name/Country/Skill). Use this for public API endpoints.
*   **Performance View:** `mview_course_stats` (Materialized View). Pre-calculates `avg_score`, `total_students` for the dashboard. Refreshes periodically (e.g., hourly) instead of computing on every request.

### 3.3 Soft Deletes
**Missing:** "Trash Can" functionality.
**Recommendation:**
*   Add `is_active` or `deleted_at` columns to `User`, `Course`.
*   Update queries to `WHERE deleted_at IS NULL`.
*   *Why?* Immediate hard deletes are rarely used in production systems due to data loss risk.

---

## 4. Fancy (The "Wow" Factor)
*Software Engineering meets Advanced DBMS.*

### 4.1 Recursive Queries (CTEs)
**Missing:** Hierarchical data processing.
**Recommendation:**
*   **Prerequisite Chains:** Add `prerequisites` table `(course_id, required_course_id)`.
*   Use a `WITH RECURSIVE` query to find *all* courses a student must take before `Advanced AI`.
    *   *Result:* "To take Advanced AI, you need: AI Basics -> Python -> Math 101".

### 4.2 Streaks & Activity Heatmaps
**Missing:** Temporal data analysis (Time-Series).
**Recommendation:**
*   **Daily Activity Streak:** Calculate consecutive days a student has logged in or submitted work.
    *   Use `lag()` window function to compare dates.
*   **GitHub-style Heatmap:** Generate a matrix of `(date, submission_count)` for the last year.
    *   Requires `generate_series()` to fill in "zero activity" days (gaps in data).

### 4.3 Full-Text Search
**Missing:** Advanced search capabilities.
**Recommendation:**
*   Implement `tsvector` and `tsquery` for searching Course Descriptions or Content.
*   Allow searching for "AI machine learn" and finding "Machine Learning for AI".

### 4.4 Role-Based Row-Level Security (RLS)
**Missing:** Database-enforced security policies.
**Recommendation:**
*   Use PostgreSQL Policies (`CREATE POLICY`) to ensure:
    *   "Students can only SELECT their own rows in `enrollment`."
    *   Even if the API code has a bug, the DB prevents data leaks.
