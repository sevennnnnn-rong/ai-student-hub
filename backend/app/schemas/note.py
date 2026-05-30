from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NoteCreate(BaseModel):
    """创建笔记请求"""
    title: str = Field(..., max_length=200)
    content: Optional[str] = None
    task_id: Optional[int] = None


class NoteUpdate(BaseModel):
    """更新笔记请求"""
    title: Optional[str] = None
    content: Optional[str] = None
    task_id: Optional[int] = None


class NoteResponse(BaseModel):
    """笔记响应"""
    id: int
    title: str
    content: Optional[str]
    task_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
