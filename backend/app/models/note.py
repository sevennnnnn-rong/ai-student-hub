from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Note(BaseModel):
    """笔记模型"""
    __tablename__ = 'notes'

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)

    task = relationship('Task', backref='notes')
