# Frontend Style Guide & Component Analysis

This guide provides a deep analysis of the frontend styles and architecture for the `apps/web` application. Agents should refer to this document when creating new UI components to ensure visual consistency.

## 1. Technlogy Stack
*   **Framework**: Next.js (App Router)
*   **Styling**: Tailwind CSS (v4 compatible config)
*   **Component Library**: shadcn/ui (based on Radix UI primitives)
*   **Font**: Inter (Google Fonts)
*   **Icons**: Lucide React (Standard for shadcn/ui apps)

## 2. Design Tokens & Theme

The application uses a **Dark Mode First** design system.

### Colors (CSS Variables)
Colors are defined in `apps/web/app/globals.css` using HSL values.

| Token | Dark Mode Value (Default) | Hex Approx. | Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `240 10% 3.9%` | `#09090b` | Main page background (Zinc-950) |
| `--foreground` | `0 0% 98%` | `#fafafa` | Main text color (Zinc-50) |
| `--primary` | `0 0% 98%` | `#fafafa` | Primary buttons, active states (White) |
| `--primary-foreground` | `240 5.9% 10%` | `#18181b` | Text on primary elements (Zinc-900) |
| `--secondary` | `240 3.7% 15.9%` | `#27272a` | Secondary buttons (Zinc-800) |
| `--muted` | `240 3.7% 15.9%` | `#27272a` | Muted text backgrounds |
| `--border` | `240 3.7% 15.9%` | `#27272a` | Borders, dividers |
| `--destructive` | `0 62.8% 30.6%` | `#7f1d1d` | Error states, delete actions |

### Typography
*   **Font Family**: `Inter` (Sans-serif).
*   **Visual Style**: Clean, modern, high legibility.

### Spacing & Layout
*   **Root Layout**: Constrained width centered container.
    ```tsx
    <main className="mx-auto max-w-5xl px-6 py-8">
    ```
*   **Corner Radius**: `0rem` (Sharp corners). This gives the app a "brutalist" or professional "New York" style aesthetic.

## 3. Reusable Components (`components/ui`)

The following primitives are already implemented and **must** be reused:

### Buttons (`components/ui/button.tsx`)
*   **Variants**: `default` (Primary), `destructive`, `outline`, `secondary`, `ghost`, `link`.
*   **Sizes**: `default`, `sm`, `lg`, `icon`.
*   **Usage**:
    ```tsx
    <Button variant="default">Primary Action</Button>
    <Button variant="outline">Secondary Action</Button>
    ```

### Cards (`components/ui/card.tsx`)
*   **Structure**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
*   **Styling**: White/Zinc bg, bordered, sharp corners.
*   **Usage**: Grouping related content (e.g., Course details, Student profile).

### Tables (`components/ui/table.tsx`)
*   **Structure**: `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`.
*   **Usage**: Displaying analytical data lists.

### Inputs & Labels
*   `Input`: Standard text fields, styled with focus rings.
*   `Label`: Accessible label component.

### Badges (`components/ui/badge.tsx`)
*   **Usage**: Status indicators (e.g. "Enrolled", "Completed", "Active").

## 4. Guidelines for New Components

1.  **Do Not Invent New Colors**: Use `bg-muted`, `text-muted-foreground`, `border-border`, etc.
2.  **Respect the Grid**: The main content area is `max-w-5xl`. Dashboards can use CSS Grid for layout (e.g., `grid-cols-1 md:grid-cols-3`).
3.  **Dark Mode Compliance**: Always use Tailwind's semantic classes (`bg-background` instead of `bg-black`).
4.  **Composition Over Inheritance**: Compose Shadcn primitives. For example, a "Course Card" should wrap the `Card` component.

## 5. Directory Structure
```
apps/web/
├── app/
│   ├── globals.css      # Component Layer & Theme Definitions
│   ├── layout.tsx       # Root Layout (Navbar + Main Container)
│   ├── page.tsx         # Landing Page
│   └── [routes]/        # Feature pages
├── components/
│   ├── ui/              # Shadcn Primitives (Button, Card, etc.)
│   └── [feature]/       # Feature-specific components (e.g., Navbar)
```
