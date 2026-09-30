import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from .config import settings
from .database import engine, Base, SessionLocal, verify_and_init_db
from .seed import seed_data_if_empty
from .routers import auth, complaints, evidence, notifications, audit, reference, work_orders

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify DB connectivity, ensure PostGIS / pgvector extensions, and create tables
    verify_and_init_db()
    # Seed initial institutional data if empty
    db = SessionLocal()
    try:
        seed_data_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="GrievanceGrid Civic Resolution API",
    description="Evidence-aware municipal civic grievance reporting and authoritative resolution engine.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Alias /api/docs and /api/openapi.json for compatibility
@app.get("/api/docs", include_in_schema=False)
def redirect_to_docs():
    return RedirectResponse(url="/docs")

# Include Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(reference.router, prefix="/api")
app.include_router(work_orders.router, prefix="/api")

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "GrievanceGrid Civic Resolution API",
        "backend": "FastAPI (Authoritative Single Source of Truth)",
        "database": "PostgreSQL + PostGIS + pgvector",
        "version": "1.0.0"
    }

# Consistent Human-Readable Error Formatting
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Server error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "A municipal service disruption occurred. Please try again shortly or contact support.",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )
