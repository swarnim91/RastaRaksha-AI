from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base
from datetime import datetime

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    distance = Column(Float, default=0.0)
    risk_score = Column(Integer, default=0)
    alert_count = Column(Integer, default=0)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, index=True)
    type = Column(String, index=True)
    severity = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    avg_ear = Column(Float, default=0.0)
    total_drowsy_events = Column(Integer, default=0)

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    hazard_type = Column(String)
    severity_score = Column(Integer)
    severity_level = Column(String)
    prediction_summary = Column(String)
    dispatch_status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)

class EmergencyService(Base):
    __tablename__ = "emergency_services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    contact = Column(String)

class Pothole(Base):
    __tablename__ = "potholes"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    severity = Column(String)
    depth_cm = Column(Float, nullable=True)
    detection_count = Column(Integer, default=1)
    last_detected = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class Blackspot(Base):
    __tablename__ = "blackspots"
    id = Column(Integer, primary_key=True, index=True)
    segment_name = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)
    risk_score = Column(Float)
    accident_probability = Column(Float)
    time_based_risk = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DriverBehavior(Base):
    __tablename__ = "driver_behaviors"
    id = Column(Integer, primary_key=True, index=True)
    driver_hash = Column(String, index=True, unique=True)
    speed_violations = Column(Integer, default=0)
    drowsiness_frequency = Column(Integer, default=0)
    avg_reaction_time_ms = Column(Float, default=0.0)
    unsafe_driving_zones = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

class RoadUsage(Base):
    __tablename__ = "road_usages"
    id = Column(Integer, primary_key=True, index=True)
    segment_name = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)
    traffic_density = Column(Float)
    congestion_level = Column(String)
    peak_hour = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ContractorTask(Base):
    __tablename__ = "contractor_tasks"
    id = Column(Integer, primary_key=True, index=True)
    road_name = Column(String, index=True)
    task_type = Column(String)
    contractor_name = Column(String)
    status = Column(String, default="pending")
    priority = Column(String, default="MEDIUM")
    location_desc = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    proof_image_url = Column(String, nullable=True)
    verified_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_hash = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)
    report_type = Column(String)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    validation_status = Column(String, default="pending")
    validated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_role = Column(String, index=True)
    user_id = Column(String, index=True)
    action = Column(String)
    resource = Column(String)
    details = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

