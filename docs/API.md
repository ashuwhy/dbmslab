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
- `GET /instructor/courses/{course_id}/students`: List all students enrolled in a course.
- `GET /instructor/courses/{course_id}/content-items`: List all content items for a course.
- `POST /instructor/courses/{course_id}/content-items`: Add content to a course. Body: `{ "content_type": "string", "title": "string", "url": "string" }`.
- `DELETE /instructor/courses/{course_id}/content-items/{content_id}`: Delete a content item from a course.
- `PUT /instructor/enrollments/{student_id}/{course_id}`: Grade a student. Body: `{ "evaluation_score": int }`. Logged to `audit_log`.
- `GET /instructor/courses/{course_id}/analytics`: Get course analytics (score distribution, pass rate, at-risk count).
- `GET /instructor/stats`: Get aggregate statistics for the current instructor.

## Admin

- `POST /admin/users`: Create a new user (with specific role).
- `POST /admin/courses/{course_id}/assign-instructor`: Assign an instructor to a course.
- `DELETE /admin/students/{student_id}`: Delete a student and their enrollments.

## Analyst

- `GET /analytics/most-popular-course`: Get the course with the highest enrollment count.
- `GET /analytics/enrollments-per-course`: List enrollment counts/stats per course.
- `GET /analytics/avg-score-by-course`: List average evaluation scores per course.
- `GET /analytics/top-indian-student-by-ai-average`: Get the top performing student (optionally filtered by 'Indian' logic if implemented).
