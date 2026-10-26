from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from ..models import RequestLog
from ..schemas import EndpointDetail

router = APIRouter(prefix="/api/endpoints", tags=["Endpoint Analytics"])

@router.get("", response_model=List[EndpointDetail])
def get_endpoint_analytics(db: Session = Depends(get_db)):
    # Group by endpoint
    endpoint_stats = (
        db.query(
            RequestLog.endpoint,
            func.count(RequestLog.id).label("total_reqs"),
            func.avg(RequestLog.duration_ms).label("avg_dur"),
            func.max(RequestLog.timestamp).label("last_accessed")
        )
        .group_by(RequestLog.endpoint)
        .order_by(desc("total_reqs"))
        .all()
    )

    results: List[EndpointDetail] = []
    for stat in endpoint_stats:
        ep = stat.endpoint
        total = stat.total_reqs
        avg_dur = round(float(stat.avg_dur or 0.0), 2)
        last_acc = stat.last_accessed

        # Error count (4xx, 5xx)
        error_count = (
            db.query(func.count(RequestLog.id))
            .filter(RequestLog.endpoint == ep, RequestLog.status_code >= 400)
            .scalar() or 0
        )
        error_rate = round((error_count / total * 100), 2) if total > 0 else 0.0

        # Method counts
        method_counts_db = (
            db.query(RequestLog.method, func.count(RequestLog.id))
            .filter(RequestLog.endpoint == ep)
            .group_by(RequestLog.method)
            .all()
        )
        method_counts = {m: c for m, c in method_counts_db}

        # Status distribution
        status_db = (
            db.query(RequestLog.status_code, func.count(RequestLog.id))
            .filter(RequestLog.endpoint == ep)
            .group_by(RequestLog.status_code)
            .all()
        )
        status_dist = {str(code): count for code, count in status_db}

        results.append(
            EndpointDetail(
                endpoint=ep,
                total_requests=total,
                error_count=error_count,
                error_rate=error_rate,
                avg_duration_ms=avg_dur,
                method_counts=method_counts,
                last_accessed=last_acc,
                status_distribution=status_dist
            )
        )

    return results
