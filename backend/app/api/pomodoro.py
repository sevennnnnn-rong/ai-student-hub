from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from datetime import datetime, timedelta
from app.database import get_db
from app.models.pomodoro import PomodoroSession, PomodoroSettings
from app.schemas.pomodoro import PomodoroStart, PomodoroStop, PomodoroResponse, PomodoroSettingsResponse, PomodoroSettingsUpdate
from app.schemas.response import success_response

router = APIRouter()


@router.post("/start")
def start_pomodoro(data: PomodoroStart, db: Session = Depends(get_db)):
    """开始番茄钟"""
    session = PomodoroSession(
        task_id=data.task_id,
        start_time=datetime.now(),
        planned_duration=data.duration_minutes,
        tags=data.tags
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return success_response(PomodoroResponse.model_validate(session).model_dump(), code=201)


@router.post("/{session_id}/stop")
def stop_pomodoro(session_id: int, data: PomodoroStop, db: Session = Depends(get_db)):
    """停止番茄钟"""
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="番茄钟记录不存在")

    session.end_time = datetime.now()
    session.completed = data.completed
    session.notes = data.notes

    session.duration_minutes = int((session.end_time - session.start_time).total_seconds() / 60)

    db.commit()
    db.refresh(session)
    return success_response(PomodoroResponse.model_validate(session).model_dump(), code=200)


@router.get("/sessions")
def get_sessions(task_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取番茄钟记录"""
    query = db.query(PomodoroSession)
    if task_id:
        query = query.filter(PomodoroSession.task_id == task_id)
    sessions = query.order_by(PomodoroSession.created_at.desc()).offset(skip).limit(limit).all()
    return success_response([PomodoroResponse.model_validate(s).model_dump() for s in sessions])


@router.get("/stats")
def get_stats(period: str = "today", db: Session = Depends(get_db)):
    """获取统计数据"""
    now = datetime.now()

    if period == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        sessions = db.query(PomodoroSession).filter(
            PomodoroSession.created_at >= start_of_day
        ).all()
    elif period == "week":
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        sessions = db.query(PomodoroSession).filter(
            PomodoroSession.created_at >= start_of_week
        ).all()
    elif period == "month":
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        sessions = db.query(PomodoroSession).filter(
            PomodoroSession.created_at >= start_of_month
        ).all()
    else:
        sessions = db.query(PomodoroSession).all()

    completed = [s for s in sessions if s.completed]

    return success_response({
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "total_minutes": sum(s.duration_minutes or 0 for s in completed),
        "total_hours": round(sum(s.duration_minutes or 0 for s in completed) / 60, 2),
        "completion_rate": round(len(completed) / len(sessions) * 100, 1) if sessions else 0
    })


@router.get("/stats/daily")
def get_daily_stats(days: int = 7, db: Session = Depends(get_db)):
    """获取每日统计数据（用于热力图）"""
    now = datetime.now()
    start_date = now - timedelta(days=days)

    sessions = db.query(PomodoroSession).filter(
        PomodoroSession.created_at >= start_date,
        PomodoroSession.completed == True
    ).all()

    # 按日期分组
    daily_stats = {}
    for session in sessions:
        date_str = session.created_at.strftime('%Y-%m-%d')
        if date_str not in daily_stats:
            daily_stats[date_str] = {'date': date_str, 'count': 0, 'minutes': 0}
        daily_stats[date_str]['count'] += 1
        daily_stats[date_str]['minutes'] += session.duration_minutes or 0

    return success_response(list(daily_stats.values()))


@router.get("/stats/hourly")
def get_hourly_stats(db: Session = Depends(get_db)):
    """获取每小时统计数据（用于时段分布）"""
    now = datetime.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

    sessions = db.query(PomodoroSession).filter(
        PomodoroSession.created_at >= start_of_day,
        PomodoroSession.completed == True
    ).all()

    # 按小时分组
    hourly_stats = {i: 0 for i in range(24)}
    for session in sessions:
        hour = session.created_at.hour
        hourly_stats[hour] += 1

    return success_response([{'hour': h, 'count': c} for h, c in hourly_stats.items()])


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    """获取番茄钟设置"""
    settings = db.query(PomodoroSettings).filter(PomodoroSettings.user_id == 'default').first()
    if not settings:
        settings = PomodoroSettings(user_id='default')
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return success_response(PomodoroSettingsResponse.model_validate(settings).model_dump())


@router.put("/settings")
def update_settings(data: PomodoroSettingsUpdate, db: Session = Depends(get_db)):
    """更新番茄钟设置"""
    settings = db.query(PomodoroSettings).filter(PomodoroSettings.user_id == 'default').first()
    if not settings:
        settings = PomodoroSettings(user_id='default')
        db.add(settings)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return success_response(PomodoroSettingsResponse.model_validate(settings).model_dump())
