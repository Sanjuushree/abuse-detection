import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import RequestLog, Alert, Setting

DEFAULT_SETTINGS = {
    "rate_limit_threshold": "30",
    "rate_limit_window_seconds": "60",
    "failed_auth_threshold": "5",
    "failed_auth_window_seconds": "120",
    "scanning_404_threshold": "6",
    "scanning_window_seconds": "60",
    "error_spike_threshold": "10",
    "error_spike_window_seconds": "60",
    "alert_cooldown_seconds": "120",
    "ml_anomaly_contamination": "0.05",
}

def get_settings_dict(db: Session) -> Dict[str, str]:
    db_settings = db.query(Setting).all()
    current_settings = {s.key: s.value for s in db_settings}
    # Fallback to defaults if missing
    for k, v in DEFAULT_SETTINGS.items():
        if k not in current_settings:
            current_settings[k] = v
    return current_settings

def init_default_settings(db: Session):
    for key, val in DEFAULT_SETTINGS.items():
        exists = db.query(Setting).filter(Setting.key == key).first()
        if not exists:
            desc = key.replace("_", " ").capitalize()
            db.add(Setting(key=key, value=val, description=desc))
    db.commit()

class DetectionEngine:
    """
    Explainable Rule-Based API Abuse Detection Engine.
    Detects rate anomalies, brute force attempts, path scanning, and error bursts.
    Maintains alert cooldowns to prevent alarm flooding.
    """

    @staticmethod
    def is_in_cooldown(db: Session, alert_type: str, source_ip: str, cooldown_seconds: int) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=cooldown_seconds)
        recent_alert = (
            db.query(Alert)
            .filter(
                Alert.alert_type == alert_type,
                Alert.source_ip == source_ip,
                Alert.timestamp >= cutoff
            )
            .first()
        )
        return recent_alert is not None

    @classmethod
    def evaluate_request(cls, db: Session, log: RequestLog) -> List[Alert]:
        alerts_generated = []
        settings = get_settings_dict(db)
        cooldown_sec = int(settings.get("alert_cooldown_seconds", 120))
        now = log.timestamp or datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # Rule 1: Excessive Request Rate (High-Frequency Burst / DoS)
        # -------------------------------------------------------------
        rate_window = int(settings.get("rate_limit_window_seconds", 60))
        rate_threshold = int(settings.get("rate_limit_threshold", 30))
        rate_cutoff = now - timedelta(seconds=rate_window)

        recent_request_count = (
            db.query(func.count(RequestLog.id))
            .filter(
                RequestLog.client_ip == log.client_ip,
                RequestLog.timestamp >= rate_cutoff
            )
            .scalar() or 0
        )

        if recent_request_count >= rate_threshold:
            if not cls.is_in_cooldown(db, "RATE_LIMIT_SPIKE", log.client_ip, cooldown_sec):
                severity = "High" if recent_request_count > (rate_threshold * 2) else "Medium"
                alert = Alert(
                    timestamp=now,
                    alert_type="RATE_LIMIT_SPIKE",
                    severity=severity,
                    category="Rule-Based",
                    description=f"High request rate detected from {log.client_ip}: {recent_request_count} requests in {rate_window}s.",
                    source_ip=log.client_ip,
                    related_endpoint=log.endpoint,
                    detection_reason=(
                        f"Client exceeded the configured threshold of {rate_threshold} requests per {rate_window} seconds. "
                        "This pattern may indicate an automated scraper, script, or Denial-of-Service attempt."
                    ),
                    evidence=json.dumps({
                        "request_count": recent_request_count,
                        "time_window_seconds": rate_window,
                        "threshold": rate_threshold,
                        "latest_endpoint": log.endpoint,
                        "method": log.method
                    }),
                    status="Open"
                )
                db.add(alert)
                alerts_generated.append(alert)

        # -------------------------------------------------------------
        # Rule 2: Repeated Failed Authentication (Brute Force / Credential Abuse)
        # -------------------------------------------------------------
        auth_window = int(settings.get("failed_auth_window_seconds", 120))
        auth_threshold = int(settings.get("failed_auth_threshold", 5))
        auth_cutoff = now - timedelta(seconds=auth_window)

        if log.status_code in (401, 403):
            failed_auth_count = (
                db.query(func.count(RequestLog.id))
                .filter(
                    RequestLog.client_ip == log.client_ip,
                    RequestLog.status_code.in_([401, 403]),
                    RequestLog.timestamp >= auth_cutoff
                )
                .scalar() or 0
            )

            if failed_auth_count >= auth_threshold:
                if not cls.is_in_cooldown(db, "AUTH_BRUTE_FORCE", log.client_ip, cooldown_sec):
                    alert = Alert(
                        timestamp=now,
                        alert_type="AUTH_BRUTE_FORCE",
                        severity="Critical" if failed_auth_count > (auth_threshold * 2) else "High",
                        category="Rule-Based",
                        description=f"Potential credential brute force from {log.client_ip}: {failed_auth_count} failed auth attempts.",
                        source_ip=log.client_ip,
                        related_endpoint=log.endpoint,
                        detection_reason=(
                            f"Client accumulated {failed_auth_count} HTTP 401/403 responses within {auth_window} seconds. "
                            "Repeated authentication failures are a classic indicator of credential stuffing or dictionary attacks."
                        ),
                        evidence=json.dumps({
                            "failed_auth_count": failed_auth_count,
                            "time_window_seconds": auth_window,
                            "threshold": auth_threshold,
                            "endpoint": log.endpoint,
                            "latest_status": log.status_code
                        }),
                        status="Open"
                    )
                    db.add(alert)
                    alerts_generated.append(alert)

        # -------------------------------------------------------------
        # Rule 3: Repeated Nonexistent Endpoints (Directory/Route Scanning)
        # -------------------------------------------------------------
        scan_window = int(settings.get("scanning_window_seconds", 60))
        scan_threshold = int(settings.get("scanning_404_threshold", 6))
        scan_cutoff = now - timedelta(seconds=scan_window)

        if log.status_code == 404:
            count_404 = (
                db.query(func.count(RequestLog.id))
                .filter(
                    RequestLog.client_ip == log.client_ip,
                    RequestLog.status_code == 404,
                    RequestLog.timestamp >= scan_cutoff
                )
                .scalar() or 0
            )

            if count_404 >= scan_threshold:
                if not cls.is_in_cooldown(db, "ENDPOINT_SCANNING", log.client_ip, cooldown_sec):
                    # Fetch distinct endpoints probed
                    probed_routes = [
                        row[0] for row in db.query(RequestLog.endpoint)
                        .filter(
                            RequestLog.client_ip == log.client_ip,
                            RequestLog.status_code == 404,
                            RequestLog.timestamp >= scan_cutoff
                        )
                        .distinct()
                        .limit(5)
                        .all()
                    ]

                    alert = Alert(
                        timestamp=now,
                        alert_type="ENDPOINT_SCANNING",
                        severity="Medium",
                        category="Rule-Based",
                        description=f"Endpoint scanning probe from {log.client_ip}: {count_404} 404 responses.",
                        source_ip=log.client_ip,
                        related_endpoint=log.endpoint,
                        detection_reason=(
                            f"Client triggered {count_404} HTTP 404 Not Found responses within {scan_window} seconds. "
                            "This behavior indicates aggressive reconnaissance or automated endpoint fuzzing."
                        ),
                        evidence=json.dumps({
                            "not_found_count": count_404,
                            "time_window_seconds": scan_window,
                            "threshold": scan_threshold,
                            "sample_probed_paths": probed_routes
                        }),
                        status="Open"
                    )
                    db.add(alert)
                    alerts_generated.append(alert)

        # -------------------------------------------------------------
        # Rule 4: Unusual Concentration of Errors (Error Burst / Fault Induction)
        # -------------------------------------------------------------
        err_window = int(settings.get("error_spike_window_seconds", 60))
        err_threshold = int(settings.get("error_spike_threshold", 10))
        err_cutoff = now - timedelta(seconds=err_window)

        if log.status_code >= 400:
            total_errors = (
                db.query(func.count(RequestLog.id))
                .filter(
                    RequestLog.client_ip == log.client_ip,
                    RequestLog.status_code >= 400,
                    RequestLog.timestamp >= err_cutoff
                )
                .scalar() or 0
            )

            if total_errors >= err_threshold:
                if not cls.is_in_cooldown(db, "HTTP_ERROR_BURST", log.client_ip, cooldown_sec):
                    has_5xx = (
                        db.query(func.count(RequestLog.id))
                        .filter(
                            RequestLog.client_ip == log.client_ip,
                            RequestLog.status_code >= 500,
                            RequestLog.timestamp >= err_cutoff
                        )
                        .scalar() or 0
                    ) > 0

                    severity = "High" if has_5xx else "Medium"
                    alert = Alert(
                        timestamp=now,
                        alert_type="HTTP_ERROR_BURST",
                        severity=severity,
                        category="Rule-Based",
                        description=f"Abnormal error burst from {log.client_ip}: {total_errors} error responses.",
                        source_ip=log.client_ip,
                        related_endpoint=log.endpoint,
                        detection_reason=(
                            f"Client accumulated {total_errors} HTTP 4xx/5xx responses in {err_window} seconds. "
                            "Concentrations of errors can indicate payload fuzzing, exploit attempts, or backend disruption."
                        ),
                        evidence=json.dumps({
                            "error_count": total_errors,
                            "time_window_seconds": err_window,
                            "threshold": err_threshold,
                            "contains_server_errors_5xx": has_5xx,
                            "latest_status": log.status_code
                        }),
                        status="Open"
                    )
                    db.add(alert)
                    alerts_generated.append(alert)

        if alerts_generated:
            db.commit()
            for a in alerts_generated:
                db.refresh(a)

        return alerts_generated
