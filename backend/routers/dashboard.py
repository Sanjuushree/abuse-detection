from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from ..models import RequestLog, Alert
from ..schemas import DashboardStatsResponse, DashboardOverview, TimeSeriesPoint, DistributionPoint, RequestLogResponse, AlertResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(hours: int = 24, db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    total_requests = db.query(func.count(RequestLog.id)).filter(RequestLog.timestamp >= cutoff).scalar() or 0
    failed_requests = db.query(func.count(RequestLog.id)).filter(
        RequestLog.timestamp >= cutoff,
        RequestLog.status_code >= 400
    ).scalar() or 0

    open_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "Open").scalar() or 0

    # Suspicious requests: requests from IPs that have triggered open alerts
    alert_ips = [r[0] for r in db.query(Alert.source_ip).filter(Alert.status == "Open").distinct().all()]
    if alert_ips:
        suspicious_requests = db.query(func.count(RequestLog.id)).filter(
            RequestLog.timestamp >= cutoff,
            RequestLog.client_ip.in_(alert_ips)
        ).scalar() or 0
    else:
        suspicious_requests = 0

    avg_latency = db.query(func.avg(RequestLog.duration_ms)).filter(RequestLog.timestamp >= cutoff).scalar() or 0.0

    # API Health determination
    error_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0.0
    if total_requests == 0:
        api_health = "Healthy (Standby)"
    elif error_rate > 35 or open_alerts > 10:
        api_health = "Critical Attention"
    elif error_rate > 15 or open_alerts > 3:
        api_health = "Degraded Performance"
    else:
        api_health = "Optimal Operating State"

    overview = DashboardOverview(
        total_requests=total_requests,
        suspicious_requests=suspicious_requests,
        failed_requests=failed_requests,
        open_alerts=open_alerts,
        api_health=api_health,
        avg_latency_ms=round(float(avg_latency), 2)
    )

    # Traffic over time (aggregate into buckets, e.g. 12 points)
    # Fetch logs for interval breakdown
    logs = (
        db.query(RequestLog)
        .filter(RequestLog.timestamp >= cutoff)
        .order_by(RequestLog.timestamp.asc())
        .all()
    )

    traffic_over_time: List[TimeSeriesPoint] = []
    if logs:
        # Group by hour / time slots
        buckets: Dict[str, Dict[str, int]] = {}
        for l in logs:
            slot_str = l.timestamp.strftime("%H:%M") if hours <= 24 else l.timestamp.strftime("%b %d %H:00")
            if slot_str not in buckets:
                buckets[slot_str] = {"total": 0, "failed": 0, "suspicious": 0}
            buckets[slot_str]["total"] += 1
            if l.status_code >= 400:
                buckets[slot_str]["failed"] += 1
            if l.client_ip in alert_ips:
                buckets[slot_str]["suspicious"] += 1

        for slot, counts in list(buckets.items())[-20:]:  # Last 20 time slices
            traffic_over_time.append(
                TimeSeriesPoint(
                    time=slot,
                    total=counts["total"],
                    failed=counts["failed"],
                    suspicious=counts["suspicious"]
                )
            )

    # Status distribution (2xx, 3xx, 4xx, 5xx)
    status_distribution: List[DistributionPoint] = []
    if total_requests > 0:
        status_groups = (
            db.query(RequestLog.status_code, func.count(RequestLog.id))
            .filter(RequestLog.timestamp >= cutoff)
            .group_by(RequestLog.status_code)
            .all()
        )
        grouped_status: Dict[str, int] = {"2xx Success": 0, "3xx Redirection": 0, "4xx Client Error": 0, "5xx Server Error": 0}
        for code, count in status_groups:
            if 200 <= code < 300:
                grouped_status["2xx Success"] += count
            elif 300 <= code < 400:
                grouped_status["3xx Redirection"] += count
            elif 400 <= code < 500:
                grouped_status["4xx Client Error"] += count
            elif 500 <= code < 600:
                grouped_status["5xx Server Error"] += count
            else:
                grouped_status["Other"] = grouped_status.get("Other", 0) + count

        for name, count in grouped_status.items():
            if count > 0:
                pct = round((count / total_requests) * 100, 1)
                status_distribution.append(DistributionPoint(name=name, value=count, percentage=pct))

    # Method distribution
    method_distribution: List[DistributionPoint] = []
    if total_requests > 0:
        method_groups = (
            db.query(RequestLog.method, func.count(RequestLog.id))
            .filter(RequestLog.timestamp >= cutoff)
            .group_by(RequestLog.method)
            .all()
        )
        for method, count in method_groups:
            pct = round((count / total_requests) * 100, 1)
            method_distribution.append(DistributionPoint(name=method, value=count, percentage=pct))

    # Recent logs
    recent_logs_db = (
        db.query(RequestLog)
        .order_by(desc(RequestLog.timestamp))
        .limit(8)
        .all()
    )
    recent_logs = [RequestLogResponse.model_validate(l) for l in recent_logs_db]

    # Recent alerts
    recent_alerts_db = (
        db.query(Alert)
        .order_by(desc(Alert.timestamp))
        .limit(5)
        .all()
    )
    recent_alerts = [AlertResponse.model_validate(a) for a in recent_alerts_db]

    return DashboardStatsResponse(
        overview=overview,
        traffic_over_time=traffic_over_time,
        status_distribution=status_distribution,
        method_distribution=method_distribution,
        recent_logs=recent_logs,
        recent_alerts=recent_alerts
    )
