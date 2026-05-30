from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.task import Task
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_task_reminders():
    """检查即将到期的任务并生成提醒"""
    db = SessionLocal()
    try:
        now = datetime.now()
        reminder_threshold = now + timedelta(minutes=30)

        # 查找即将到期的待完成任务
        upcoming_tasks = db.query(Task).filter(
            Task.status == 'pending',
            Task.due_date.isnot(None),
            Task.due_date <= reminder_threshold,
            Task.due_date >= now,
        ).all()

        for task in upcoming_tasks:
            logger.info(f"[提醒] 任务 '{task.title}' 将在 {task.due_date} 到期")
            # TODO: 当 Tauri 集成后，这里发送系统通知
            # TODO: 当前端通知面板就绪后，存储到通知表

        # 查找已过期的任务
        overdue_tasks = db.query(Task).filter(
            Task.status == 'pending',
            Task.due_date.isnot(None),
            Task.due_date < now,
        ).all()

        for task in overdue_tasks:
            logger.warning(f"[过期] 任务 '{task.title}' 已过期 (截止: {task.due_date})")

    finally:
        db.close()


def start_scheduler():
    """启动调度器"""
    scheduler.add_job(
        check_task_reminders,
        trigger=IntervalTrigger(minutes=5),
        id='task_reminder_check',
        replace_existing=True,
    )
    scheduler.start()
    logger.info("通知调度器已启动")


def stop_scheduler():
    """停止调度器"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("通知调度器已停止")
