from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel


class Task(BaseModel):
    """任务模型"""
    __tablename__ = 'tasks'

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(30), nullable=True)
    priority = Column(Integer, default=0)
    status = Column(String(20), default='pending')
    category = Column(String(50), nullable=True)
