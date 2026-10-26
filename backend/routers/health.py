from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..models import RequestLog, Alert, Setting
from ..ml_analytics import ml_engine
from ..schemas import HealthResponse

router = APIRouter(prefix="/api/health", tags=["System Health"])

@router.get("", response_model=HealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    # Check DB connectivity
    db_status = "Disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "Connected (SQLite Operational)"
    except Exception as e:
        db_status = f"Error: {str(e)}"

    total_logs = db.query(RequestLog).count()
    total_alerts = db.query(Alert).count()
    active_rules = 4 # Rate Limit, Auth Brute Force, Scanning, Error Bursts

    model_status_text = "Initialized & Ready" if ml_engine.is_trained else "Awaiting Training Data"

    overall_status = "Operational" if "Connected" in db_status else "Degraded"

    return HealthResponse(
        status=overall_status,
        backend_status="Online (FastAPI / Uvicorn)",
        database_status=db_status,
        version="1.0.0-PROD",
        model_status=model_status_text,
        total_request_logs=total_logs,
        total_alerts=total_alerts,
        active_rules_count=active_rules
    )
