from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re


class CourseCreate(BaseModel):
    """创建课程请求"""
    name: str = Field(..., max_length=100)
    teacher: Optional[str] = None
    location: Optional[str] = None
    day_of_week: int = Field(ge=1, le=7)
    start_time: str
    end_time: str
    color: str = '#3b82f6'
    semester: Optional[str] = None

    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        if not re.match(r'^([01]\d|2[0-3]):[0-5]\d$', v):
            raise ValueError('时间格式必须为 HH:MM (00:00-23:59)')
        return v

    def model_post_init(self, __context):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValueError('开始时间必须早于结束时间')


class CourseUpdate(BaseModel):
    """更新课程请求"""
    name: Optional[str] = None
    teacher: Optional[str] = None
    location: Optional[str] = None
    day_of_week: Optional[int] = Field(default=None, ge=1, le=7)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    color: Optional[str] = None
    semester: Optional[str] = None

    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        if v is not None and not re.match(r'^([01]\d|2[0-3]):[0-5]\d$', v):
            raise ValueError('时间格式必须为 HH:MM (00:00-23:59)')
        return v

    def model_post_init(self, __context):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValueError('开始时间必须早于结束时间')


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
