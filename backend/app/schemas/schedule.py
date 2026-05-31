from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourseCreate(BaseModel):
    """创建课程请求"""
    name: str
    teacher: Optional[str] = None
    location: Optional[str] = None
    day_of_week: int
    start_time: str
    end_time: str
    color: str = '#3b82f6'
    semester: Optional[str] = None


class CourseUpdate(BaseModel):
    """更新课程请求"""
    name: Optional[str] = None
    teacher: Optional[str] = None
    location: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    color: Optional[str] = None
    semester: Optional[str] = None


class CourseResponse(BaseModel):
    """课程响应"""
    id: int
    name: str
    teacher: Optional[str]
    location: Optional[str]
    day_of_week: int
    start_time: str
    end_time: str
    color: str
    semester: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
