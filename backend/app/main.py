import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.database import engine, Base
from app.models import Task, PomodoroSession, Course, Note, Conversation, ConversationMessage
from app.api import tasks, pomodoro, schedule, notes, ai, conversations, notifications, music
from app.services.notification_service import start_scheduler, stop_scheduler
from app.services.agents import agent_registry
from app.services.agents.claude_agent import ClaudeAgent
from app.services.agents.codex_agent import CodexAgent
from app.services.agents.doubao_agent import DoubaoAgent
from app.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="气象台Hub",
    description="AI驱动的大学生效率助手",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": "服务器内部错误", "data": None}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "message": str(exc.detail), "data": None}
    )


# 注册所有 Agent
agent_registry.register(ClaudeAgent())
agent_registry.register(CodexAgent())
agent_registry.register(DoubaoAgent())


# 注册路由
app.include_router(tasks.router, prefix="/api/tasks", tags=["任务管理"])
app.include_router(pomodoro.router, prefix="/api/pomodoro", tags=["番茄钟"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["课程表"])
app.include_router(notes.router, prefix="/api/notes", tags=["笔记"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI对话"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["对话管理"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["通知"])
app.include_router(music.router, prefix="/api/music", tags=["音乐"])


@app.get("/")
def read_root():
    """根路径"""
    return {"message": "气象台Hub API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """健康检查"""
    db_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    return {"status": "ok", "db": db_status}
