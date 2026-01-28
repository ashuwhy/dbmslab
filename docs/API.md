# API Documentation

## Authentication

- `POST /auth/register`: Register a new user (Open for demo/Admin only IRL).
- `POST /auth/login`: Login and retrieve JWT token.
- `GET /auth/me`: Get current user details.

## Student

- `GET /student/courses`: List available courses. Query params: `query`.
- `POST /student/enrollments`: Enroll in a course. Body: `{ "course_id": "string" }`.
- `GET /student/enrollments/me`: List my enrollments.

## Instructor

- `GET /instructor/courses`: List courses assigned to the current instructor.
- `POST /instructor/courses/{course_id}/content-items`: Add content to a course.

## Admin

- `POST /admin/users`: Create a new user (with specific role).
- `POST /admin/courses/{course_id}/assign-instructor`: Assign an instructor to a course.
- `DELETE /admin/students/{student_id}`: Delete a student and their enrollments.

## Analyst

- `GET /analytics/most-popular-course`: Get the course with the highest enrollment count.
- `GET /analytics/enrollments-per-course`: List enrollment counts/stats per course.
- `GET /analytics/avg-score-by-course`: List average evaluation scores per course.
- `GET /analytics/top-indian-student-by-ai-average`: Get the top performing student (optionally filtered by 'Indian' logic if implemented).
