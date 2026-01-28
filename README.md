# Assignment IV: Student Academic Management System

A full-stack monorepo for the DBMS Assignment IV (Group "Index Corruption").

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL
- **Tools**: Make, uv (or pip), npm

## Structure

- `/apps/web`: Next.js Frontend
- `/apps/api`: FastAPI Backend
- `/docs`: Documentation and Reports

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Access to the Lab Database (see `.env.example`)

### Installation

1. **Bootstrap**

   ```bash
   make install
   ```

   This will install dependencies for both frontend and backend.

2. **Environment**
   Copy `.env.example` to `.env` and update with real credentials.

   ```bash
   cp .env.example .env
   ```

## Development

### Run Everything

```bash
make dev
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000>
- API Docs: <http://localhost:8000/docs>

### Individual Services

- **Backend Only**: `make dev-api`
- **Frontend Only**: `make dev-web`

## Reporting

See [REPORT.md](./REPORT.md) for the detailed assignment report.
