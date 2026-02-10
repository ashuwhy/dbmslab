# Advanced DBMS Project Improvements Report

This report outlines a roadmap to elevate the current Course Management System from a standard CRUD application to an **Advanced DBMS Laboratory Project**. The improvements are categorized by priority and technical complexity, focusing on concurrency, data integrity, and complex analytics.

## 1. Necessary (The Foundation)
*Refining the existing schema to ensure robustness and performance.*

### A. Indexing Strategy
*   **Current State**: Only Primary Keys and Unique constraints are indexed.
*   **Improvement**: Create **B-Tree indexes** on frequently queried columns to speed up filtering.
    *   `student(country, age)`: Accelerates demographic queries.
    *   `enrollment(course_id, evaluation_score)`: speeds up "average score" and "top student" queries.
    *   `course(course_name)`: Faster search bars.
*   **SQL Example**:
    ```sql
    CREATE INDEX idx_enrollment_stats ON enrollment (course_id, evaluation_score);
    ```

### B. Foreign Key Cascading & Integrity
*   **Current State**: Basic `ON DELETE CASCADE`.
*   **Improvement**: Ensure **application-level** awareness. If a University is deleted, ensure the API handles the massive cascade (deleting courses -> enrollments -> history) gracefully or *blocks* the deletion if active courses exist (Restricted Delete).

---

## 2. Must Add (The "Advanced" Core)
*These features demonstrate understanding of ACID properties and Database triggers, crucial for a high-grade DBMS project.*

### A. Concurrency Control (Transaction Locking) - *High Priority*
*   **Scenario (The "Banking" Case)**: **"Course Capacity & Race Conditions"**.
    *   **Problem**: If a popular course has 1 seat left, and 100 students click "Enroll" at the exact same millisecond, a standard `SELECT` then `INSERT` check will fail (Read-Modify-Write race condition), resulting in 101 students in a 100-seat class.
    *   **Solution**: Use **Pessimistic Locking** (`SELECT ... FOR UPDATE`).
    *   **Implementation**:
        1.  Add `max_capacity` column to `Course`.
        2.  Start Transaction.
        3.  `SELECT current_enrollment FROM course WHERE id=X FOR UPDATE;` (Locks the row).
        4.  Sleep (simulate latency to prove it works).
        5.  `INSERT` enrollment.
        6.  `COMMIT`.
    *   **Why it's Advanced**: Demonstrates **Isolation Levels** and preventing **Lost Updates**.

### B. Database Triggers & Audit Logs
*   **Scenario**: **"Grade Change Audit Trail"**.
    *   **Problem**: If an instructor changes a student's grade from 40 to 90, there is no record of *who* did it or *when*.
    *   **Solution**: Create a `grades_log` table and a PL/pgSQL Trigger function.
    *   **Implementation**:
        *   **Trigger**: `BEFORE UPDATE ON enrollment`.
        *   **Action**: If `OLD.evaluation_score != NEW.evaluation_score`, insert row into `grades_log(student_id, course_id, old_score, new_score, changed_at)`.
    *   **Why it's Advanced**: Moves logic from the API (application layer) effectively into the Database (data layer), ensuring data integrity regardless of how the update is performed.

---

## 3. Optional (Technical Breadth)
*Demonstrates a wide range of SQL knowledge.*

### A. Stored Procedures
*   **Scenario**: **"Complex Enrollment Logic"**.
*   **Improvement**: Instead of 3 API calls (Check Prereqs -> Check Capacity -> Enroll), write a single Stored Procedure `enroll_student(s_id, c_id)`.
    *   The procedure returns `SUCCESS`, `err_full`, or `err_prereq_missing`.
*   **Benefit**: Reduces network round-trips and encapsulates logic.

### B. Views for Security
*   **Scenario**: **"Public Directory"**.
*   **Improvement**: Create a `view_public_courses` that joins `Course`, `University`, and `Instructor`, but *excludes* sensitive fields (like internal IDs or salary info if it existed). The API queries the *View*, not the Tables.

---

## 4. Fancy (The "Wow" Factor)
*Features that combine Software Engineering with Advanced SQL.*

### A. Advanced Analytics (Window Functions)
*   **Scenario**: **"Class Rank & Percentiles"**.
*   **Improvement**: Don't just show a score. Show a student's rank relative to peers.
    *   **Query**:
        ```sql
        SELECT student_id, evaluation_score,
               RANK() OVER (PARTITION BY course_id ORDER BY evaluation_score DESC) as class_rank,
               CUME_DIST() OVER (PARTITION BY course_id ORDER BY evaluation_score) as percentile
        FROM enrollment;
        ```

### B. "Streaks" & Time-Series Data (Recursive CTEs)
*   **Scenario**: **"Learning Streak"**.
*   **Problem**: "How many consecutive days has this student been active?"
*   **Solution**: Use **Common Table Expressions (CTEs)**.
    *   Group activity by date.
    *   Use `lag()` or row numbering to group consecutive dates together.
    *   Calculate the length of the current group.
    *   **Visual**: Display a "heatmap" (like GitHub) on the student dashboard.

### C. Materialized Views for Performance
*   **Scenario**: **"Instant Analytics Dashboard"**.
*   **Problem**: Calculating "Average score per country per topic" across 1 million rows is slow.
*   **Solution**: `CREATE MATERIALIZED VIEW dashboard_stats AS ...`. Refresh it periodically (e.g., every hour). The API reads the pre-calculated view instantly.

---

## Summary of Recommendations

1.  **Immediate Action**: Implement **Locking** for Course Enrollment (`FOR UPDATE`) to simulate a real-world high-traffic system.
2.  **Visual Win**: Add **Streaks** and **Percentiles** to the Student Dashboard using Window Functions.
3.  **Integrity**: Add the **Audit Log Trigger** for grade protection.
