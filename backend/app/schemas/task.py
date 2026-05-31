from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    """创建任务请求"""
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: int = 0
    category: Optional[str] = None


class TaskUpdate(BaseModel):
    """更新任务请求"""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    category: Optional[str] = None


class TaskResponse(BaseModel):
    """任务响应"""
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[str]
    priority: int
    status: str
    category: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
