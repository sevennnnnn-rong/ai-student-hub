from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PomodoroStart(BaseModel):
    """开始番茄钟请求"""
    task_id: Optional[int] = None
    duration_minutes: int = 25


class PomodoroStop(BaseModel):
    """停止番茄钟请求"""
    completed: bool = True
    notes: Optional[str] = None


class PomodoroResponse(BaseModel):
    """番茄钟响应"""
    id: int
    task_id: Optional[int]
    start_time: str
    end_time: Optional[str]
    duration_minutes: Optional[int]
    planned_duration: int
    completed: bool
    notes: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
