# Laboratory Assignment IV Report

**Group Name:** Index Corruption
**Members:**

- Ashutosh Sharma (23CS10005)
- Sujal Anil Kaware (23CS30056)
- Parag Mahadeo Chimankar (23CS10049)
- Kshetrimayum Abo (23CS30029)
- Kartik Pandey (23CS30026)

## Table Schema

See [SCHEMA.md](./SCHEMA.md) for the detailed database schema derived from the existing database.
Major tables used:

- `university`, `program`, `course`, `student`, `instructor`, `enrollment`, `teaching_assignment`, `content_item`.
- `app_user`: Added for RBAC authentication.

## Implemented Functionalities

### 1. Authentication & RBAC

- Role-Based Access Control (RBAC) with 4 roles: Student, Instructor, Admin, Analyst.
- JWT-based stateless authentication.
- Frontend route protection and dynamic menus.

### 2. Student Module

- **Browse Courses**: View list of available courses with search functionality.
- **Enrollment**: One-click enrollment in courses.
- **My Enrollments**: View credits and grades for enrolled courses.

### 3. Instructor Module

- **Dashboard**: View assigned teaching courses.
- **Content Management**: Upload/Add content items (PDF, Video links) to specific courses.

### 4. Admin Module

- **User Management**: Create system users with specific roles.
  - **User-Student Synchronization**: Automatically creates a linked `Student` profile when a new user with the "Student" role is created, ensuring consistency between auth and domain tables.
  - **Validation**: Enforces age restrictions (must be >= 13) and required fields for student creation.
- **Course Assignment**: Assign instructors to courses.
- **Student Management**: Cascade delete students and their enrollments.
- **Data Editing**: Update details for Courses and Instructors via modal dialogs.
- **Navigation (UX)**: Dynamic Navbar with role-based badges (Admin=Red, Student=Green, etc.) and real-time login/logout state updates.

### 5. Analyst Module

- **Dashboard**: Visual cards and tables for key statistics.
- **Stats**: Most popular course, enrollments per course, average scores, and top performers.

## Frontend Tools

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Linting**: ESLint

## Setup & Running

1. **Backend**:

   ```bash
   make dev-api
   ```

2. **Frontend**:

   ```bash
   make dev-web
   ```

3. **Database**: PostgreSQL (lab server).

## ER Diagram

(Include the ER Diagram PDF/Image here)
