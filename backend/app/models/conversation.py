from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Conversation(BaseModel):
    """对话模型"""
    __tablename__ = 'conversations'

    title = Column(String(200), default='新对话')
    agent_name = Column(String(50), default='deepseek')  # 使用的 Agent

    messages = relationship('ConversationMessage', backref='conversation', order_by='ConversationMessage.created_at')


class ConversationMessage(BaseModel):
    """对话消息模型"""
    __tablename__ = 'conversation_messages'

    conversation_id = Column(Integer, ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)

    __table_args__ = (
        Index('ix_conv_messages_conv_id', 'conversation_id'),
    )
