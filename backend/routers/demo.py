import random
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import RequestLog, Alert
from ..engine import DetectionEngine
from ..ml_analytics import ml_engine

router = APIRouter(prefix="/api/demo", tags=["Demo & Monitored Resources"])

class DemoResourcePayload(BaseModel):
    action: Optional[str] = "view"
    data: Optional[Dict[str, Any]] = None

class AuthTestPayload(BaseModel):
    username: Optional[str] = "admin"
    password: Optional[str] = None  # Never log actual passwords

@router.get("/resource")
def get_sample_resource():
    return {
        "status": "success",
        "service": "Inventory Analytics Engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "items_tracked": 1420,
            "latency_target": "50ms",
            "region": "us-east-1"
        }
    }

@router.post("/resource")
def post_sample_resource(payload: DemoResourcePayload):
    return {
        "status": "accepted",
        "action": payload.action,
        "processed_at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/auth-test")
def simulate_auth_attempt(payload: AuthTestPayload):
    # Simulated auth failure if password != "CorrectPass123!"
    if payload.password != "CorrectPass123!":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials supplied."
        )
    return {"status": "authenticated", "token_type": "Bearer", "expires_in": 3600}

@router.get("/error-test")
def simulate_server_error():
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Simulated internal server exception."
    )

@router.post("/generate-traffic")
def generate_sample_traffic(
    scenario: str = Query("all_scenarios", description="normal, brute_force, rate_spike, path_scan, all_scenarios"),
    db: Session = Depends(get_db)
):
    """
    Safely generates realistic, labeled traffic batches to populate database for immediate college demo.
    Generates both benign baseline and simulated attack patterns.
    """
    now = datetime.now(timezone.utc)
    created_count = 0
    new_alerts = []

    # 1. Normal Baseline Traffic from legitimate clients
    normal_ips = ["192.168.1.101", "192.168.1.102", "192.168.1.103", "10.0.0.45", "10.0.0.78", "172.16.0.12"]
    normal_endpoints = [
        ("/api/demo/resource", "GET", 200, 25.0),
        ("/api/demo/resource", "POST", 201, 45.0),
        ("/api/products", "GET", 200, 30.0),
        ("/api/users/profile", "GET", 200, 35.0),
        ("/api/orders", "GET", 200, 60.0),
        ("/api/notifications", "GET", 200, 15.0),
        ("/api/auth/login", "POST", 200, 50.0),
    ]

    if scenario in ("normal", "all_scenarios"):
        for i in range(35):
            ip = random.choice(normal_ips)
            ep, method, status_code, base_dur = random.choice(normal_endpoints)
            duration = max(5.0, base_dur + random.uniform(-10.0, 30.0))
            ts = now - timedelta(seconds=random.randint(10, 1800))
            log = RequestLog(
                timestamp=ts,
                endpoint=ep,
                method=method,
                client_ip=ip,
                status_code=status_code,
                duration_ms=round(duration, 2),
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0",
                request_size=random.randint(120, 1500)
            )
            db.add(log)
            created_count += 1

    # 2. Rate Limit Spike Scenario
    if scenario in ("rate_spike", "all_scenarios"):
        spike_ip = "203.0.113.88"
        for i in range(40):
            ts = now - timedelta(seconds=random.randint(1, 45))
            log = RequestLog(
                timestamp=ts,
                endpoint="/api/demo/resource",
                method="GET",
                client_ip=spike_ip,
                status_code=200,
                duration_ms=round(random.uniform(8.0, 22.0), 2),
                user_agent="Python-urllib/3.10 scraper-bot",
                request_size=80
            )
            db.add(log)
            created_count += 1
        db.commit()
        # Evaluate last request to trigger alert
        eval_log = RequestLog(
            timestamp=now,
            endpoint="/api/demo/resource",
            method="GET",
            client_ip=spike_ip,
            status_code=200,
            duration_ms=12.0
        )
        db.add(eval_log)
        db.commit()
        alerts = DetectionEngine.evaluate_request(db, eval_log)
        new_alerts.extend([a.alert_type for a in alerts])

    # 3. Credential Brute Force Scenario
    if scenario in ("brute_force", "all_scenarios"):
        brute_ip = "198.51.100.42"
        for i in range(8):
            ts = now - timedelta(seconds=random.randint(1, 90))
            log = RequestLog(
                timestamp=ts,
                endpoint="/api/demo/auth-test",
                method="POST",
                client_ip=brute_ip,
                status_code=401,
                duration_ms=round(random.uniform(30.0, 75.0), 2),
                user_agent="Hydra/9.5-dev automated",
                request_size=250
            )
            db.add(log)
            created_count += 1
        db.commit()
        eval_log = RequestLog(
            timestamp=now,
            endpoint="/api/demo/auth-test",
            method="POST",
            client_ip=brute_ip,
            status_code=401,
            duration_ms=45.0
        )
        db.add(eval_log)
        db.commit()
        alerts = DetectionEngine.evaluate_request(db, eval_log)
        new_alerts.extend([a.alert_type for a in alerts])

    # 4. Path Scanning / Probe Scenario
    if scenario in ("path_scan", "all_scenarios"):
        scanner_ip = "185.220.101.5"
        fuzz_paths = ["/admin.php", "/wp-login.php", "/.env", "/config.json", "/api/v1/debug", "/backup.sql", "/phpmyadmin"]
        for p in fuzz_paths:
            ts = now - timedelta(seconds=random.randint(5, 55))
            log = RequestLog(
                timestamp=ts,
                endpoint=p,
                method="GET",
                client_ip=scanner_ip,
                status_code=404,
                duration_ms=round(random.uniform(5.0, 18.0), 2),
                user_agent="Nikto/2.1.6 web-scanner",
                request_size=0
            )
            db.add(log)
            created_count += 1
        db.commit()
        eval_log = RequestLog(
            timestamp=now,
            endpoint="/wp-config.php.bak",
            method="GET",
            client_ip=scanner_ip,
            status_code=404,
            duration_ms=10.0
        )
        db.add(eval_log)
        db.commit()
        alerts = DetectionEngine.evaluate_request(db, eval_log)
        new_alerts.extend([a.alert_type for a in alerts])

    # 5. Error Burst / Fault Induction Scenario
    if scenario in ("error_burst", "all_scenarios"):
        error_ip = "192.0.2.199"
        for i in range(12):
            ts = now - timedelta(seconds=random.randint(2, 50))
            code = random.choice([500, 502, 503])
            log = RequestLog(
                timestamp=ts,
                endpoint="/api/demo/error-test",
                method="POST",
                client_ip=error_ip,
                status_code=code,
                duration_ms=round(random.uniform(150.0, 400.0), 2),
                user_agent="FuzzBot/1.2",
                request_size=500
            )
            db.add(log)
            created_count += 1
        db.commit()
        eval_log = RequestLog(
            timestamp=now,
            endpoint="/api/demo/error-test",
            method="POST",
            client_ip=error_ip,
            status_code=500,
            duration_ms=250.0
        )
        db.add(eval_log)
        db.commit()
        alerts = DetectionEngine.evaluate_request(db, eval_log)
        new_alerts.extend([a.alert_type for a in alerts])

    db.commit()

    # Automatically trigger ML training if we have sufficient client IPs now
    ml_train_result = ml_engine.train_and_evaluate(db)

    return {
        "status": "success",
        "scenario": scenario,
        "logs_generated": created_count,
        "alerts_triggered": new_alerts,
        "ml_training_result": ml_train_result.get("message", "ML engine updated")
    }
