from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Pothole, Blackspot, DriverBehavior, RoadUsage
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/b2g/intelligence", tags=["Intelligence"])

# Pydantic schema for ingestion
class Location(BaseModel):
    lat: float
    lng: float

class PotholeIngestRequest(BaseModel):
    location: Location
    severity: str
    depth_cm: Optional[float] = None

class DriverBehaviorRequest(BaseModel):
    driver_hash: str
    speed_violations: Optional[int] = 0
    drowsiness_frequency: Optional[int] = 0
    avg_reaction_time_ms: Optional[float] = 0.0
    unsafe_driving_zones: Optional[str] = None

class RoadUsageRequest(BaseModel):
    segment_name: str
    location: Location
    traffic_density: float
    congestion_level: str
    peak_hour: int

# endpoints

@router.post("/potholes/ingest")
async def ingest_pothole(request: PotholeIngestRequest, db: Session = Depends(get_db)):
    try:
        # Check if pothole already exists nearby (e.g. within rough lat/lng range)
        # Simplified: checking exact lat/lng or just add a new one
        existing = db.query(Pothole).filter(
            func.round(Pothole.lat, 4) == round(request.location.lat, 4),
            func.round(Pothole.lng, 4) == round(request.location.lng, 4)
        ).first()

        if existing:
            existing.detection_count += 1
            existing.last_detected = datetime.utcnow()
            existing.severity = request.severity # update with latest severity
            db.commit()
            db.refresh(existing)
            return {"status": "updated", "id": existing.id, "detection_count": existing.detection_count}
        else:
            new_pothole = Pothole(
                lat=request.location.lat,
                lng=request.location.lng,
                severity=request.severity,
                depth_cm=request.depth_cm
            )
            db.add(new_pothole)
            db.commit()
            db.refresh(new_pothole)
            return {"status": "created", "id": new_pothole.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/potholes/top-damaged")
async def get_top_damaged_roads(limit: int = 10, db: Session = Depends(get_db)):
    try:
        potholes = db.query(Pothole).order_by(Pothole.detection_count.desc()).limit(limit).all()
        return [{"id": p.id, "lat": p.lat, "lng": p.lng, "severity": p.severity, "detection_count": p.detection_count} for p in potholes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/potholes/heatmap")
async def get_potholes_heatmap(db: Session = Depends(get_db)):
    try:
        potholes = db.query(Pothole).all()
        return [{"lat": p.lat, "lng": p.lng, "weight": p.detection_count} for p in potholes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/blackspots")
async def get_blackspots(db: Session = Depends(get_db)):
    try:
        blackspots = db.query(Blackspot).order_by(Blackspot.risk_score.desc()).all()
        return [
            {
                "id": b.id,
                "segment_name": b.segment_name,
                "lat": b.lat,
                "lng": b.lng,
                "risk_score": b.risk_score,
                "accident_probability": b.accident_probability,
                "time_based_risk": b.time_based_risk
            } for b in blackspots
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/driver-behavior/ingest")
async def ingest_driver_behavior(request: DriverBehaviorRequest, db: Session = Depends(get_db)):
    try:
        behavior = db.query(DriverBehavior).filter(DriverBehavior.driver_hash == request.driver_hash).first()
        if behavior:
            behavior.speed_violations += request.speed_violations
            behavior.drowsiness_frequency += request.drowsiness_frequency
            # simplified moving average
            behavior.avg_reaction_time_ms = (behavior.avg_reaction_time_ms + request.avg_reaction_time_ms) / 2
            if request.unsafe_driving_zones:
                behavior.unsafe_driving_zones = request.unsafe_driving_zones
            behavior.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(behavior)
            return {"status": "updated", "driver_hash": behavior.driver_hash}
        else:
            new_behavior = DriverBehavior(
                driver_hash=request.driver_hash,
                speed_violations=request.speed_violations,
                drowsiness_frequency=request.drowsiness_frequency,
                avg_reaction_time_ms=request.avg_reaction_time_ms,
                unsafe_driving_zones=request.unsafe_driving_zones
            )
            db.add(new_behavior)
            db.commit()
            db.refresh(new_behavior)
            return {"status": "created", "driver_hash": new_behavior.driver_hash}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/driver-behavior/summary")
async def get_driver_behavior_summary(db: Session = Depends(get_db)):
    try:
        total_drivers = db.query(func.count(DriverBehavior.id)).scalar() or 0
        total_speed_violations = db.query(func.sum(DriverBehavior.speed_violations)).scalar() or 0
        total_drowsiness = db.query(func.sum(DriverBehavior.drowsiness_frequency)).scalar() or 0
        avg_reaction = db.query(func.avg(DriverBehavior.avg_reaction_time_ms)).scalar() or 0.0

        return {
            "total_tracked_drivers": total_drivers,
            "total_speed_violations": total_speed_violations,
            "total_drowsiness_events": total_drowsiness,
            "global_avg_reaction_time_ms": round(avg_reaction, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/road-usage/ingest")
async def ingest_road_usage(request: RoadUsageRequest, db: Session = Depends(get_db)):
    try:
        new_usage = RoadUsage(
            segment_name=request.segment_name,
            lat=request.location.lat,
            lng=request.location.lng,
            traffic_density=request.traffic_density,
            congestion_level=request.congestion_level,
            peak_hour=request.peak_hour
        )
        db.add(new_usage)
        db.commit()
        db.refresh(new_usage)
        return {"status": "logged", "id": new_usage.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/road-usage/peak-hours")
async def get_peak_hours(db: Session = Depends(get_db)):
    try:
        usages = db.query(RoadUsage.segment_name, RoadUsage.peak_hour, func.avg(RoadUsage.traffic_density).label("avg_density")) \
            .group_by(RoadUsage.segment_name, RoadUsage.peak_hour).order_by(RoadUsage.peak_hour.desc()).all()
            
        return [{"segment_name": u[0], "peak_hour": u[1], "avg_density": round(u[2], 2) if u[2] else 0.0} for u in usages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
