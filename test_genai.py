import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_explain():
    try:
        res = requests.post(f"{BASE_URL}/genai/explain", json={"type": "pothole", "severity": "HIGH", "location": "Mumbai"})
        print("Explain Endpoint:", res.json())
    except Exception as e:
        print("Explain Endpoint Failed:", e)

def test_summary():
    try:
        res = requests.get(f"{BASE_URL}/genai/trip-summary")
        print("Summary Endpoint:", res.json())
    except Exception as e:
        print("Summary Endpoint Failed:", e)

if __name__ == "__main__":
    # Note: This requires the server to be running.
    # Since I cannot guarantee it's running, I'll just provide this as a validation script.
    print("Validation script created. Run the backend and then this script.")
