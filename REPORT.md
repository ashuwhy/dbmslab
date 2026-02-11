# Laboratory Assignment IV Report

## a. Group Name and Members

**Group Name:** Index Corruption

**Members:**
- Ashutosh Sharma (23CS10005)
- Sujal Anil Kaware (23CS30056)
- Parag Mahadeo Chimankar (23CS10049)
- Kshetrimayum Abo (23CS30029)
- Kartik Pandey (23CS30026)

## b. ER Diagram

The Entity-Relationship Diagram for the Student Academic Management System:

![ER Diagram](/Users/chimankarparag/Desktop/dbmslab/docs/er.png)

## c. Table Schema

The system uses a PostgreSQL database with the following key tables:

### RBAC & Users
- `app_user`: Authentication center with email, password hash, and role (admin/instructor/student/analyst).
- `executive`: Profiles for Admin and Analyst roles.

### Core Domain
- `university`: University details.
- `program`: Academic programs (Degree, Diploma, etc.).
- `course`: Course details including duration and capacity.
- `textbook`: Textbooks assigned to courses.
- `topic`: Academic topics.
- `course_topic`: Many-to-many link between courses and topics.

### People & Assignments
- `student`: Student profiles linked to `app_user`.
- `instructor`: Instructor profiles linked to `app_user`.
- `enrollment`: Student enrollments in courses (Date, Score, Status).
- `teaching_assignment`: Instructors assigned to courses.
- `content_item`: Course materials (links, videos).

### Advanced Features
- `course_proposal`: Proposals for new courses by instructors.
- `topic_proposal`: Proposals for new topics by instructors.
- `audit_log`: Logs specific actions like grade changes.

## d. Implemented Functionalities

### 1. Authentication & Security
- **RBAC**: 4 distinct roles (Student, Instructor, Admin, Analyst) with protected routes.
- **JWT Auth**: Stateless authentication using JSON Web Tokens.
- **Password Hashing**: Secure password storage using bcrypt.

### 2. Student Module
- **Browse Courses**: View available courses with search.
- **Enrollment**: One-click enrollment logic with triggers updating course capacity.
- **My Profile**: View personal academic history and grades.

### 3. Instructor Module
- **Dashboard**: View assigned courses and students.
- **Content Management**: Add/Remove course materials (URLs, Books).
- **Grading**: specific feature to grade students.
- **Proposals**: Submit proposals for new courses and topics.
- **Analytics**: View performance stats for their courses.

### 4. Admin Module
- **User Management**: Create/Delete users and assign roles.
- **Approval System**: Approve/Reject course and topic proposals.
- **Course Assignment**: Assign instructors to specific courses.

### 5. Analyst Module
- **System Analytics**: View high-level stats (Most popular course, global averages).
- **Reports**: Generate reports on student risk factors and module performance.

### 6. Database Triggers
- **Auto-Enrollment Count**: Automatically updates `current_enrollment` in `course` table when students enroll/withdraw.

## e. Front-end Tools

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (Primitives for Dialogs, ScrollAreas)
- **Icons**: Lucide React & HugeIcons
- **Graphics**: Three.js & React Three Fiber (3D elements)
- **Linting**: ESLint
