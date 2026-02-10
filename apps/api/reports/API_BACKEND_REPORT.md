# API Backend Detailed Report

This report provides an in-depth analysis of the `apps/api` backend, including its structure,a purpose, and a comprehensive list of all endpoints.

## Overview

The backend is built using **FastAPI** (Python). It serves as the core API for the application, handling user authentication, student enrollments, instructor assignments, administrative tasks, and analytics.

**Entry Point:** `apps/api/main.py`
**Database:** Uses SQLAlchemy with async support (likely PostgreSQL based on `asyncpg` dependency patterns, though `sqlite` is also possible).

## Router Breakdown

The application is modularized into several routers, each responsible for a specific domain:

1.  **Auth (`/auth`)**: Handles user registration and authentication.
2.  **Student (`/student`)**: Manages student-specific actions like course browsing and enrollment.
3.  **Instructor (`/instructor`)**: Manages instructor-specific actions like managing courses and students.
4.  **Admin (`/admin`)**: Provides administrative capabilities for managing users, courses, and system stats.
5.  **Analytics (`/analytics`)**: Offers data insights and statistics for analysts/admins.

---

## Endpoint Details

### 1. Authentication (`/auth`)
*Prefix:* `/auth`
*Tags:* `auth`

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user. Checks for existing email. | `UserCreate` (email, password, role) | `UserResponse` (id, email, role) |
| `POST` | `/login` | Authenticate user and return JWT token. | `UserLogin` (email, password) | `Token` (access_token, token_type) |
| `GET` | `/me` | Get details of the currently authenticated user. | None | `UserResponse` |

### 2. Student Operations (`/student`)
*Prefix:* `/student`
*Tags:* `student`
*Role Required:* `student`, `admin`

| Method | Endpoint | Description | Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/courses` | List all available courses with optional filters. | `query`, `topic`, `program_type`, `university`, `max_duration_weeks` | List of `CourseResponse` |
| `POST` | `/enrollments` | Enroll the current user in a course. Checks for duplicates. | `EnrollmentRequest` (course_id) | Message |
| `GET` | `/enrollments/me` | Get all enrollments for the current user. | None | List of `EnrollmentResponse` |
| `GET` | `/stats` | Get statistics for the current student (total enrollments, avg score, etc.). | None | JSON Stats object |

### 3. Instructor Operations (`/instructor`)
*Prefix:* `/instructor`
*Tags:* `instructor`
*Role Required:* `instructor`, `admin`

| Method | Endpoint | Description | Path Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/courses` | Get courses assigned to the current instructor. | None | List of `CourseResponse` |
| `GET` | `/courses/{course_id}/students` | Get all students enrolled in a specific course taught by the instructor. | `course_id` | List of `StudentInCourse` |
| `GET` | `/courses/{course_id}/content-items` | Get all content items for a course. | `course_id` | List of `ContentItemResponse` |
| `POST` | `/courses/{course_id}/content-items` | Add a new content item (e.g., lecture link) to a course. | `course_id`, Body: `ContentItemCreate` | Message & content_id |
| `GET` | `/stats` | Get statistics for the current instructor (total courses, students, avg score). | None | JSON Stats object |

### 4. Admin Operations (`/admin`)
*Prefix:* `/admin`
*Tags:* `admin`
*Role Required:* `admin`

| Method | Endpoint | Description | Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Get global dashboard statistics (users, courses, students, etc.). | None | `DashboardStats` |
| `GET` | `/users` | List all registered application users. | None | List of `UserResponse` |
| `POST` | `/users` | Create a new user (admin/student/instructor). Creates associated profile if student. | Body: `UserCreateRequest` | Message & user_id |
| `DELETE` | `/users/{user_id}` | Delete a user by ID. | `user_id` | Message |
| `GET` | `/courses` | List all courses with enrollment and instructor details. | None | List of `CourseResponse` |
| `GET` | `/instructors` | List all instructors. | None | List of `InstructorResponse` |
| `GET` | `/students` | List all students. | None | List of `StudentResponse` |
| `POST` | `/courses/{course_id}/assign-instructor` | Assign an instructor to a course. | `course_id`, Body: `AssignInstructorRequest` | Message |
| `DELETE` | `/courses/{course_id}/instructors/{instructor_id}` | Remove an instructor assignment from a course. | `course_id`, `instructor_id` | Message |
| `DELETE` | `/students/{student_id}` | Delete a student and their enrollments. | `student_id` | Message |
| `DELETE` | `/enrollments/{student_id}/{course_id}` | Delete a specific enrollment. | `student_id`, `course_id` | Message |
| `GET` | `/course-assignments/{course_id}` | Get all instructors assigned to a specific course. | `course_id` | List of `InstructorResponse` |
| `PUT` | `/students/{student_id}` | Update student details (name, email, country, etc.). | `student_id`, Body: `StudentUpdateRequest` | Message & updated student |
| `PUT` | `/courses/{course_id}` | Update course details (name, duration, university, program). | `course_id`, Body: `CourseUpdateRequest` | Message |
| `PUT` | `/instructors/{instructor_id}` | Update instructor details (name, email). | `instructor_id`, Body: `InstructorUpdateRequest` | Message |

### 5. Analytics (`/analytics`)
*Prefix:* `/analytics`
*Tags:* `analytics`
*Role Required:* `analyst`, `admin`

| Method | Endpoint | Description | Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Get overall platform statistics. | None | JSON Stats object |
| `GET` | `/most-popular-course` | Get the most popular course by enrollment count (optional university filter). | `university` | JSON object |
| `GET` | `/enrollments-per-course` | Get enrollment count for each course. | None | List of objects |
| `GET` | `/avg-score-by-course` | Get average evaluation score per course. | None | List of objects |
| `GET` | `/top-indian-student-by-ai-average` | Specific query for the top Indian student in AI topics. | None | JSON object |
| `GET` | `/courses-by-university` | Get course count per university. | None | List of objects |
| `GET` | `/students-by-country` | Get student count breakdown by country. | None | List of objects |
| `GET` | `/skill-level-distribution` | Get student distribution by skill level. | None | List of objects |
| `GET` | `/top-courses` | Get top N courses by enrollment. | `limit` (default 5) | List of objects |

## Data Models (Key Entities)
*   **AppUser**: Base user table for authentication.
*   **Student**: Extended profile for student users.
*   **Instructor**: Extended profile for instructor users.
*   **Course**: Educational courses offered.
*   **Enrollment**: Link between Student and Course (many-to-many).
*   **TeachingAssignment**: Link between Instructor and Course (many-to-many).
*   **ContentItem**: Educational materials linked to a course.
