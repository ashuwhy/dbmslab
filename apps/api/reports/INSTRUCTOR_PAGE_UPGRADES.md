# Instructor Page Upgrades & Modernization Report

This document outlines the necessary upgrades to the existing Instructor Module to meet "Advanced DBMS" standards and align with the project's design system.

## 1. UI Modernization (Refactor)
The current implementation uses custom CSS classes (`card`, `btn`, `tab`). These must be refactored to use the **Shadcn UI** primitives defined in the `FRONTEND_STYLE_GUIDE.md`.

### A. Course Detail Page (`courses/[id]/page.tsx`)
*   **Tabs**: Replace custom `<button>` tabs with `components/ui/tabs` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`).
*   **Tables**: Replace HTML `<table>` with `components/ui/table` (`Table`, `TableHeader`, `TableRow`, `TableCell`).
*   **Forms**: Replace native `<input>` and `<select>` with `components/ui/input` and `components/ui/select` (if available, otherwise standard tailwind forms).
*   **Feedback**: Replace text messages with `components/ui/toast` (or simple Alert banners).

## 2. New Feature: Interactive Grading
**Goal**: Allow instructors to grade students directly from the dashboard.

### Frontend Changes
1.  **Edit Action**: Add a "Pen" icon button to the "Score" column in the Student Table.
2.  **Grading Dialog**: Create a `GradeStudentDialog` component using `components/ui/dialog`.
    *   **Inputs**: `Input` (type="number", min=0, max=100).
    *   **Action**: "Save Grade".

### Backend Requirements
*   **Endpoint**: `PUT /instructor/enrollments/{student_id}/{course_id}`
*   **Body**: `{ "evaluation_score": int }`
*   **Logic**: Update the `enrollment` table. Use an **Audit Trigger** (as defined in `MISSING_ADVANCED_FEATURES.md`) to log the change.

## 3. New Feature: Course Analytics
**Goal**: Provide granular insights per course (Industry-Level Analytics).

### Frontend Changes
*   **New Tab**: Add an "Analytics" tab to the Course Detail view.
*   **Visualization**: Use `recharts` (standard React charting library).
    *   **Score Distribution**: Bar chart showing buckets (0-20, 21-40, ..., 81-100).
    *   **Pass/Fail Ratio**: Pie chart.

### Backend Requirements
*   **Endpoint**: `GET /instructor/courses/{id}/analytics`
*   **Response**:
    ```json
    {
        "distribution": { "0-20": 2, "21-40": 5, ... },
        "pass_rate": 85.5,
        "at_risk_count": 3
    }
    ```

## 4. New Feature: Bulk Operations
**Goal**: Improve instructor productivity.

### Frontend Changes
*   **Download CSV**: Add a "Export Student List" button to the Students tab.
    *   *Implementation*: Client-side generation using `students` JSON data.
*   **Bulk Email**: "Copy Emails" button that copies all student emails to clipboard as a comma-separated string.

## 5. Development Roadmap
1.  **Refactor**: Migrate `courses/[id]/page.tsx` to Shadcn components.
2.  **Backend**: Implement `PUT` grading endpoint.
3.  **Frontend**: Connect Grading Dialog to backend.
4.  **Analytics**: Implement backend aggregation query and frontend charts.
