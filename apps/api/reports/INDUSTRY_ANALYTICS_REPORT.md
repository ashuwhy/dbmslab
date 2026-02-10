# Industry-Level Analytics Report for EdTech DBMS

This report outlines **industry-standard analytics** concepts that would elevate this DBMS Lab project to a professional level. These go beyond simple "counts" and "averages" to provide actionable business and pedagogical intelligence.

## 1. Descriptive Analytics: "What happened?"
*Granular tracking of user behavior and platform health.*

### A. Cohort Analysis (Retention)
**Concept:** Track groups of students (cohorts) based on their join date and see how many remain active or complete courses over time.
**Query Logic:**
*   Group students by `enrollment_month`.
*   Calculate % of students from Month X who completed a course in Month X+1, X+2.
**SQL Feature:** `date_trunc`, `CTE`, self-joins.
**Value:** Identifies if platform quality is improving or declining over time.

### B. Daily/Monthly Active Users (DAU/MAU)
**Concept:** Standard metric for any consumer app.
**Query Logic:**
*   Count distinct `student_id`s with activity (enrollment, grade update) per day.
*   *Note:* Requires an `activity_log` table (login, page view) for true accuracy, but `enroll_date` is a proxy.
**Value:** Measures true platform "stickiness".

### C. Course Funnel Analysis
**Concept:** The journey from "Browsing" to "Mastery".
**Steps:**
1.  View Course (Need Access Log)
2.  Enroll (Table: `enrollment`)
3.  First Content Access (Need Access Log)
4.  Course Completion (Score IS NOT NULL)
5.  High Score (>80%)
**Value:** Identifies where students drop off. Is the course too hard? Is the signup process broken?

---

## 2. Diagnostic Analytics: "Why did it happen?"
*Finding correlations and causes.*

### A. Instructor Performance Index (IPI)
**Concept:** Comparing instructors fairly. A raw "average student score" is unfair because some teach easy subjects (Python Intro) and others hard ones (Advanced Quantum Physics).
**Logic:**
*   Calculate `Global Average Score` for a Topic.
*   Calculate `Instructor Average Score` for that Topic.
*   `IPI = Instructor_Avg / Global_Topic_Avg`.
**Value:** Identifies instructors who actually *add value* vs those who just grade easily.

### B. Difficulty vs. Drop-off Correlation
**Concept:** Do harder courses have higher drop-off rates?
**Logic:**
*   Correlate `duration_weeks` (proxy for effort) with `completion_rate` (count of scores / count of enrollments).
**Value:** Helps balance curriculum planning.

---

## 3. Predictive Analytics: "What will happen?"
*Using data to forecast future trends.*

### A. "At-Risk" Student Identification
**Concept:** Identify students likely to fail or drop out *before* it happens.
**Logic:**
*   Flag students who:
    *   Have decreasing scores across sequential courses.
    *   Haven't enrolled in a new course for > 90 days (Churn Risk).
    *   Are taking a course with a difficulty level much higher than their `skill_level`.
**Value:** Allows for automated intervention (emails, tutoring offers).

### B. Topic Trend Forecasting
**Concept:** Which subjects are booming?
**Logic:**
*   Calculate Month-over-Month (MoM) growth variance for each `Topic`.
*   *Example:* "GenAI enrollments grew 40% vs last month, while Web Dev grew only 5%."
**Value:** Strategic decision making for new course creation.

---

## 4. Prescriptive Analytics: "What should we do?"
*Automated recommendations.*

### A. "You Might Also Like" (Recommendation Engine)
**Concept:** Item-based Collaborative Filtering.
**Logic:**
*   "Students who took Course A and got >80% also took Course B."
*   Query using `INTERSECT` or Self-Joins on the `enrollment` table.
**Value:** Increases LTV (Life Time Value) of a user/student.

### B. Curriculum Gap Analysis
**Concept:** Finding what's missing.
**Logic:**
*   Analyze `Search Logs` (if available) vs `Course Titles`.
*   *Or:* Analyze Industry Demand (external data) vs University Catalog.
*   *DBMS Lab Context:* List Topics with 0 courses or 0 Instructors.

---

## Summary of New Tables/Columns Needed
To fully realize these analytics, the schema should evolve:

1.  **`activity_log`**: `(user_id, action_type, timestamp, metadata)` - vital for engagement analytics.
2.  **`course_completion`**: Differentiate between "Enrolled" and "Completed" explicitly (e.g., `status` enum).
3.  **`student_interests`**: Explicit tags a student selects, separate from what they enroll in.
