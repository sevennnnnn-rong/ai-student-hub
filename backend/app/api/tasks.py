from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    status: str = None,
    category: str = None,
    priority: int = None,
    db: Session = Depends(get_db)
):
    """获取任务列表"""
    query = db.query(Task)

    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    if priority is not None:
        query = query.filter(Task.priority == priority)

    tasks = query.order_by(Task.created_at.desc()).all()
    return tasks


@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """创建任务"""
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """获取单个任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    """更新任务"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="任务不存在")

    update_data = task.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """删除任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    db.delete(task)
    db.commit()
    return {"code": 200, "message": "任务删除成功", "data": None}
