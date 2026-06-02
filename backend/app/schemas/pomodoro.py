from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class PomodoroStart(BaseModel):
    """开始番茄钟请求"""
    task_id: Optional[int] = None
    duration_minutes: int = 25
    tags: Optional[str] = None


class PomodoroStop(BaseModel):
    """停止番茄钟请求"""
    completed: bool = True
    notes: Optional[str] = None


class PomodoroResponse(BaseModel):
    """番茄钟响应"""
    id: int
    task_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    planned_duration: int
    completed: bool
    notes: Optional[str]
    tags: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PomodoroSettingsResponse(BaseModel):
    """番茄钟设置响应"""
    work_duration: int
    short_break: int
    long_break: int
    daily_goal: int
    long_break_interval: int

    model_config = ConfigDict(from_attributes=True)


class PomodoroSettingsUpdate(BaseModel):
    """更新番茄钟设置请求"""
    work_duration: Optional[int] = Field(default=None, ge=1, le=120)
    short_break: Optional[int] = Field(default=None, ge=1, le=30)
    long_break: Optional[int] = Field(default=None, ge=1, le=60)
    daily_goal: Optional[int] = Field(default=None, ge=1, le=50)
    long_break_interval: Optional[int] = Field(default=None, ge=1, le=20)
