import os
import logging
from groq import Groq
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import detection, drowsiness, chatbot, reports, settings, emergency, intelligence
from app.database import engine, Base

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Set up simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RastaRaksha")

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Rastaraksha AI API",
    description="Backend API for Rastaraksha AI road safety application",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Model loading happens inside services upon instantiation
    logger.info("Starting up RastaRaksha AI Backend Services...")

# Include routers
app.include_router(detection.router)
app.include_router(drowsiness.router)
app.include_router(chatbot.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(emergency.router)
app.include_router(intelligence.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "RastaRaksha AI backend running gracefully"}

@app.post("/detect/location")
async def update_location(data: dict):
    return {
      "status": "ok",
      "lat": data.get("latitude"),
      "lng": data.get("longitude")
    }

@app.post("/genai/explain")
async def explain_alert(data: dict):
    alert_type = data.get("type", "pothole")
    severity = data.get("severity", "HIGH")
    location = data.get("location", "unknown")
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": """You are RastaRaksha AI.
                    Give a 2-3 line practical driving 
                    advice in Hindi for the detected 
                    road hazard. Be specific and helpful.
                    Use simple Hindi language.
                    Always end with a safety tip."""
                },
                {
                    "role": "user", 
                    "content": f"""
                    Hazard detected: {alert_type}
                    Severity: {severity}
                    Location context: {location}
                    
                    Give specific Hindi advice for 
                    this situation in 2-3 lines only.
                    """
                }
            ],
            max_tokens=150
        )
        
        explanation = response.choices[0].message.content
        
        return {
            "explanation": explanation,
            "type": alert_type,
            "severity": severity,
            "generated_by": "GenAI (LLaMA)"
        }
        
    except Exception as e:
        # Fallback explanations
        fallbacks = {
            "pothole": "आगे गड्ढा है! गाड़ी धीमी करें और सावधानी से निकलें। टायर और suspension को नुकसान हो सकता है।",
            "drowsy": "नींद आ रही है! तुरंत गाड़ी रोकें और 15 मिनट का break लें। थकान सबसे बड़ा road accident का कारण है।",
            "blackspot": "यह खतरनाक क्षेत्र है! यहाँ पहले कई accidents हो चुके हैं। speed कम करें और सतर्क रहें।"
        }
        return {
            "explanation": fallbacks.get(
                alert_type, 
                "सावधान रहें! safe driving करें।"
            ),
            "generated_by": "Fallback"
        }

@app.get("/genai/trip-summary")
async def generate_trip_summary():
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are RastaRaksha AI. Generate a brief, encouraging trip safety summary in Hindi. Be positive but mention safety tips."
                },
                {
                    "role": "user",
                    "content": """
                    Trip data:
                    - Distance: 23.4 km
                    - Duration: 1h 12m  
                    - Potholes avoided: 7
                    - Drowsiness alerts: 2
                    - Safe score: 87/100
                    
                    Generate a 3-4 line trip 
                    summary in Hindi with 
                    safety feedback.
                    """
                }
            ],
            max_tokens=200
        )
        
        return {
            "summary": response.choices[0].message.content,
            "generated_by": "GenAI"
        }
        
    except:
        return {
            "summary": "आपने आज 23.4 km की सुरक्षित यात्रा की! 7 गड्ढों से बचाव किया। Safe score 87/100 — बहुत अच्छा! कल भी सुरक्षित drive करें। 🏆",
            "generated_by": "Fallback"
        }

@app.post("/genai/road-analysis")
async def analyze_road(data: dict):
    detections = data.get("detections", [])
    location = data.get("location", "unknown area")
    
    try:
        detection_text = ", ".join([
            f"{d['label']} (confidence: {d['confidence']})" 
            for d in detections[:3]
        ]) if detections else "no detections"
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI road safety analyst. Analyze road conditions and give specific advice in Hindi."
                },
                {
                    "role": "user",
                    "content": f"""
                    Current road detections: {detection_text}
                    Location: {location}
                    Time: daytime
                    
                    Give a 2-3 line road condition 
                    analysis in Hindi. What should 
                    the driver do right now?
                    """
                }
            ],
            max_tokens=150
        )
        
        return {
            "analysis": response.choices[0].message.content,
            "risk_level": "HIGH" if detections else "LOW",
            "generated_by": "GenAI"
        }
        
    except:
        return {
            "analysis": "सड़क की स्थिति सामान्य है। सावधानी से drive करें।",
            "risk_level": "LOW"
        }

@app.post("/assistant/voice")
async def voice_assistant(data: dict):
    message = data.get("message", "")
    language = data.get("language", "hi")
    context = data.get("context", {})
    
    lang_instruction = {
        "hi": "Respond in Hindi only.",
        "en": "Respond in English only.",
        "mr": "Respond in Marathi only.",
        "ta": "Respond in Tamil only.",
        "te": "Respond in Telugu only.",
        "bn": "Respond in Bengali only."
    }.get(language, "Respond in Hindi only.")
    
    context_text = f"""
    Current driving context:
    - Speed: {context.get('speed', 0)} km/h
    - Location: {context.get('location', 'unknown')}
    - Destination: {context.get('destination', 'not set')}
    - Nearest hazard: {context.get('nearest_hazard', 'none')}
    - Driver state: {context.get('driver_state', 'ALERT')}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are RastaRaksha AI 
                    voice assistant for Indian drivers.
                    {lang_instruction}
                    
                    You help with:
                    - Navigation guidance
                    - Road safety tips
                    - Traffic rules
                    - Emergency help
                    - General driving assistance
                    
                    Keep responses SHORT (1-2 sentences).
                    You are talking to a DRIVER so be 
                    brief and clear.
                    
                    Special commands to detect:
                    - If user says navigate/go to [place]:
                      return action: "navigate" + 
                      destination name
                    - If user says mute/quiet/band karo:
                      return action: "mute"
                    - If user says SOS/emergency/help:
                      return action: "sos"
                    
                    {context_text}"""
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            max_tokens=100
        )
        
        reply = response.choices[0].message.content
        
        # Detect special actions
        action = None
        destination = None
        
        msg_lower = message.lower()
        if any(w in msg_lower for w in 
               ['navigate', 'go to', 'jao', 
                'chalao', 'le chalo']):
            action = 'navigate'
            destination = message
            
        if any(w in msg_lower for w in 
               ['mute', 'quiet', 'band', 
                'chup', 'stop']):
            action = 'mute'
            
        if any(w in msg_lower for w in 
               ['sos', 'emergency', 'help', 
                'madad', 'bachao']):
            action = 'sos'
        
        return {
            "response": reply,
            "action": action,
            "destination": destination,
            "language": language
        }
        
    except Exception as e:
        fallbacks = {
            "hi": "माफ करें, अभी सहायता उपलब्ध नहीं है।",
            "en": "Sorry, assistant unavailable now.",
        }
        return {
            "response": fallbacks.get(
                language, 
                "माफ करें, कुछ गलत हुआ।"
            ),
            "action": None
        }

@app.get("/")
async def root():
    return {
        "app_name": "RastaRaksha AI",
        "description": "India's GenAI Road Safety Assistant API endpoint.",
        "status": "active"
    }