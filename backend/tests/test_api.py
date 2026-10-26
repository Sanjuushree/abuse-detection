import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.models import RequestLog, Alert, Setting
from backend.engine import init_default_settings, DetectionEngine

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database with StaticPool so all connections share the memory DB
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
import backend.middleware
backend.middleware.SessionLocal = TestingSessionLocal

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    init_default_settings(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "API Sentinel"
    assert "Detect. Analyze. Protect." in data["tagline"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Operational"
    assert "Connected" in data["database_status"]

def test_demo_resource_endpoint():
    response = client.get("/api/demo/resource")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_demo_auth_test_failure_and_success():
    # Failed auth
    fail_res = client.post("/api/demo/auth-test", json={"username": "attacker", "password": "wrong"})
    assert fail_res.status_code == 401

    # Successful auth
    succ_res = client.post("/api/demo/auth-test", json={"username": "admin", "password": "CorrectPass123!"})
    assert succ_res.status_code == 200

def test_rate_limit_detection_rule():
    db = TestingSessionLocal()
    # Trigger multiple requests from same IP
    test_ip = "192.168.100.5"
    for i in range(32):
        log = RequestLog(
            endpoint="/api/demo/resource",
            method="GET",
            client_ip=test_ip,
            status_code=200,
            duration_ms=15.0
        )
        db.add(log)
    db.commit()

    eval_log = RequestLog(
        endpoint="/api/demo/resource",
        method="GET",
        client_ip=test_ip,
        status_code=200,
        duration_ms=15.0
    )
    db.add(eval_log)
    db.commit()

    alerts = DetectionEngine.evaluate_request(db, eval_log)
    assert len(alerts) >= 1
    assert alerts[0].alert_type == "RATE_LIMIT_SPIKE"
    assert alerts[0].source_ip == test_ip
    db.close()

def test_brute_force_detection_rule():
    db = TestingSessionLocal()
    test_ip = "10.10.10.22"
    for i in range(6):
        log = RequestLog(
            endpoint="/api/demo/auth-test",
            method="POST",
            client_ip=test_ip,
            status_code=401,
            duration_ms=50.0
        )
        db.add(log)
    db.commit()

    eval_log = RequestLog(
        endpoint="/api/demo/auth-test",
        method="POST",
        client_ip=test_ip,
        status_code=401,
        duration_ms=50.0
    )
    db.add(eval_log)
    db.commit()

    alerts = DetectionEngine.evaluate_request(db, eval_log)
    assert len(alerts) >= 1
    assert alerts[0].alert_type == "AUTH_BRUTE_FORCE"
    db.close()

def test_alert_status_update():
    db = TestingSessionLocal()
    alert = Alert(
        alert_type="TEST_ALERT",
        severity="Medium",
        category="Rule-Based",
        description="Test alert description",
        source_ip="1.2.3.4",
        detection_reason="Reason explanation",
        status="Open"
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    alert_id = alert.id
    db.close()

    # Update to Investigating
    patch_res = client.patch(f"/api/threats/{alert_id}", json={"status": "Investigating"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Investigating"

    # Update to Resolved
    patch_res2 = client.patch(f"/api/threats/{alert_id}", json={"status": "Resolved"})
    assert patch_res2.status_code == 200
    assert patch_res2.json()["status"] == "Resolved"

def test_settings_validation():
    # Valid update
    valid_payload = {
        "rate_limit_threshold": 45,
        "rate_limit_window_seconds": 60,
        "failed_auth_threshold": 8,
        "failed_auth_window_seconds": 120,
        "scanning_404_threshold": 10,
        "scanning_window_seconds": 60,
        "error_spike_threshold": 15,
        "error_spike_window_seconds": 60,
        "alert_cooldown_seconds": 180,
        "ml_anomaly_contamination": 0.08
    }
    res = client.put("/api/settings", json=valid_payload)
    assert res.status_code == 200

    # Invalid update (contamination > 0.5 should be rejected by Pydantic)
    invalid_payload = valid_payload.copy()
    invalid_payload["ml_anomaly_contamination"] = 0.99
    res_bad = client.put("/api/settings", json=invalid_payload)
    assert res_bad.status_code == 422

def test_csv_reports_export():
    db = TestingSessionLocal()
    db.add(RequestLog(endpoint="/test", method="GET", client_ip="127.0.0.1", status_code=200, duration_ms=10.0))
    db.add(Alert(alert_type="TEST", severity="Low", description="Test", source_ip="127.0.0.1", detection_reason="test"))
    db.commit()
    db.close()

    # Test requests CSV export
    req_csv = client.get("/api/reports/requests/csv")
    assert req_csv.status_code == 200
    assert "text/csv" in req_csv.headers["content-type"]
    assert "Endpoint" in req_csv.text

    # Test alerts CSV export
    alert_csv = client.get("/api/reports/alerts/csv")
    assert alert_csv.status_code == 200
    assert "text/csv" in alert_csv.headers["content-type"]
    assert "Alert Type" in alert_csv.text
