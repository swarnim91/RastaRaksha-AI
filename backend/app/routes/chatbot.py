from fastapi import APIRouter
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/chat")
async def chat(data: dict):
    user_message = data.get("message", "")
    language = data.get("language", "en")
    history = data.get("history", [])
    
    # We use the RAG built-in service which uses Anthropic
    response = rag_service.get_chat_response(user_message, language, history)
    
    return response

