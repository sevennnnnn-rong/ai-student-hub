from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.agents import agent_registry
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.response import success_response

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    agent: Literal["claude", "codex", "doubao"] = "claude"


@router.get("/agents")
async def list_agents():
    """获取所有可用 Agent 列表"""
    return success_response(agent_registry.list_all())


@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """AI对话"""
    # 获取 Agent
    agent = agent_registry.get(request.agent)
    if not agent:
        raise HTTPException(status_code=400, detail=f"不支持的 Agent: {request.agent}")

    # 获取或创建对话
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
    else:
        conversation = Conversation(title=request.message[:50], agent_name=request.agent)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 加载历史消息
    history_messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation.id
    ).order_by(ConversationMessage.created_at).all()

    history = [{"role": m.role, "content": m.content} for m in history_messages]

    # 保存用户消息
    user_msg = ConversationMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.commit()

    # 调用 Agent
    response = await agent.chat(request.message, history)

    # 保存AI回复
    assistant_msg = ConversationMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=response
    )
    db.add(assistant_msg)
    db.commit()

    return success_response({
        "response": response,
        "conversation_id": conversation.id
    }, code=201)


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    """AI对话 - 流式输出"""
    agent = agent_registry.get(request.agent)
    if not agent:
        raise HTTPException(status_code=400, detail=f"不支持的 Agent: {request.agent}")

    # 获取或创建对话
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
    else:
        conversation = Conversation(title=request.message[:50], agent_name=request.agent)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 加载历史消息
    history_messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation.id
    ).order_by(ConversationMessage.created_at).all()

    history = [{"role": m.role, "content": m.content} for m in history_messages]

    # 保存用户消息
    user_msg = ConversationMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.commit()

    conversation_id = conversation.id

    async def generate():
        full_response = []
        async for chunk in agent.chat_stream(request.message, history):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"

        # 保存完整回复
        complete_response = "".join(full_response)
        assistant_msg = ConversationMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=complete_response
        )
        db.add(assistant_msg)
        db.commit()

        yield f"data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
