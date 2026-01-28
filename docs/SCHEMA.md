# Database Schema

## Tables

### `app_user`

Roles-based access control user table.

- `id` (PK, Integer, Autoincrement)
- `email` (String, Unique, Not Null) - Links to `student.email` or `instructor.email`
- `password_hash` (String, Not Null)
- `role` (String, Not Null) - 'admin', 'instructor', 'student', 'analyst'
- `created_at` (DateTime)

### `student`

- `student_id` (PK, Integer, Autoincrement)
- `email` (String, Unique, Not Null) - Added for linking with `app_user`
- `full_name` (String, Not Null)
- `age` (Integer, Not Null) - Check Constraint: `age >= 13`
- `country` (String, Not Null)
- `category` (String) - 'student' or 'professional'
- `skill_level` (String) - 'beginner', 'intermediate', 'advanced'

### `instructor`

- `instructor_id` (PK, Integer, Autoincrement)
- `full_name` (String, Not Null)
- `email` (String, Unique)

### `course`

- `course_id` (PK, Integer, Autoincrement)
- `course_name` (String, Unique, Not Null)
- `duration_weeks` (Integer, Not Null)
- `university_id` (FK `university.university_id`, Not Null)
- `program_id` (FK `program.program_id`, Not Null)
- `textbook_id` (FK `textbook.textbook_id`, Not Null)

### `university`

- `university_id` (PK, Integer, Autoincrement)
- `name` (String, Unique, Not Null)
- `country` (String, Not Null)

### `program`

- `program_id` (PK, Integer, Autoincrement)
- `program_name` (String, Not Null)
- `program_type` (String, Not Null)
- `duration_weeks_or_months` (Integer, Not Null)

### `enrollment`

- `student_id` (FK `student.student_id`, PK)
- `course_id` (FK `course.course_id`, PK)
- `enroll_date` (Date, Not Null)
- `evaluation_score` (Integer)

### `teaching_assignment`

- `instructor_id` (FK `instructor.instructor_id`, PK)
- `course_id` (FK `course.course_id`, PK)
- `role` (String)

### `content_item`

- `content_id` (PK, Integer, Autoincrement)
- `course_id` (FK `course.course_id`, Not Null)
- `content_type` (String, Not Null)
- `title` (String, Not Null)
- `url` (Text)

### `textbook`

- `textbook_id` (PK, Integer, Autoincrement)
- `title` (String, Not Null)
- `isbn` (String, Unique)
- `url` (Text)

### `topic`

- `topic_id` (PK, Integer, Autoincrement)
- `topic_name` (String, Unique, Not Null)

### `course_topic`

- `course_id` (FK `course.course_id`, PK)
- `topic_id` (FK `topic.topic_id`, PK)
