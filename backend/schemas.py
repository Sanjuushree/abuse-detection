from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Request Log Schemas ---
class RequestLogBase(BaseModel):
    endpoint: str
    method: str
    client_ip: str
    status_code: int
    duration_ms: float
    user_agent: Optional[str] = None
    request_size: Optional[int] = 0

class RequestLogCreate(RequestLogBase):
    pass

class RequestLogResponse(RequestLogBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class RequestLogsPaginated(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    logs: List[RequestLogResponse]

# --- Alert Schemas ---
class AlertBase(BaseModel):
    alert_type: str
    severity: str
    category: str = "Rule-Based"
    description: str
    source_ip: str
    related_endpoint: Optional[str] = None
    detection_reason: str
    evidence: Optional[str] = None

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    status: str = Field(..., pattern="^(Open|Investigating|Resolved)$")

class AlertResponse(AlertBase):
    id: int
    timestamp: datetime
    status: str
    model_config = ConfigDict(from_attributes=True)

class AlertsPaginated(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    alerts: List[AlertResponse]

# --- Setting Schemas ---
class SettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class SettingsUpdateRequest(BaseModel):
    rate_limit_threshold: int = Field(..., ge=1, le=10000, description="Max requests per window")
    rate_limit_window_seconds: int = Field(..., ge=5, le=3600, description="Window in seconds")
    failed_auth_threshold: int = Field(..., ge=1, le=100, description="Max failed auth per window")
    failed_auth_window_seconds: int = Field(..., ge=5, le=3600, description="Failed auth window")
    scanning_404_threshold: int = Field(..., ge=1, le=100, description="Max 404s per window")
    scanning_window_seconds: int = Field(..., ge=5, le=3600, description="Scanning window")
    error_spike_threshold: int = Field(..., ge=1, le=500, description="Max errors per window")
    error_spike_window_seconds: int = Field(..., ge=5, le=3600, description="Error spike window")
    alert_cooldown_seconds: int = Field(..., ge=10, le=3600, description="Cooldown between identical alerts")
    ml_anomaly_contamination: float = Field(..., ge=0.01, le=0.5, description="Expected anomaly fraction")

# --- Dashboard & Analytics Schemas ---
class DashboardOverview(BaseModel):
    total_requests: int
    suspicious_requests: int
    failed_requests: int
    open_alerts: int
    api_health: str
    avg_latency_ms: float

class TimeSeriesPoint(BaseModel):
    time: str
    total: int
    failed: int
    suspicious: int

class DistributionPoint(BaseModel):
    name: str
    value: int
    percentage: float

class DashboardStatsResponse(BaseModel):
    overview: DashboardOverview
    traffic_over_time: List[TimeSeriesPoint]
    status_distribution: List[DistributionPoint]
    method_distribution: List[DistributionPoint]
    recent_logs: List[RequestLogResponse]
    recent_alerts: List[AlertResponse]

# --- IP Analytics Schemas ---
class IPDetail(BaseModel):
    ip: str
    total_requests: int
    failed_requests: int
    error_rate: float
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    unique_endpoints: int
    endpoints_accessed: List[str]
    alert_count: int
    associated_alerts: List[AlertResponse]
    is_suspicious: bool
    evidence_notes: List[str]

# --- Endpoint Analytics Schemas ---
class EndpointDetail(BaseModel):
    endpoint: str
    total_requests: int
    error_count: int
    error_rate: float
    avg_duration_ms: float
    method_counts: Dict[str, int]
    last_accessed: Optional[datetime] = None
    status_distribution: Dict[str, int]

# --- ML Analytics Schemas ---
class MLModelStatus(BaseModel):
    is_trained: bool
    last_trained: Optional[str] = None
    sample_count: int
    anomaly_count: int
    contamination: float
    message: str
    feature_names: List[str]
    evaluation_metrics: Optional[Dict[str, Any]] = None

class MLAnomalyItem(BaseModel):
    source_ip: str
    anomaly_score: float
    is_anomaly: bool
    features: Dict[str, float]
    explanation: str

# --- System Health Schema ---
class HealthResponse(BaseModel):
    status: str
    backend_status: str
    database_status: str
    version: str
    model_status: str
    total_request_logs: int
    total_alerts: int
    active_rules_count: int
