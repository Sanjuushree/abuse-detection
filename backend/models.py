from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from .database import Base

def utc_now():
    return datetime.now(timezone.utc)

class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    endpoint = Column(String(255), index=True, nullable=False)
    method = Column(String(10), index=True, nullable=False)
    client_ip = Column(String(45), index=True, nullable=False)
    status_code = Column(Integer, index=True, nullable=False)
    duration_ms = Column(Float, nullable=False)
    user_agent = Column(String(500), nullable=True)
    request_size = Column(Integer, default=0)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    alert_type = Column(String(100), index=True, nullable=False)
    severity = Column(String(20), index=True, nullable=False)  # Low, Medium, High, Critical
    category = Column(String(50), default="Rule-Based", index=True)  # Rule-Based, ML-Based
    description = Column(String(500), nullable=False)
    source_ip = Column(String(45), index=True, nullable=False)
    related_endpoint = Column(String(255), nullable=True)
    detection_reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)  # JSON formatted details of supporting evidence
    status = Column(String(20), default="Open", index=True)  # Open, Investigating, Resolved

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
