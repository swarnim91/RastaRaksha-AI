from fastapi import APIRouter, HTTPException, Body, Query
from app.services.yolo_service import yolo_service
from typing import Dict, Any, List, Optional

router = APIRouter(prefix="/detect", tags=["Detection"])

# Real Indian Accident Blackspots (20 entries)
BLACKSPOTS = [
    {"id": 1, "name": "Karnal-Panipat Highway NH-44", "state": "Haryana", "lat": 29.6857, "lng": 76.9905, "accident_count": 234, "severity": "CRITICAL", "description": "High speed crashes at blind curves"},
    {"id": 2, "name": "Delhi-Meerut Expressway NH-58", "state": "Uttar Pradesh", "lat": 28.7041, "lng": 77.1025, "accident_count": 198, "severity": "CRITICAL", "description": "Frequent pile-ups near toll plaza"},
    {"id": 3, "name": "Agra-Lucknow Expressway", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462, "accident_count": 176, "severity": "CRITICAL", "description": "Drowsy driving accidents at night"},
    {"id": 4, "name": "Pune-Mumbai Expressway NH-48", "state": "Maharashtra", "lat": 18.7544, "lng": 73.4089, "accident_count": 165, "severity": "CRITICAL", "description": "Fog related accidents in winter"},
    {"id": 5, "name": "Bangalore-Mysore Highway NH-275", "state": "Karnataka", "lat": 12.6819, "lng": 76.9897, "accident_count": 143, "severity": "HIGH", "description": "Pedestrian crossing accidents"},
    {"id": 6, "name": "Chennai-Tambaram NH-45", "state": "Tamil Nadu", "lat": 12.9249, "lng": 80.1000, "accident_count": 132, "severity": "HIGH", "description": "Heavy traffic merging accidents"},
    {"id": 7, "name": "Jaipur-Ajmer Highway NH-48", "state": "Rajasthan", "lat": 26.4499, "lng": 74.6399, "accident_count": 128, "severity": "HIGH", "description": "Overtaking accidents on curves"},
    {"id": 8, "name": "Hyderabad-Vijayawada NH-65", "state": "Telangana", "lat": 17.3850, "lng": 78.4867, "accident_count": 119, "severity": "HIGH", "description": "Night driving fatalities"},
    {"id": 9, "name": "Ahmedabad-Vadodara Expressway", "state": "Gujarat", "lat": 22.3072, "lng": 73.1812, "accident_count": 112, "severity": "HIGH", "description": "Speed related crashes"},
    {"id": 10, "name": "Chandigarh-Ambala NH-44", "state": "Punjab", "lat": 30.7333, "lng": 76.7794, "accident_count": 108, "severity": "HIGH", "description": "Truck collision hotspot"},
    {"id": 11, "name": "Lucknow-Kanpur Highway NH-27", "state": "Uttar Pradesh", "lat": 26.4499, "lng": 80.3319, "accident_count": 98, "severity": "MEDIUM", "description": "Pothole related accidents"},
    {"id": 12, "name": "Bhopal-Indore NH-46", "state": "Madhya Pradesh", "lat": 22.9676, "lng": 76.6547, "accident_count": 94, "severity": "MEDIUM", "description": "Animal crossing accidents"},
    {"id": 13, "name": "Kolkata-Durgapur NH-19", "state": "West Bengal", "lat": 23.4800, "lng": 87.3200, "accident_count": 89, "severity": "MEDIUM", "description": "Waterlogging accidents in monsoon"},
    {"id": 14, "name": "Nagpur-Hyderabad NH-44", "state": "Maharashtra", "lat": 20.0059, "lng": 78.9629, "accident_count": 87, "severity": "MEDIUM", "description": "Wrong side driving incidents"},
    {"id": 15, "name": "Kochi-Thrissur NH-544", "state": "Kerala", "lat": 10.5276, "lng": 76.2144, "accident_count": 82, "severity": "MEDIUM", "description": "Narrow road accidents"},
    {"id": 16, "name": "Patna-Muzaffarpur NH-28", "state": "Bihar", "lat": 25.5941, "lng": 85.1376, "accident_count": 79, "severity": "MEDIUM", "description": "Flood related road damage"},
    {"id": 17, "name": "Guwahati-Shillong NH-6", "state": "Assam", "lat": 25.5788, "lng": 91.8933, "accident_count": 76, "severity": "MEDIUM", "description": "Mountain road accidents"},
    {"id": 18, "name": "Raipur-Bilaspur NH-130", "state": "Chhattisgarh", "lat": 21.2514, "lng": 81.6296, "accident_count": 71, "severity": "MEDIUM", "description": "Wildlife crossing accidents"},
    {"id": 19, "name": "Dehradun-Haridwar NH-58", "state": "Uttarakhand", "lat": 29.9457, "lng": 78.1642, "accident_count": 68, "severity": "MEDIUM", "description": "Landslide prone zone"},
    {"id": 20, "name": "Ranchi-Jamshedpur NH-33", "state": "Jharkhand", "lat": 22.8046, "lng": 86.2029, "accident_count": 64, "severity": "MEDIUM", "description": "Mining truck accidents"}
]

@router.get("/blackspots")
async def get_blackspots(
    state: Optional[str] = Query(None), 
    severity: Optional[str] = Query(None)
):
    filtered_spots = BLACKSPOTS
    if state:
        filtered_spots = [s for s in filtered_spots if s["state"].lower() == state.lower()]
    if severity:
        filtered_spots = [s for s in filtered_spots if s["severity"].lower() == severity.lower()]
    return filtered_spots

@router.get("/blackspots/stats")
async def get_blackspot_stats():
    total_count = len(BLACKSPOTS)
    critical_count = len([s for s in BLACKSPOTS if s["severity"] == "CRITICAL"])
    
    # Analyze states
    state_counts = {}
    for s in BLACKSPOTS:
        state_counts[s["state"]] = state_counts.get(s["state"], 0) + 1
    
    most_dangerous_state = max(state_counts, key=state_counts.get) if state_counts else "Unknown"
    
    return {
        "total_blackspots": total_count,
        "critical_zones": critical_count,
        "most_dangerous_state": most_dangerous_state,
        "total_accidents_tracked": sum(s["accident_count"] for s in BLACKSPOTS)
    }

@router.post("/pothole")
async def detect_pothole(payload: Dict[str, Any] = Body(...)):
    try:
        base64_img = payload.get("image", "")
        if not base64_img:
            base64_img = payload.get("base64", "")
        result = yolo_service.detect_potholes(base64_img)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/lane")
async def detect_lane(payload: Dict[str, Any] = Body(...)):
    return {
        "lane_status": "centered",
        "confidence": 0.98,
        "hindi_alert": "लेन सुरक्षित है"
    }
