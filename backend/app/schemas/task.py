from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class TaskCreate(BaseModel):
    """创建任务请求"""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: int = Field(default=0, ge=0, le=2)
    category: Optional[str] = None


class TaskUpdate(BaseModel):
    """更新任务请求"""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[int] = Field(default=None, ge=0, le=2)
    status: Optional[Literal['pending', 'in_progress', 'done']] = None
    category: Optional[str] = None


class TaskResponse(BaseModel):
    """任务响应"""
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    priority: int
    status: str
    category: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
