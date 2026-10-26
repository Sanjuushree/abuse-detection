from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from ..database import get_db
from ..models import Alert
from ..schemas import AlertsPaginated, AlertResponse, AlertUpdate

router = APIRouter(prefix="/api/threats", tags=["Threat Alerts"])

@router.get("", response_model=AlertsPaginated)
def get_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
    severity: Optional[str] = Query(None, description="Low, Medium, High, Critical"),
    status_filter: Optional[str] = Query(None, alias="status", description="Open, Investigating, Resolved"),
    category: Optional[str] = Query(None, description="Rule-Based, ML-Based"),
    search: Optional[str] = Query(None, description="Search description, IP, or endpoint"),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if severity:
        query = query.filter(Alert.severity == severity)

    if status_filter:
        query = query.filter(Alert.status == status_filter)

    if category:
        query = query.filter(Alert.category == category)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Alert.description.ilike(search_filter)) |
            (Alert.source_ip.ilike(search_filter)) |
            (Alert.related_endpoint.ilike(search_filter)) |
            (Alert.alert_type.ilike(search_filter))
        )

    query = query.order_by(desc(Alert.timestamp))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    alerts_db = query.offset(offset).limit(page_size).all()

    return AlertsPaginated(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        alerts=[AlertResponse.model_validate(a) for a in alerts_db]
    )

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found."
        )
    return AlertResponse.model_validate(alert)

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert_status(alert_id: int, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found."
        )

    alert.status = payload.status
    db.commit()
    db.refresh(alert)
    return AlertResponse.model_validate(alert)
