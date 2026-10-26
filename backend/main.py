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

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "API Sentinel",
        "tagline": "Detect. Analyze. Protect.",
        "description": "API Abuse Detection & Request Behavior Analytics Platform",
        "status": "Online",
        "documentation": "/docs",
        "health_check": "/api/health"
    }
