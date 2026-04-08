import urllib.request
import os

def download_file(url, filename):
    if os.path.exists(filename):
        print(f"{filename} already exists. Skipping download.")
        return
    
    print(f"Downloading {filename} from {url}...")
    try:
        urllib.request.urlretrieve(url, filename)
        print("Download complete.")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

if __name__ == "__main__":
    # MediaPipe Face Landmarker model
    mp_model_url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    download_file(mp_model_url, "face_landmarker.task")
    
    # YOLOv8n model (optional, ultralytics usually handles it, but just in case)
    yolo_model_url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt"
    # download_file(yolo_model_url, "yolov8n.pt")
