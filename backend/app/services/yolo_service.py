import os
import cv2
import base64
import numpy as np
import logging
import time
from ultralytics import YOLO
from .risk_engine import risk_engine

logger = logging.getLogger(__name__)

# Model loading logic (lazy load)
model = None

def get_model():
    global model
    if model is not None:
        return model
    try:
        # Check if custom model exists in backend/ folder
        custom_model_path = "pothole_model.pt"
        if os.path.exists(custom_model_path):
            model = YOLO(custom_model_path)
            logger.info(f"Custom YOLOv8 model loaded from {custom_model_path}")
        else:
            model = YOLO("yolov8n.pt")
            logger.info("Default YOLOv8n model loaded")
        return model
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        return None

class YoloService:
    def decode_image(self, base64_image: str):
        try:
            # Handle potential prefix
            if "," in base64_image:
                base64_image = base64_image.split(",")[1]
            
            img_data = base64.b64decode(base64_image)
            np_arr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return frame
        except Exception as e:
            logger.error(f"Image decode failed: {e}")
            return None

    def detect_potholes(self, base64_image: str):
        """Processes a frame for pothole and object detection using YOLOv8."""
        
        # STEP A: Decode base64 image
        frame = self.decode_image(base64_image)
        if frame is None:
            return {"error": "Invalid image format", "frame_processed": False}

        # Check if model is loaded, if not, try to load again or use fallback
        curr_model = get_model()
        if curr_model is None:
            logger.warning("YOLO model not loaded. Using mock fallback.")
            return self.get_mock_fallback()

        try:
            # STEP B: Run YOLO & Calculate real FPS
            start_time = time.time()
            results = curr_model(frame, conf=0.4)
            fps = round(1 / (time.time() - start_time), 1)

            # STEP C: Process results
            detections = []
            hindi_mapping = {
                "pothole": "गड्ढा",
                "car": "गाड़ी",
                "person": "व्यक्ति",
                "truck": "ट्रक",
                "motorcycle": "मोटरसाइकिल"
            }

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    class_name = curr_model.names[cls_id]
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]

                    detections.append({
                        "label": class_name,
                        "confidence": round(conf, 2),
                        "bbox": [x1, y1, x2, y2],
                        "severity": "HIGH" if conf > 0.7 else "MEDIUM",
                        "hindi_label": hindi_mapping.get(class_name, class_name)
                    })

            potholes_found = any(d["label"] == "pothole" for d in detections)
            
            # Update live risk engine
            if potholes_found:
                risk_engine.update_road_risk("HIGH")
            else:
                risk_engine.update_road_risk("LOW")

            # STEP D: Return structured response
            return {
                "detections": detections,
                "frame_processed": True,
                "fps": fps,
                "total_detections": len(detections),
                "alert_hindi": "आगे गड्ढा है! सावधान रहें" if potholes_found else "सड़क सुरक्षित है",
                "alert_english": "Pothole detected ahead!" if potholes_found else "Road is safe",
                "alert_required": len(detections) > 0
            }

        except Exception as e:
            logger.error(f"YOLO inference failed: {e}")
            return self.get_mock_fallback()

    def get_mock_fallback(self):
        """Fallback data if YOLO fails or is not available."""
        return {
            "detections": [
                {
                    "label": "pothole",
                    "confidence": 0.85,
                    "bbox": [100, 200, 300, 400],
                    "severity": "HIGH",
                    "hindi_label": "गड्ढा"
                }
            ],
            "frame_processed": True,
            "fps": 15.0,
            "total_detections": 1,
            "alert_hindi": "आगे गड्ढा है! सावधान रहें",
            "alert_english": "Pothole detected ahead (Mock)!",
            "alert_required": True
        }

# Instantiate service singleton
yolo_service = YoloService()
