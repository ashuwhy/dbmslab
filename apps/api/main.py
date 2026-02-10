import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, student, instructor, admin, analyst
from reports import router as reports

app = FastAPI(title="Assignment IV API", version="1.0.0")

# With allow_credentials=True, CORS spec forbids allow_origins="*"; use explicit origins.
# CORS_ORIGINS env: comma-separated list (e.g. https://dbmslab-ten.vercel.app,http://localhost:3000)
_default_origins = [
    "https://dbmslab-ten.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_cors_origins = os.getenv("CORS_ORIGINS")
allow_origins = [o.strip() for o in _cors_origins.split(",")] if _cors_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(instructor.router)
app.include_router(admin.router)
app.include_router(analyst.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    return {"message": "Hello World"}
