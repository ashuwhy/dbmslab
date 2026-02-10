from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, student, instructor, admin, analyst
from reports import router as reports

app = FastAPI(title="Assignment IV API", version="1.0.0")

# With allow_credentials=True, CORS spec forbids allow_origins="*"; use explicit origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
