from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models.pomodoro import PomodoroSession
from app.schemas.pomodoro import PomodoroStart, PomodoroStop, PomodoroResponse

router = APIRouter()


@router.post("/start", response_model=PomodoroResponse)
def start_pomodoro(data: PomodoroStart, db: Session = Depends(get_db)):
    """开始番茄钟"""
    session = PomodoroSession(
        task_id=data.task_id,
        start_time=datetime.now().isoformat(),
        planned_duration=data.duration_minutes
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/stop", response_model=PomodoroResponse)
def stop_pomodoro(session_id: int, data: PomodoroStop, db: Session = Depends(get_db)):
    """停止番茄钟"""
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="番茄钟记录不存在")

    session.end_time = datetime.now().isoformat()
    session.completed = data.completed
    session.notes = data.notes

    start = datetime.fromisoformat(session.start_time)
    end = datetime.fromisoformat(session.end_time)
    session.duration_minutes = int((end - start).total_seconds() / 60)

    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[PomodoroResponse])
def get_sessions(task_id: int = None, db: Session = Depends(get_db)):
    """获取番茄钟记录"""
    query = db.query(PomodoroSession)
    if task_id:
        query = query.filter(PomodoroSession.task_id == task_id)
    return query.order_by(PomodoroSession.created_at.desc()).all()


@router.get("/stats")
def get_stats(period: str = "today", db: Session = Depends(get_db)):
    """获取统计数据"""
    query = db.query(PomodoroSession)
    if period == "today":
        today_start = datetime.combine(date.today(), datetime.min.time()).isoformat()
        query = query.filter(PomodoroSession.created_at >= today_start)
    sessions = query.all()
    completed = [s for s in sessions if s.completed]

    return {
        "code": 200,
        "message": "success",
        "data": {
            "total_sessions": len(sessions),
            "completed_sessions": len(completed),
            "total_minutes": sum(s.duration_minutes or 0 for s in completed),
            "total_hours": round(sum(s.duration_minutes or 0 for s in completed) / 60, 2),
            "completion_rate": round(len(completed) / len(sessions) * 100, 1) if sessions else 0
        }
    }
