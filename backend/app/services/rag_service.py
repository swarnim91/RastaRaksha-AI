import os
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if self.api_key and "gsk_" in self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("Groq client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self.client = None
        else:
            logger.warning("No valid Groq API key found. Using fallback mode.")
            self.client = None
        
        self.system_prompt = """You are RastaRaksha AI, India's road safety assistant. You help drivers with:
1. Indian traffic rules and Motor Vehicles Act
2. Road safety tips specific to Indian conditions
3. Emergency guidance for accidents
4. Tips for long drives, fatigue management
Always respond in the same language as the user's message.
If user writes in Hindi, respond in Hindi. Keep responses concise and practical.
Format important warnings with ⚠️ emoji."""
        
    def get_chat_response(self, message: str, language: str, history: list):
        if not self.client:
            logger.info("Chatbot called but client is None. Returning fallback.")
            return self.get_fallback_response(language)

        try:
            messages = [{"role": "system", "content": self.system_prompt}]
            for m in history:
                messages.append({"role": m["role"], "content": m["content"]})
            messages.append({"role": "user", "content": message})
            
            logger.info(f"Calling Groq with message: {message[:50]}...")
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile", # Latest supported Groq model
                max_tokens=500,
                messages=messages
            )
            return {
                "response": response.choices[0].message.content,
                "language_detected": language,
                "suggested_questions": ["What are speed limits on highways?", "मुझे नींद आ रही है, क्या करूं?"] if language == "hi" else ["What does Motor Vehicles Act say about drunk driving?", "Highway driving tips?"]
            }
        except Exception as e:
            logger.error(f"Groq API Error: {type(e).__name__}: {e}")
            return self.get_fallback_response(language)

    def get_fallback_response(self, language: str):
        if language == "hi":
            return {
                "response": "⚠️ यह एक डेमो मोड है। भारतीय मोटर वाहन अधिनियम के तहत सुरक्षित ड्राइविंग बहुत महत्वपूर्ण है। हमेशा सीटबेल्ट पहनें और गति सीमा का पालन करें।",
                "language_detected": "hi",
                "suggested_questions": ["मुझे नींद आ रही है, क्या करूं?", "गति सीमा क्या है?"]
            }
        else:
            return {
                "response": "⚠️ Mode offline. As per Indian road safety guidelines, always wear a seatbelt and avoid over-speeding. Take a break every 2 hours on long highway drives.",
                "language_detected": "en",
                "suggested_questions": ["What is the speed limit on NHAI highways?", "What to do if feeling sleepy?"]
            }

rag_service = RAGService()
