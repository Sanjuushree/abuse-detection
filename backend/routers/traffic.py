from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from ..database import get_db
from ..models import RequestLog
from ..schemas import RequestLogsPaginated, RequestLogResponse

router = APIRouter(prefix="/api/traffic", tags=["Live Traffic"])

@router.get("", response_model=RequestLogsPaginated)
def get_traffic_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = Query(None, description="Search endpoint or IP"),
    method: Optional[str] = Query(None),
    status_code: Optional[int] = Query(None),
    status_category: Optional[str] = Query(None, description="2xx, 4xx, 5xx"),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(RequestLog)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (RequestLog.endpoint.ilike(search_filter)) | 
            (RequestLog.client_ip.ilike(search_filter))
        )

    if method:
        query = query.filter(RequestLog.method == method.upper())

    if status_code:
        query = query.filter(RequestLog.status_code == status_code)

    if status_category:
        if status_category == "2xx":
            query = query.filter(RequestLog.status_code >= 200, RequestLog.status_code < 300)
        elif status_category == "3xx":
            query = query.filter(RequestLog.status_code >= 300, RequestLog.status_code < 400)
        elif status_category == "4xx":
            query = query.filter(RequestLog.status_code >= 400, RequestLog.status_code < 500)
        elif status_category == "5xx":
            query = query.filter(RequestLog.status_code >= 500, RequestLog.status_code < 600)

    # Sorting
    sort_column = getattr(RequestLog, sort_by, RequestLog.timestamp)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    logs_db = query.offset(offset).limit(page_size).all()

    return RequestLogsPaginated(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        logs=[RequestLogResponse.model_validate(l) for l in logs_db]
    )
