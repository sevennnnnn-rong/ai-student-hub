from app.database import SessionLocal, get_db
from sqlalchemy.orm import Session
from typing import Generator


def get_database() -> Generator[Session, None, None]:
    """获取数据库Session依赖"""
    return get_db()
