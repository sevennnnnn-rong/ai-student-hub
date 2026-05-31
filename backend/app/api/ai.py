from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import ai_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: str = None
    history: list = None


class ParseTaskRequest(BaseModel):
    text: str


@router.post("/chat")
async def chat(request: ChatRequest):
    """AI对话"""
    response = await ai_service.chat(request.message, history=request.history)
    return {
        "code": 200,
        "message": "success",
        "data": {
            "response": response,
            "conversation_id": request.conversation_id or "default"
        }
    }


@router.post("/parse-task")
async def parse_task(request: ParseTaskRequest):
    """AI解析任务"""
    result = await ai_service.parse_task(request.text)
    return {
        "code": 200,
        "message": "success",
        "data": result
    }
