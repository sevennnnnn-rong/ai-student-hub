from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.task import Task
from app.schemas.response import success_response

router = APIRouter()


@router.get("/upcoming")
def get_upcoming_reminders(db: Session = Depends(get_db)):
    """获取即将到期的任务提醒"""
    now = datetime.now()
    threshold = now + timedelta(minutes=30)

    tasks = db.query(Task).filter(
        Task.status == 'pending',
        Task.due_date.isnot(None),
        Task.due_date <= threshold,
        Task.due_date >= now,
    ).all()

    return success_response([
        {
            "id": t.id,
            "title": t.title,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "priority": t.priority,
        }
        for t in tasks
    ])


@router.get("/overdue")
def get_overdue_tasks(db: Session = Depends(get_db)):
    """获取已过期的任务"""
    now = datetime.now()

    tasks = db.query(Task).filter(
        Task.status == 'pending',
        Task.due_date.isnot(None),
        Task.due_date < now,
    ).all()

    return success_response([
        {
            "id": t.id,
            "title": t.title,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "priority": t.priority,
        }
        for t in tasks
    ])
