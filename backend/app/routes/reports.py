from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Trip, Alert
from app.services.risk_engine import risk_engine
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter(tags=["Reports"])

# Blackspots Endpoint
@router.get("/blackspots")
async def get_blackspots():
    try:
        # Mock data for Indian Blackspots
        blackspots_list = [
            {
                "id": 1,
                "name": "Delhi-Meerut Expressway, NH-58",
                "state": "Uttar Pradesh",
                "lat": 28.7041,
                "lng": 77.1025,
                "accident_count": 145,
                "severity": "CRITICAL",
                "description": "High speed crashes due to sudden merges"
            },
            {
                "id": 2,
                "name": "Mumbai-Pune Expressway (Khandala Ghat)",
                "state": "Maharashtra",
                "lat": 18.7734,
                "lng": 73.3643,
                "accident_count": 120,
                "severity": "CRITICAL",
                "description": "Steep curves and heavy vehicle blind spots"
            },
            {
                "id": 3,
                "name": "Bengaluru-Mysuru Highway (NH 275)",
                "state": "Karnataka",
                "lat": 12.6074,
                "lng": 77.2144,
                "accident_count": 98,
                "severity": "HIGH",
                "description": "High frequency of two-wheeler accidents"
            },
            {
                "id": 4,
                "name": "Jaipur-Ajmer Expressway (NH 48)",
                "state": "Rajasthan",
                "lat": 26.5412,
                "lng": 74.9654,
                "accident_count": 110,
                "severity": "CRITICAL",
                "description": "Lane indiscipline and over-speeding"
            },
            {
                "id": 5,
                "name": "Chandigarh-Manali Highway (NH 3) Mandi",
                "state": "Himachal Pradesh",
                "lat": 31.7087,
                "lng": 76.9320,
                "accident_count": 65,
                "severity": "HIGH",
                "description": "Landslide prone blind curves"
            }
        ]
        return {"blackspots": blackspots_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Risk Score
@router.get("/risk-score")
async def get_risk_score():
    try:
        return risk_engine.get_composite_score()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reports
@router.get("/reports/summary")
async def get_reports_summary(db: Session = Depends(get_db)):
    try:
        # Aggregate totals
        total_trips = db.query(func.count(Trip.id)).scalar() or 0
        total_distance = db.query(func.sum(Trip.distance)).scalar() or 0.0
        avg_risk_score = db.query(func.avg(Trip.risk_score)).scalar() or 0.0
        
        # Calculate weekly scores
        now = datetime.utcnow()
        weekly_scores = []
        for i in range(6, -1, -1):
            target_date = now - timedelta(days=i)
            day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            day_avg = db.query(func.avg(Trip.risk_score)).filter(
                Trip.date >= day_start,
                Trip.date <= day_end
            ).scalar()
            weekly_scores.append(int(day_avg) if day_avg else 0)
            
        # Get alert breakdown
        breakdown = db.query(Alert.type, func.count(Alert.id)).group_by(Alert.type).all()
        alert_breakdown = {t: count for t, count in breakdown}
        
        # Merge typical categories if missing
        for category in ['pothole', 'drowsiness', 'speeding', 'lane_departure']:
            if category not in alert_breakdown:
                alert_breakdown[category] = 0

        return {
            "total_trips": total_trips,
            "total_distance": round(total_distance, 1),
            "avg_risk_score": int(avg_risk_score),
            "weekly_scores": weekly_scores,
            "alert_breakdown": alert_breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/recent-alerts")
async def get_recent_alerts(limit: int = 15, db: Session = Depends(get_db)):
    try:
        alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()
        results = []
        for alert in alerts:
            # Map type to Hindi string for authentic feel
            hi_map = {
                "pothole": "आगे गड्ढा है!",
                "drowsiness": "ड्राइवर सतर्क नहीं है!",
                "speeding": "गति सीमा पार!",
                "lane_departure": "लेन से बाहर!"
            }
            results.append({
                "id": str(alert.id),
                "type": alert.type,
                "hindi_text": hi_map.get(alert.type, "सावधान!"),
                "severity": alert.severity,
                "timestamp": alert.timestamp.strftime("%H:%M:%S"),
                "confidence": 0.95
            })
        return {"alerts": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/trips")
async def get_trips(db: Session = Depends(get_db)):
    try:
        trips = db.query(Trip).order_by(Trip.date.desc()).all()
        if not trips:
            # Fallback realistic mock data
            return [
                {
                    "id": 101,
                    "date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                    "distance": 45.2,
                    "risk_score": 92,
                    "alert_count": 2
                },
                {
                    "id": 102,
                    "date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                    "distance": 12.5,
                    "risk_score": 78,
                    "alert_count": 5
                },
                {
                    "id": 103,
                    "date": (datetime.utcnow() - timedelta(days=3)).isoformat(),
                    "distance": 120.4,
                    "risk_score": 88,
                    "alert_count": 3
                },
                {
                    "id": 104,
                    "date": (datetime.utcnow() - timedelta(days=4)).isoformat(),
                    "distance": 8.0,
                    "risk_score": 95,
                    "alert_count": 0
                },
                {
                    "id": 105,
                    "date": (datetime.utcnow() - timedelta(days=5)).isoformat(),
                    "distance": 63.8,
                    "risk_score": 65,
                    "alert_count": 12
                }
            ]
        return trips
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TripData(BaseModel):
    distance: float
    risk_score: int
    alert_count: int

@router.post("/reports/trip")
async def save_trip(data: TripData, db: Session = Depends(get_db)):
    try:
        new_trip = Trip(
            distance=data.distance,
            risk_score=data.risk_score,
            alert_count=data.alert_count
        )
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        return {"id": new_trip.id, "status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
