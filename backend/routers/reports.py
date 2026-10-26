import csv
import io
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import RequestLog, Alert

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/requests/csv")
def export_requests_csv(
    start_date: Optional[str] = Query(None, description="ISO format date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="ISO format date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    query = db.query(RequestLog)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(RequestLog.timestamp >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(RequestLog.timestamp <= end_dt)
        except ValueError:
            pass

    logs = query.order_by(desc(RequestLog.timestamp)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp (UTC)", "Client IP", "Method", "Endpoint", "Status Code", "Duration (ms)", "User Agent"])

    for l in logs:
        ts_str = l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else ""
        writer.writerow([
            l.id,
            ts_str,
            l.client_ip,
            l.method,
            l.endpoint,
            l.status_code,
            l.duration_ms,
            l.user_agent or ""
        ])

    csv_data = output.getvalue()
    filename = f"api_sentinel_request_logs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/alerts/csv")
def export_alerts_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Alert.timestamp >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Alert.timestamp <= end_dt)
        except ValueError:
            pass

    alerts = query.order_by(desc(Alert.timestamp)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp (UTC)", "Alert Type", "Severity", "Category", "Source IP", "Related Endpoint", "Status", "Description", "Detection Reason"])

    for a in alerts:
        ts_str = a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else ""
        writer.writerow([
            a.id,
            ts_str,
            a.alert_type,
            a.severity,
            a.category,
            a.source_ip,
            a.related_endpoint or "",
            a.status,
            a.description,
            a.detection_reason
        ])

    csv_data = output.getvalue()
    filename = f"api_sentinel_threat_alerts_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
