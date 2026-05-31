from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PomodoroSession(BaseModel):
    """番茄钟记录模型"""
    __tablename__ = 'pomodoro_sessions'

    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    start_time = Column(String(30), nullable=False)
    end_time = Column(String(30), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    planned_duration = Column(Integer, default=25)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    task = relationship('Task', backref='pomodoro_sessions')
