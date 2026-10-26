from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Setting
from ..schemas import SettingItem, SettingsUpdateRequest
from ..engine import DEFAULT_SETTINGS

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=Dict[str, Any])
def get_settings(db: Session = Depends(get_db)):
    db_settings = db.query(Setting).all()
    setting_map = {s.key: s.value for s in db_settings}

    # Ensure all default keys exist
    result = {}
    for k, v in DEFAULT_SETTINGS.items():
        val = setting_map.get(k, v)
        # Parse numeric types where appropriate
        if k == "ml_anomaly_contamination":
            try:
                result[k] = float(val)
            except ValueError:
                result[k] = 0.05
        else:
            try:
                result[k] = int(val)
            except ValueError:
                result[k] = val
    return result

@router.put("", response_model=Dict[str, str])
def update_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    updates = {
        "rate_limit_threshold": str(payload.rate_limit_threshold),
        "rate_limit_window_seconds": str(payload.rate_limit_window_seconds),
        "failed_auth_threshold": str(payload.failed_auth_threshold),
        "failed_auth_window_seconds": str(payload.failed_auth_window_seconds),
        "scanning_404_threshold": str(payload.scanning_404_threshold),
        "scanning_window_seconds": str(payload.scanning_window_seconds),
        "error_spike_threshold": str(payload.error_spike_threshold),
        "error_spike_window_seconds": str(payload.error_spike_window_seconds),
        "alert_cooldown_seconds": str(payload.alert_cooldown_seconds),
        "ml_anomaly_contamination": str(payload.ml_anomaly_contamination)
    }

    now = datetime.now(timezone.utc)
    for key, val in updates.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = val
            setting.updated_at = now
        else:
            db.add(Setting(key=key, value=val, description=key.replace("_", " ").capitalize(), updated_at=now))

    db.commit()
    return {"message": "Settings successfully validated and updated."}
