import requests
import json

url = "http://127.0.0.1:8000/chat"
payload = {
    "message": "Hello, how are you?",
    "language": "en",
    "history": []
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
