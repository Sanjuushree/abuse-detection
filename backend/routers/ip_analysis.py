from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from ..models import RequestLog, Alert
from ..schemas import IPDetail, AlertResponse

router = APIRouter(prefix="/api/ip-analysis", tags=["IP Analysis"])

@router.get("", response_model=List[IPDetail])
def get_ip_analysis_list(
    search: Optional[str] = Query(None),
    min_requests: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    # Query distinct IPs with aggregated traffic metrics
    ip_stats = (
        db.query(
            RequestLog.client_ip,
            func.count(RequestLog.id).label("total_reqs"),
            func.min(RequestLog.timestamp).label("first_seen"),
            func.max(RequestLog.timestamp).label("last_seen"),
        )
        .group_by(RequestLog.client_ip)
        .order_by(desc("total_reqs"))
        .all()
    )

    results: List[IPDetail] = []
    for stat in ip_stats:
        ip = stat.client_ip
        if search and search.lower() not in ip.lower():
            continue
        if stat.total_reqs < min_requests:
            continue

        failed_count = (
            db.query(func.count(RequestLog.id))
            .filter(RequestLog.client_ip == ip, RequestLog.status_code >= 400)
            .scalar() or 0
        )

        error_rate = round((failed_count / stat.total_reqs * 100), 2) if stat.total_reqs > 0 else 0.0

        endpoints = [
            row[0] for row in db.query(RequestLog.endpoint)
            .filter(RequestLog.client_ip == ip)
            .distinct()
            .limit(10)
            .all()
        ]
        unique_endpoints_count = (
            db.query(func.count(func.distinct(RequestLog.endpoint)))
            .filter(RequestLog.client_ip == ip)
            .scalar() or 0
        )

        alerts_db = db.query(Alert).filter(Alert.source_ip == ip).order_by(desc(Alert.timestamp)).all()
        alert_count = len(alerts_db)

        # Contextual evidence notes (honest indicator analysis, not proof of attack)
        evidence_notes = []
        if error_rate > 40:
            evidence_notes.append(f"Elevated failure rate of {error_rate}% across requests.")
        if alert_count > 0:
            evidence_notes.append(f"Triggered {alert_count} active security alert(s).")
        if unique_endpoints_count > 8:
            evidence_notes.append(f"Broad path reconnaissance across {unique_endpoints_count} endpoints.")
        if stat.total_reqs > 100:
            evidence_notes.append(f"High traffic volume: {stat.total_reqs} cumulative requests.")

        is_suspicious = alert_count > 0 or error_rate > 50

        results.append(
            IPDetail(
                ip=ip,
                total_requests=stat.total_reqs,
                failed_requests=failed_count,
                error_rate=error_rate,
                first_seen=stat.first_seen,
                last_seen=stat.last_seen,
                unique_endpoints=unique_endpoints_count,
                endpoints_accessed=endpoints,
                alert_count=alert_count,
                associated_alerts=[AlertResponse.model_validate(a) for a in alerts_db[:5]],
                is_suspicious=is_suspicious,
                evidence_notes=evidence_notes
            )
        )

    return results

@router.get("/{ip}", response_model=IPDetail)
def get_ip_detail(ip: str, db: Session = Depends(get_db)):
    total_reqs = db.query(func.count(RequestLog.id)).filter(RequestLog.client_ip == ip).scalar() or 0
    if total_reqs == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No request logs recorded for IP address {ip}."
        )

    first_seen = db.query(func.min(RequestLog.timestamp)).filter(RequestLog.client_ip == ip).scalar()
    last_seen = db.query(func.max(RequestLog.timestamp)).filter(RequestLog.client_ip == ip).scalar()
    failed_count = db.query(func.count(RequestLog.id)).filter(RequestLog.client_ip == ip, RequestLog.status_code >= 400).scalar() or 0
    error_rate = round((failed_count / total_reqs * 100), 2)

    endpoints = [
        row[0] for row in db.query(RequestLog.endpoint)
        .filter(RequestLog.client_ip == ip)
        .distinct()
        .limit(25)
        .all()
    ]
    unique_endpoints_count = (
        db.query(func.count(func.distinct(RequestLog.endpoint)))
        .filter(RequestLog.client_ip == ip)
        .scalar() or 0
    )

    alerts_db = db.query(Alert).filter(Alert.source_ip == ip).order_by(desc(Alert.timestamp)).all()

    evidence_notes = []
    if error_rate > 40:
        evidence_notes.append(f"Elevated failure rate of {error_rate}%.")
    if len(alerts_db) > 0:
        evidence_notes.append(f"{len(alerts_db)} threat alert(s) on record.")
    if unique_endpoints_count > 8:
        evidence_notes.append(f"Reconnaissance across {unique_endpoints_count} unique endpoints.")

    return IPDetail(
        ip=ip,
        total_requests=total_reqs,
        failed_requests=failed_count,
        error_rate=error_rate,
        first_seen=first_seen,
        last_seen=last_seen,
        unique_endpoints=unique_endpoints_count,
        endpoints_accessed=endpoints,
        alert_count=len(alerts_db),
        associated_alerts=[AlertResponse.model_validate(a) for a in alerts_db],
        is_suspicious=len(alerts_db) > 0 or error_rate > 50,
        evidence_notes=evidence_notes
    )
