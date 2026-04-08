from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

router = APIRouter(prefix="/settings", tags=["Settings"])

# In-memory settings store for simplicity
# In production, this would be tied to a Database/Session
settings_store = {
    "profile": {
        "name": "Amir Ali",
        "email": "amir@rastaraksha.ai",
        "phone": "+91 98765 43210",
        "vehicle": "Car"
    },
    "alertSettings": {
        "voiceAlerts": True,
        "potholeAlerts": True,
        "drowsinessAlerts": True,
        "blackspotAlerts": True,
        "sensitivity": 1
    },
    "displaySettings": {
        "refreshRate": 5,
        "showFps": False,
        "compactMode": False
    },
    "privacySettings": {
        "shareData": True,
        "locationTracking": True,
        "tripHistory": True
    },
    "language": "hi"
}

@router.get("/")
async def get_settings():
    return settings_store

@router.post("/")
async def save_settings(payload: Dict[str, Any]):
    try:
        if "profile" in payload:
            settings_store["profile"] = payload["profile"]
        if "alertSettings" in payload:
            settings_store["alertSettings"] = payload["alertSettings"]
        if "displaySettings" in payload:
            settings_store["displaySettings"] = payload["displaySettings"]
        if "privacySettings" in payload:
            settings_store["privacySettings"] = payload["privacySettings"]
        if "language" in payload:
            settings_store["language"] = payload["language"]
        return {"status": "success", "message": "Settings saved to backend."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
