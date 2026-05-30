from sqlalchemy import Column, String, Text, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Note(BaseModel):
    """笔记模型"""
    __tablename__ = 'notes'
    __table_args__ = (
        Index('ix_notes_task_id', 'task_id'),
    )

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)

    task = relationship('Task', backref='notes')
