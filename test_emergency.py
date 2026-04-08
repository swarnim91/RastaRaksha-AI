import requests
import json
import random

# Ensure your backend is running normally on port 8000
url = "http://localhost:8000/b2g/emergency/detect"

# Random Indian Coordinates
lat = random.uniform(19.0, 28.5)
lng = random.uniform(72.8, 77.5)

payload = {
    "location": {
        "lat": lat,
        "lng": lng
    },
    "hazard_type": random.choice(["major_collision", "vehicle_fire", "multi_car_pileup", "hazardous_spill"]),
    "severity_score": random.randint(7, 10) # 7-10 is HIGH_IMPACT
}

headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending mock emergency detection (Severity: {payload['severity_score']}) to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ Success! Alert Registered:")
        print(f"Alert ID: {data.get('alert_id')}")
        print(f"Prediction Summary: {data.get('prediction_summary')}")
        print(f"Nearest Hospital: {data.get('nearest_hospital')}")
        print(f"Nearest Police: {data.get('nearest_police')}")
        print(f"Dispatch ETA: {data.get('dispatch_eta_minutes')} minutes")
        print("\nNow check your Emergency Dispatch Dashboard (http://localhost:5173/emergency-dispatch)!")
    else:
        print(f"❌ Failed. Status Code: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
    print("Ensure the backend is running (uvicorn main:app --reload)")
