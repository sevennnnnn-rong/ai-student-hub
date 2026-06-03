from sqlalchemy import Column, Integer, String, Text, DateTime
from app.models.base import BaseModel


class UserMusicSettings(BaseModel):
    """用户音乐设置模型 - 存储网易云音乐登录信息"""
    __tablename__ = 'user_music_settings'

    user_id = Column(String(50), default='default', unique=True, index=True)
    netease_cookie = Column(Text, nullable=True)
    netease_uid = Column(Integer, nullable=True)
    netease_nickname = Column(String(200), nullable=True)
    netease_avatar = Column(Text, nullable=True)
    login_at = Column(DateTime, nullable=True)
