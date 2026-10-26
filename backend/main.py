import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import RequestLog, Alert, Setting
from .engine import init_default_settings
from .middleware import RequestLoggingMiddleware
from .routers import (
    dashboard,
    traffic,
    threats,
    ip_analysis,
    endpoints,
    ml,
    settings,
    reports,
    health,
    demo
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Ensure default detection thresholds exist
    db = SessionLocal()
    try:
        init_default_settings(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="API Sentinel",
    description="API Abuse Detection & Request Behavior Analytics Platform. Tagline: 'Detect. Analyze. Protect.'",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging & behavioral detection middleware
app.add_middleware(RequestLoggingMiddleware)

# Include Routers
app.include_router(dashboard.router)
app.include_router(traffic.router)
app.include_router(threats.router)
app.include_router(ip_analysis.router)
app.include_router(endpoints.router)
app.include_router(ml.router)
app.include_router(settings.router)
app.include_router(reports.router)
app.include_router(health.router)
app.include_router(demo.router)

from fastapi import Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

@app.get("/", tags=["Root"])
def root(request: Request):
    accept = request.headers.get("accept", "")
    if os.path.exists(DIST_DIR) and "text/html" in accept:
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
    return {
        "name": "API Sentinel",
        "tagline": "Detect. Analyze. Protect.",
        "description": "API Abuse Detection & Request Behavior Analytics Platform",
        "status": "Online",
        "documentation": "/docs",
        "health_check": "/api/health"
    }

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
