from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PomodoroSession(BaseModel):
    """番茄钟记录模型"""
    __tablename__ = 'pomodoro_sessions'
    __table_args__ = (
        Index('ix_pomodoro_task_id', 'task_id'),
        Index('ix_pomodoro_completed', 'completed'),
    )

    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    planned_duration = Column(Integer, default=25)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    tags = Column(String(200), nullable=True)  # 标签，逗号分隔

    task = relationship('Task', backref='pomodoro_sessions')


class PomodoroSettings(BaseModel):
    """番茄钟设置模型"""
    __tablename__ = 'pomodoro_settings'

    user_id = Column(String(50), default='default', unique=True)
    work_duration = Column(Integer, default=25)  # 工作时长（分钟）
    short_break = Column(Integer, default=5)  # 短休息时长
    long_break = Column(Integer, default=15)  # 长休息时长
    daily_goal = Column(Integer, default=8)  # 每日目标番茄数
    long_break_interval = Column(Integer, default=4)  # 每 N 个番茄后长休息
