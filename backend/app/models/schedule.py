from sqlalchemy import Column, String, Integer
from app.models.base import BaseModel


class Course(BaseModel):
    """课程模型"""
    __tablename__ = 'courses'

    name = Column(String(100), nullable=False)
    teacher = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    color = Column(String(20), default='#3b82f6')
    semester = Column(String(20), nullable=True)
