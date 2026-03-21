from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    entropy = Column(Float)
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class SuspiciousIP(Base):
    __tablename__ = "suspicious_ips"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, index=True)
    count = Column(Integer, default=0)
    last_detected = Column(DateTime, default=datetime.utcnow)


class AttackLog(Base):
    __tablename__ = "attack_logs"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    request_count = Column(Integer, default=0)
    entropy_value = Column(Float)
    status = Column(String)
    reason = Column(String)
    source = Column(String, default="realtime")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
