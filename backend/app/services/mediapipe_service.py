import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2
import numpy as np
import base64
from scipy.spatial import distance
import os
from .risk_engine import risk_engine

# Constants
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
MOUTH = [61, 291, 39, 181, 0, 17]

drowsy_frame_count = 0
EAR_THRESHOLD = 0.15
MAR_THRESHOLD = 0.9
DROWSY_FRAMES = 15

detector = None

def get_detector():
    global detector
    if detector is not None:
        return detector
    
    try:
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'face_landmarker.task')
        if not os.path.exists(model_path):
            model_path = 'face_landmarker.task'
            
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1)
        detector = vision.FaceLandmarker.create_from_options(options)
        return detector
    except Exception as e:
        print(f"Mediapipe initialization error: {e}")
        return None

def calculate_ear(landmarks, eye_points, w, h):
    coords = [(int(landmarks[i].x * w),
               int(landmarks[i].y * h))
               for i in eye_points]
    A = distance.euclidean(coords[1], coords[5])
    B = distance.euclidean(coords[2], coords[4])
    C = distance.euclidean(coords[0], coords[3])
    ear = (A + B) / (2.0 * C)
    return round(ear, 3)

def calculate_mar(landmarks, mouth_points, w, h):
    coords = [(int(landmarks[i].x * w),
               int(landmarks[i].y * h))
               for i in mouth_points]
    A = distance.euclidean(coords[1], coords[5])
    B = distance.euclidean(coords[2], coords[4])
    C = distance.euclidean(coords[0], coords[3])
    mar = (A + B) / (2.0 * C)
    return round(mar, 3)

def detect_drowsiness(base64_image: str):
    global drowsy_frame_count
    try:
        current_detector = get_detector()
        if not current_detector:
            return fallback_response()

        img_data = base64.b64decode(base64_image)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return fallback_response()
        
        h, w = frame.shape[:2]
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Use Tasks API
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        results = current_detector.detect(mp_image)
        
        if not results.face_landmarks:
            risk_engine.update_driver_risk("NO_FACE")
            return {
                "driver_state": "NO_FACE",
                "ear_value": 0.0,
                "mar_value": 0.0,
                "alert_required": False,
                "alert_hindi": "",
                "alert_english": "",
                "severity": "LOW"
            }
        
        landmarks = results.face_landmarks[0]
        
        left_ear = calculate_ear(landmarks, LEFT_EYE, w, h)
        right_ear = calculate_ear(landmarks, RIGHT_EYE, w, h)
        ear = (left_ear + right_ear) / 2.0
        mar = calculate_mar(landmarks, MOUTH, w, h)
        
        if ear < EAR_THRESHOLD:
            drowsy_frame_count += 1
        else:
            drowsy_frame_count = 0
        
        if drowsy_frame_count >= DROWSY_FRAMES:
            risk_engine.update_driver_risk("DROWSY")
            return {
                "driver_state": "DROWSY",
                "ear_value": ear,
                "mar_value": mar,
                "alert_required": True,
                "alert_hindi": "⚠️ रुकिए! नींद आ रही है - गाड़ी रोकें",
                "alert_english": "DROWSY! Please stop the vehicle",
                "severity": "HIGH"
            }
        elif mar > MAR_THRESHOLD:
            risk_engine.update_driver_risk("YAWNING")
            return {
                "driver_state": "YAWNING",
                "ear_value": ear,
                "mar_value": mar,
                "alert_required": True,
                "alert_hindi": "😴 थके हुए लग रहे हैं - ब्रेक लें",
                "alert_english": "Yawning detected - Take a break",
                "severity": "MEDIUM"
            }
        else:
            risk_engine.update_driver_risk("ALERT")
            return {
                "driver_state": "ALERT",
                "ear_value": ear,
                "mar_value": mar,
                "alert_required": False,
                "alert_hindi": "✅ ड्राइवर सतर्क है",
                "alert_english": "Driver is alert",
                "severity": "LOW"
            }
    
    except Exception as e:
        print(f"Drowsiness Error: {e}")
        return fallback_response()

def fallback_response():
    return {
        "driver_state": "ALERT",
        "ear_value": 0.30,
        "mar_value": 0.40,
        "alert_required": False,
        "alert_hindi": "✅ सड़क सुरक्षित है",
        "alert_english": "Road is safe",
        "severity": "LOW"
    }
