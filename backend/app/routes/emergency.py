from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EmergencyAlert, EmergencyService
from typing import Optional, List
from pydantic import BaseModel
import os
import math
from groq import Groq

router = APIRouter(prefix="/b2g/emergency", tags=["Emergency"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Pydantic schemas
class Location(BaseModel):
    lat: float
    lng: float

class DetectRequest(BaseModel):
    location: Location
    hazard_type: str
    severity_score: int
    frame_base64: Optional[str] = None

class DispatchRequest(BaseModel):
    alert_id: int
    responder_type: str

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula for distance in km
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

@router.post("/detect")
async def detect_emergency(request: DetectRequest, db: Session = Depends(get_db)):
    try:
        # Check if severity makes it a high impact zone
        severity_level = "HIGH_IMPACT" if request.severity_score >= 7 else ("MEDIUM" if request.severity_score >= 4 else "LOW")
        
        # Call Groq for prediction summary
        prompt = f"You are an emergency response AI for Indian roads. Given hazard type '{request.hazard_type}' at severity {request.severity_score}/10, generate a 2-line prediction summary in Hindi and English about accident likelihood and recommended emergency action."
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": prompt}]
        )
        prediction_summary = response.choices[0].message.content
        
        # Find nearest services
        services = db.query(EmergencyService).all()
        nearest_hospital = None
        nearest_police = None
        min_hosp_dist = float('inf')
        min_pol_dist = float('inf')
        
        for svc in services:
            dist = calculate_distance(request.location.lat, request.location.lng, svc.lat, svc.lng)
            if svc.type == "hospital" and dist < min_hosp_dist:
                min_hosp_dist = dist
                nearest_hospital = svc.name
            elif svc.type == "police" and dist < min_pol_dist:
                min_pol_dist = dist
                nearest_police = svc.name
                
        # Estimate dispatch ETA (approx 1 min per km + 3 min dispatch overhead)
        min_dist = min([min_hosp_dist, min_pol_dist]) if min_hosp_dist != float('inf') else 10.0
        dispatch_eta_minutes = int(min_dist * 1.5) + 3

        # Create alert in DB
        new_alert = EmergencyAlert(
            lat=request.location.lat,
            lng=request.location.lng,
            hazard_type=request.hazard_type,
            severity_score=request.severity_score,
            severity_level=severity_level,
            prediction_summary=prediction_summary
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        return {
            "alert_id": new_alert.id,
            "severity_level": severity_level,
            "prediction_summary": prediction_summary,
            "nearest_hospital": nearest_hospital,
            "nearest_police": nearest_police,
            "dispatch_eta_minutes": dispatch_eta_minutes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active-zones")
async def active_zones(db: Session = Depends(get_db)):
    zones = db.query(EmergencyAlert).filter(EmergencyAlert.dispatch_status == "PENDING", EmergencyAlert.severity_level == "HIGH_IMPACT").all()
    return [{
        "alert_id": z.id,
        "location": {"lat": z.lat, "lng": z.lng},
        "hazard_type": z.hazard_type,
        "severity_level": z.severity_level,
        "timestamp": z.created_at,
        "dispatch_status": z.dispatch_status
    } for z in zones]

@router.post("/dispatch")
async def dispatch_responder(request: DispatchRequest, db: Session = Depends(get_db)):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == request.alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.dispatch_status = "DISPATCHED"
    db.commit()
    
    prompt = f"Confirm emergency dispatch of {request.responder_type} to location ({alert.lat}, {alert.lng}) for {alert.hazard_type} incident. Give a 1-line confirmation in Hindi."
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": prompt}]
        )
        confirmation = response.choices[0].message.content
    except:
        confirmation = f"आपातकालीन {request.responder_type} भेज दिया गया है।"

    return {
        "alert_id": alert.id,
        "responder_type": request.responder_type,
        "dispatch_status": "DISPATCHED",
        "eta_minutes": 15,
        "confirmation_message": confirmation
    }

@router.get("/history")
async def dispatch_history(db: Session = Depends(get_db)):
    history = db.query(EmergencyAlert).order_by(EmergencyAlert.created_at.desc()).limit(50).all()
    return [{
        "alert_id": h.id,
        "location": {"lat": h.lat, "lng": h.lng},
        "hazard_type": h.hazard_type,
        "severity_level": h.severity_level,
        "timestamp": h.created_at,
        "dispatch_status": h.dispatch_status,
        "prediction_summary": h.prediction_summary
    } for h in history]
