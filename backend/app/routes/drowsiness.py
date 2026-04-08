from fastapi import APIRouter
from app.services.mediapipe_service import detect_drowsiness

router = APIRouter(prefix="/detect", tags=["Drowsiness"])

@router.post("/drowsiness")
async def detect_driver_drowsiness(data: dict):
    return detect_drowsiness(data.get("image", ""))
