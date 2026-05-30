from sqlalchemy import Column, String, Text, Integer, DateTime, Index
from app.models.base import BaseModel


class Task(BaseModel):
    """任务模型"""
    __tablename__ = 'tasks'
    __table_args__ = (
        Index('ix_tasks_status', 'status'),
        Index('ix_tasks_category', 'category'),
        Index('ix_tasks_due_date', 'due_date'),
        Index('ix_tasks_priority', 'priority'),
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(Integer, default=0)
    status = Column(String(20), default='pending')
    category = Column(String(50), nullable=True)
