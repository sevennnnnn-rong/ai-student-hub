from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.response import success_response

router = APIRouter()


class CreateConversationRequest(BaseModel):
    title: Optional[str] = '新对话'


@router.get("")
def get_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    return success_response([{
        "id": c.id,
        "title": c.title,
        "created_at": str(c.created_at),
        "updated_at": str(c.updated_at),
        "message_count": len(c.messages),
    } for c in conversations])


@router.post("")
def create_conversation(request: CreateConversationRequest, db: Session = Depends(get_db)):
    conversation = Conversation(title=request.title)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return success_response({
        "id": conversation.id,
        "title": conversation.title,
        "created_at": str(conversation.created_at),
    }, code=201)


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(ConversationMessage.created_at).all()
    return success_response([{
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "created_at": str(m.created_at),
    } for m in messages])


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    db.delete(conversation)
    db.commit()
    return success_response(None, message="对话已删除", code=204)
