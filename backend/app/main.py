from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import Task, PomodoroSession, Course, Note
from app.api import tasks, pomodoro, schedule, notes, ai

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Student Hub",
    description="AI驱动的大学生效率助手",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(tasks.router, prefix="/api/tasks", tags=["任务管理"])
app.include_router(pomodoro.router, prefix="/api/pomodoro", tags=["番茄钟"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["课程表"])
app.include_router(notes.router, prefix="/api/notes", tags=["笔记"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI对话"])


@app.get("/")
def read_root():
    """根路径"""
    return {"message": "AI Student Hub API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "ok"}
