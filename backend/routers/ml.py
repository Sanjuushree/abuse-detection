from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..ml_analytics import ml_engine
from ..schemas import MLModelStatus, MLAnomalyItem
from ..models import Setting

router = APIRouter(prefix="/api/ml", tags=["ML Analytics"])

@router.get("/status", response_model=MLModelStatus)
def get_ml_status(db: Session = Depends(get_db)):
    contamination_setting = db.query(Setting).filter(Setting.key == "ml_anomaly_contamination").first()
    contamination = float(contamination_setting.value) if contamination_setting else 0.05

    if not ml_engine.is_trained:
        return MLModelStatus(
            is_trained=False,
            last_trained=None,
            sample_count=0,
            anomaly_count=0,
            contamination=contamination,
            message="Isolation Forest model is currently untrained. Accumulate request traffic across distinct client IPs and trigger training.",
            feature_names=ml_engine.feature_names,
            evaluation_metrics=None
        )

    return MLModelStatus(
        is_trained=True,
        last_trained=ml_engine.last_trained,
        sample_count=ml_engine.sample_count,
        anomaly_count=ml_engine.anomaly_count,
        contamination=ml_engine.contamination,
        message=f"Isolation Forest model active. Trained on {ml_engine.sample_count} client profiles.",
        feature_names=ml_engine.feature_names,
        evaluation_metrics=ml_engine.evaluation_metrics
    )

@router.post("/train")
def train_ml_model(contamination: float = Query(0.05, ge=0.01, le=0.5), db: Session = Depends(get_db)):
    result = ml_engine.train_and_evaluate(db, contamination=contamination)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Training could not be completed.")
        )
    return result

@router.get("/anomalies", response_model=List[MLAnomalyItem])
def get_anomaly_scores(db: Session = Depends(get_db)):
    if not ml_engine.is_trained:
        # Try auto-training if data is available
        ml_engine.train_and_evaluate(db)

    raw_results = ml_engine.score_all_ips(db)
    anomalies: List[MLAnomalyItem] = []
    for item in raw_results:
        anomalies.append(
            MLAnomalyItem(
                source_ip=item["source_ip"],
                anomaly_score=item["anomaly_index"],
                is_anomaly=item["is_anomaly"],
                features=item["features"],
                explanation=item["explanation"]
            )
        )
    return anomalies
