# Trae 执行任务清单

## 概述

本文档是 Trae 的执行指南，包含所有需要完成的任务。请按顺序执行，每完成一个任务打勾。

**项目目录**: `C:\Users\lenovo\projects\ai-student-hub`

---

## 阶段一：项目初始化（Day 1）

### 任务 1.1: 创建 Next.js 前端项目

**目标**: 初始化 Next.js 项目，配置 TypeScript

**步骤**:
```bash
cd C:\Users\lenovo\projects\ai-student-hub
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**配置选项**:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: `@/*`

**完成标志**: `frontend/` 目录创建成功，运行 `npm run dev` 可访问 http://localhost:3000

---

### 任务 1.2: 安装前端依赖

**目标**: 安装所有需要的前端包

**步骤**:
```bash
cd C:\Users\lenovo\projects\ai-student-hub\frontend
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install date-fns
npm install zustand
npm install @uiw/react-md-editor
```

**依赖说明**:
- `@radix-ui/*`: shadcn/ui 基础组件
- `class-variance-authority`: 组件变体管理
- `lucide-react`: 图标库
- `date-fns`: 日期处理
- `zustand`: 状态管理
- `@uiw/react-md-editor`: Markdown编辑器

**完成标志**: `package.json` 中包含所有依赖

---

### 任务 1.3: 配置 shadcn/ui

**目标**: 初始化 shadcn/ui 配置

**步骤**:
```bash
cd C:\Users\lenovo\projects\ai-student-hub\frontend
npx shadcn-ui@latest init
```

**配置选项**:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**然后添加常用组件**:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add scroll-area
```

**完成标志**: `src/components/ui/` 目录下有对应的组件文件

---

### 任务 1.4: 创建 FastAPI 后端项目

**目标**: 初始化 Python 后端项目

**步骤**:
```bash
cd C:\Users\lenovo\projects\ai-student-hub
mkdir backend
cd backend
mkdir app
mkdir app/api
mkdir app/models
mkdir app/schemas
mkdir app/services
```

**创建文件**: `backend/requirements.txt`
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
httpx==0.26.0
python-multipart==0.0.6
```

**安装依赖**:
```bash
cd C:\Users\lenovo\projects\ai-student-hub\backend
pip install -r requirements.txt
```

**完成标志**: 所有依赖安装成功，无报错

---

### 任务 1.5: 实现后端配置和数据库连接

**目标**: 创建配置管理和数据库连接模块

**创建文件**: `backend/app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """应用配置"""
    database_url: str = "sqlite:///./student_hub.db"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    app_name: str = "AI Student Hub"
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
```

**创建文件**: `backend/app/database.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """获取数据库Session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**创建文件**: `backend/.env.example`
```env
DATABASE_URL=sqlite:///./student_hub.db
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

**完成标志**: 文件创建成功，导入无报错

---

### 任务 1.6: 创建数据库模型

**目标**: 实现所有 SQLAlchemy 模型

**创建文件**: `backend/app/models/__init__.py`
```python
from app.models.task import Task
from app.models.pomodoro import PomodoroSession
from app.models.schedule import Course
from app.models.note import Note

__all__ = ['Task', 'PomodoroSession', 'Course', 'Note']
```

**创建文件**: `backend/app/models/base.py`
```python
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base

class BaseModel(Base):
    """基础模型类"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

**创建文件**: `backend/app/models/task.py`
```python
from sqlalchemy import Column, String, Text, Integer
from app.models.base import BaseModel

class Task(BaseModel):
    """任务模型"""
    __tablename__ = 'tasks'
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(30), nullable=True)
    priority = Column(Integer, default=0)
    status = Column(String(20), default='pending')
    category = Column(String(50), nullable=True)
```

**创建文件**: `backend/app/models/pomodoro.py`
```python
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class PomodoroSession(BaseModel):
    """番茄钟记录模型"""
    __tablename__ = 'pomodoro_sessions'
    
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    start_time = Column(String(30), nullable=False)
    end_time = Column(String(30), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    planned_duration = Column(Integer, default=25)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    task = relationship('Task', backref='pomodoro_sessions')
```

**创建文件**: `backend/app/models/schedule.py`
```python
from sqlalchemy import Column, String, Integer
from app.models.base import BaseModel

class Course(BaseModel):
    """课程模型"""
    __tablename__ = 'courses'
    
    name = Column(String(100), nullable=False)
    teacher = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    color = Column(String(20), default='#3b82f6')
    semester = Column(String(20), nullable=True)
```

**创建文件**: `backend/app/models/note.py`
```python
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Note(BaseModel):
    """笔记模型"""
    __tablename__ = 'notes'
    
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    
    task = relationship('Task', backref='notes')
```

**完成标志**: 所有模型文件创建成功

---

### 任务 1.7: 创建 FastAPI 应用入口

**目标**: 实现 main.py，配置路由和 CORS

**创建文件**: `backend/app/__init__.py` (空文件)

**创建文件**: `backend/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import Task, PomodoroSession, Course, Note

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

@app.get("/")
def read_root():
    """根路径"""
    return {"message": "AI Student Hub API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "ok"}
```

**完成标志**: 运行 `uvicorn app.main:app --reload --port 8000` 可访问 http://localhost:8000

---

## 阶段二：API 接口实现（Day 2）

### 任务 2.1: 创建 Pydantic Schema

**目标**: 定义请求和响应的数据结构

**创建文件**: `backend/app/schemas/__init__.py`
```python
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.pomodoro import PomodoroStart, PomodoroStop, PomodoroResponse
from app.schemas.schedule import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
```

**创建文件**: `backend/app/schemas/task.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    """创建任务请求"""
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: int = 0
    category: Optional[str] = None

class TaskUpdate(BaseModel):
    """更新任务请求"""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    category: Optional[str] = None

class TaskResponse(BaseModel):
    """任务响应"""
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[str]
    priority: int
    status: str
    category: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**创建文件**: `backend/app/schemas/pomodoro.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PomodoroStart(BaseModel):
    """开始番茄钟请求"""
    task_id: Optional[int] = None
    duration_minutes: int = 25

class PomodoroStop(BaseModel):
    """停止番茄钟请求"""
    completed: bool = True
    notes: Optional[str] = None

class PomodoroResponse(BaseModel):
    """番茄钟响应"""
    id: int
    task_id: Optional[int]
    start_time: str
    end_time: Optional[str]
    duration_minutes: Optional[int]
    planned_duration: int
    completed: bool
    notes: Optional[str]
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**创建文件**: `backend/app/schemas/schedule.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseCreate(BaseModel):
    """创建课程请求"""
    name: str
    teacher: Optional[str] = None
    location: Optional[str] = None
    day_of_week: int
    start_time: str
    end_time: str
    color: str = '#3b82f6'
    semester: Optional[str] = None

class CourseUpdate(BaseModel):
    """更新课程请求"""
    name: Optional[str] = None
    teacher: Optional[str] = None
    location: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    color: Optional[str] = None
    semester: Optional[str] = None

class CourseResponse(BaseModel):
    """课程响应"""
    id: int
    name: str
    teacher: Optional[str]
    location: Optional[str]
    day_of_week: int
    start_time: str
    end_time: str
    color: str
    semester: Optional[str]
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**创建文件**: `backend/app/schemas/note.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoteCreate(BaseModel):
    """创建笔记请求"""
    title: str
    content: Optional[str] = None
    task_id: Optional[int] = None

class NoteUpdate(BaseModel):
    """更新笔记请求"""
    title: Optional[str] = None
    content: Optional[str] = None
    task_id: Optional[int] = None

class NoteResponse(BaseModel):
    """笔记响应"""
    id: int
    title: str
    content: Optional[str]
    task_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**完成标志**: 所有 Schema 文件创建成功

---

### 任务 2.2: 实现任务 API 接口

**目标**: 实现任务的 CRUD 接口

**创建文件**: `backend/app/api/__init__.py` (空文件)

**创建文件**: `backend/app/api/deps.py`
```python
from app.database import SessionLocal, get_db
from sqlalchemy.orm import Session
from typing import Generator

def get_database() -> Generator[Session, None, None]:
    """获取数据库Session依赖"""
    return get_db()
```

**创建文件**: `backend/app/api/tasks.py`
```python
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
```

**更新文件**: `backend/app/main.py` 添加路由
```python
from app.api import tasks

app.include_router(tasks.router, prefix="/api/tasks", tags=["任务管理"])
```

**完成标志**: 可通过 http://localhost:8000/docs 测试任务接口

---

### 任务 2.3: 实现番茄钟 API 接口

**创建文件**: `backend/app/api/pomodoro.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
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
    
    # 计算时长
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
    # 简化实现，返回基本统计
    sessions = db.query(PomodoroSession).all()
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
```

**更新文件**: `backend/app/main.py` 添加路由
```python
from app.api import pomodoro

app.include_router(pomodoro.router, prefix="/api/pomodoro", tags=["番茄钟"])
```

---

### 任务 2.4: 实现课程表 API 接口

**创建文件**: `backend/app/api/schedule.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.schedule import Course
from app.schemas.schedule import CourseCreate, CourseUpdate, CourseResponse

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
def get_courses(semester: str = None, db: Session = Depends(get_db)):
    """获取课程列表"""
    query = db.query(Course)
    if semester:
        query = query.filter(Course.semester == semester)
    return query.order_by(Course.day_of_week, Course.start_time).all()

@router.post("/", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """创建课程"""
    db_course = Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course: CourseUpdate, db: Session = Depends(get_db)):
    """更新课程"""
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    update_data = course.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """删除课程"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    db.delete(course)
    db.commit()
    return {"code": 200, "message": "课程删除成功", "data": None}
```

**更新文件**: `backend/app/main.py` 添加路由
```python
from app.api import schedule

app.include_router(schedule.router, prefix="/api/schedule", tags=["课程表"])
```

---

### 任务 2.5: 实现笔记 API 接口

**创建文件**: `backend/app/api/notes.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()

@router.get("/", response_model=List[NoteResponse])
def get_notes(task_id: int = None, keyword: str = None, db: Session = Depends(get_db)):
    """获取笔记列表"""
    query = db.query(Note)
    if task_id:
        query = query.filter(Note.task_id == task_id)
    if keyword:
        query = query.filter(Note.title.contains(keyword) | Note.content.contains(keyword))
    return query.order_by(Note.created_at.desc()).all()

@router.post("/", response_model=NoteResponse)
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    """创建笔记"""
    db_note = Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """获取单个笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note: NoteUpdate, db: Session = Depends(get_db)):
    """更新笔记"""
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    
    update_data = note.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)
    
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """删除笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    
    db.delete(note)
    db.commit()
    return {"code": 200, "message": "笔记删除成功", "data": None}
```

**更新文件**: `backend/app/main.py` 添加路由
```python
from app.api import notes

app.include_router(notes.router, prefix="/api/notes", tags=["笔记"])
```

---

## 阶段三：前端页面开发（Day 3-5）

### 任务 3.1: 创建全局布局

**目标**: 实现带侧边栏的 Dashboard 布局

**创建文件**: `src/app/(dashboard)/layout.tsx`
```tsx
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

**创建文件**: `src/components/sidebar.tsx`
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Timer, Calendar, FileText, MessageSquare } from 'lucide-react'

const navItems = [
  { href: '/tasks', label: '任务管理', icon: CheckSquare },
  { href: '/pomodoro', label: '番茄钟', icon: Timer },
  { href: '/schedule', label: '课程表', icon: Calendar },
  { href: '/notes', label: '笔记', icon: FileText },
  { href: '/ai-chat', label: 'AI助手', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="w-64 bg-gray-900 text-white p-4">
      <h1 className="text-xl font-bold mb-6">AI Student Hub</h1>
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

**完成标志**: 侧边栏显示正常，点击可导航

---

### 任务 3.2: 创建 API 客户端

**目标**: 封装后端 API 调用

**创建文件**: `src/lib/api.ts`
```typescript
const API_BASE = 'http://localhost:8000/api'

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

// 任务相关
export const taskApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/tasks${query}`)
  },
  create: (data: any) => fetchApi('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/tasks/${id}`, { method: 'DELETE' }),
}

// 番茄钟相关
export const pomodoroApi = {
  start: (data: any) => fetchApi('/pomodoro/start', { method: 'POST', body: JSON.stringify(data) }),
  stop: (id: number, data: any) => fetchApi(`/pomodoro/${id}/stop`, { method: 'POST', body: JSON.stringify(data) }),
  getSessions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/pomodoro/sessions${query}`)
  },
  getStats: (period: string = 'today') => fetchApi(`/pomodoro/stats?period=${period}`),
}

// 课程表相关
export const scheduleApi = {
  getAll: (semester?: string) => {
    const query = semester ? `?semester=${semester}` : ''
    return fetchApi(`/schedule${query}`)
  },
  create: (data: any) => fetchApi('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/schedule/${id}`, { method: 'DELETE' }),
}

// 笔记相关
export const noteApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/notes${query}`)
  },
  create: (data: any) => fetchApi('/notes', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => fetchApi(`/notes/${id}`),
  update: (id: number, data: any) => fetchApi(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/notes/${id}`, { method: 'DELETE' }),
}

// AI相关
export const aiApi = {
  chat: (message: string) => fetchApi('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  parseTask: (text: string) => fetchApi('/ai/parse-task', { method: 'POST', body: JSON.stringify({ text }) }),
}
```

**完成标志**: API 客户端封装完成

---

### 任务 3.3: 实现任务管理页面

**目标**: 创建任务列表和任务创建功能

**创建文件**: `src/app/(dashboard)/tasks/page.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { taskApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: number
  status: string
  category: string | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // 加载任务
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await taskApi.getAll()
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 创建任务
  const handleCreate = async () => {
    if (!newTitle.trim()) return
    
    try {
      const task = await taskApi.create({ title: newTitle })
      setTasks([task, ...tasks])
      setNewTitle('')
    } catch (error) {
      console.error('创建任务失败:', error)
    }
  }

  // 切换任务状态
  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      const updated = await taskApi.update(task.id, { status: newStatus })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  }

  // 删除任务
  const handleDelete = async (id: number) => {
    try {
      await taskApi.delete(id)
      setTasks(tasks.filter(t => t.id !== id))
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">任务管理</h1>
      
      {/* 创建任务 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="输入任务标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate}>
              <Plus className="mr-2" size={16} />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 任务列表 */}
      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleStatus(task)}>
                  {task.status === 'done' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <Circle className="text-gray-400" size={20} />
                  )}
                </button>
                <div>
                  <p className={task.status === 'done' ? 'line-through text-gray-400' : ''}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="text-sm text-gray-500">
                      截止: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>
                <Trash2 size={16} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**完成标志**: 任务页面可正常显示，可创建、完成、删除任务

---

### 任务 3.4: 实现番茄钟页面

**目标**: 创建番茄钟计时器

**创建文件**: `src/app/(dashboard)/pomodoro/page.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { pomodoroApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25分钟
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)

  // 计时器逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleStop(true)
    }
    
    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  // 加载统计
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await pomodoroApi.getStats('today')
      setStats(data.data)
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  // 开始番茄钟
  const handleStart = async () => {
    try {
      const session = await pomodoroApi.start({ duration_minutes: 25 })
      setSessionId(session.id)
      setIsRunning(true)
    } catch (error) {
      console.error('开始番茄钟失败:', error)
    }
  }

  // 停止番茄钟
  const handleStop = async (completed: boolean) => {
    if (!sessionId) return
    
    try {
      await pomodoroApi.stop(sessionId, { completed })
      setIsRunning(false)
      setSessionId(null)
      setTimeLeft(25 * 60)
      loadStats()
    } catch (error) {
      console.error('停止番茄钟失败:', error)
    }
  }

  // 重置计时器
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(25 * 60)
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">番茄钟</h1>
      
      {/* 计时器 */}
      <Card className="mb-6">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl font-mono mb-6">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button onClick={handleStart} size="lg">
                <Play className="mr-2" size={20} />
                开始
              </Button>
            ) : (
              <Button onClick={() => handleStop(false)} size="lg" variant="destructive">
                <Pause className="mr-2" size={20} />
                停止
              </Button>
            )}
            <Button onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="mr-2" size={20} />
              重置
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 今日统计 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>今日统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">完成番茄数</p>
                <p className="text-2xl font-bold">{stats.completed_sessions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">专注时长</p>
                <p className="text-2xl font-bold">{stats.total_hours}小时</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

**完成标志**: 番茄钟可正常计时，统计正常显示

---

### 任务 3.5: 实现课程表页面

**目标**: 创建周视图课程表

**创建文件**: `src/app/(dashboard)/schedule/page.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { scheduleApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

interface Course {
  id: number
  name: string
  teacher: string | null
  location: string | null
  day_of_week: number
  start_time: string
  end_time: string
  color: string
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 - 19:00

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: '',
    teacher: '',
    location: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:40',
    color: '#3b82f6'
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await scheduleApi.getAll()
      setCourses(data)
    } catch (error) {
      console.error('加载课程失败:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const course = await scheduleApi.create(newCourse)
      setCourses([...courses, course])
      setShowForm(false)
      setNewCourse({
        name: '',
        teacher: '',
        location: '',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:40',
        color: '#3b82f6'
      })
    } catch (error) {
      console.error('创建课程失败:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await scheduleApi.delete(id)
      setCourses(courses.filter(c => c.id !== id))
    } catch (error) {
      console.error('删除课程失败:', error)
    }
  }

  // 获取某个时间段的课程
  const getCoursesAt = (day: number, hour: number) => {
    return courses.filter(c => {
      const startHour = parseInt(c.start_time.split(':')[0])
      const endHour = parseInt(c.end_time.split(':')[0])
      return c.day_of_week === day && hour >= startHour && hour < endHour
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">课程表</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2" size={16} />
          添加课程
        </Button>
      </div>
      
      {/* 添加课程表单 */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="课程名称"
                value={newCourse.name}
                onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
              />
              <Input
                placeholder="教师"
                value={newCourse.teacher}
                onChange={(e) => setNewCourse({...newCourse, teacher: e.target.value})}
              />
              <Input
                placeholder="地点"
                value={newCourse.location}
                onChange={(e) => setNewCourse({...newCourse, location: e.target.value})}
              />
              <select
                className="border rounded p-2"
                value={newCourse.day_of_week}
                onChange={(e) => setNewCourse({...newCourse, day_of_week: parseInt(e.target.value)})}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleCreate}>保存</Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 课程表网格 */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-[800px]">
          {/* 表头 */}
          <div className="p-2 font-bold">时间</div>
          {DAYS.map(day => (
            <div key={day} className="p-2 font-bold text-center">{day}</div>
          ))}
          
          {/* 时间网格 */}
          {HOURS.map(hour => (
            <>
              <div key={`time-${hour}`} className="p-2 text-sm text-gray-500">
                {hour}:00
              </div>
              {DAYS.map((_, dayIndex) => {
                const coursesAt = getCoursesAt(dayIndex + 1, hour)
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="border rounded p-1 min-h-[60px]"
                  >
                    {coursesAt.map(course => (
                      <div
                        key={course.id}
                        className="text-xs p-1 rounded text-white mb-1"
                        style={{ backgroundColor: course.color }}
                      >
                        <p className="font-bold">{course.name}</p>
                        <p>{course.location}</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**完成标志**: 课程表正常显示，可添加课程

---

### 任务 3.6: 实现 AI 对话页面

**目标**: 创建 AI 聊天界面

**创建文件**: `src/app/(dashboard)/ai-chat/page.tsx`
```tsx
'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    
    try {
      const response = await aiApi.chat(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }])
    } catch (error) {
      console.error('AI对话失败:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，发生了错误，请稍后再试。' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">AI 助手</h1>
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <Bot size={48} className="mx-auto mb-4" />
            <p>你好！我是你的 AI 助手</p>
            <p className="text-sm">可以帮你创建任务、管理日程、回答问题</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 输入框 */}
      <div className="flex gap-2">
        <Input
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading}>
          <Send size={16} />
        </Button>
      </div>
    </div>
  )
}
```

**完成标志**: AI对话页面正常显示，可发送消息

---

## 阶段四：AI 功能实现（Day 6）

### 任务 4.1: 实现 AI 服务

**目标**: 封装 DeepSeek API 调用

**创建文件**: `backend/app/services/__init__.py` (空文件)

**创建文件**: `backend/app/services/ai_service.py`
```python
import httpx
from app.config import settings

class AIService:
    """AI服务封装"""
    
    def __init__(self):
        self.api_key = settings.deepseek_api_key
        self.base_url = settings.deepseek_base_url
    
    async def chat(self, message: str, history: list = None) -> str:
        """发送对话请求"""
        if not self.api_key:
            return "请先配置 DeepSeek API Key"
        
        messages = history or []
        messages.append({"role": "user", "content": message})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "你是一个大学生效率助手，可以帮助用户管理任务、课程、笔记。请用中文回复。"},
                        *messages
                    ],
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"AI服务错误: {response.status_code}"
    
    async def parse_task(self, text: str) -> dict:
        """解析自然语言为任务"""
        prompt = f"""请从以下文本中提取任务信息，返回JSON格式：
        
文本: {text}

返回格式:
{{
  "tasks": [
    {{
      "title": "任务标题",
      "due_date": "截止日期(ISO格式，如果没有则为null)",
      "category": "分类(作业/考试/项目/其他)",
      "priority": 优先级(0=普通, 1=重要, 2=紧急)
    }}
  ]
}}

只返回JSON，不要其他文字。"""
        
        response = await self.chat(prompt)
        
        # 尝试解析JSON
        import json
        try:
            # 提取JSON部分
            json_str = response
            if "```" in response:
                json_str = response.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            
            return json.loads(json_str.strip())
        except:
            return {"tasks": [{"title": text, "due_date": None, "category": "其他", "priority": 0}]}

# 创建全局实例
ai_service = AIService()
```

**完成标志**: AI服务封装完成

---

### 任务 4.2: 实现 AI API 接口

**创建文件**: `backend/app/api/ai.py`
```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import ai_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = None

class ParseTaskRequest(BaseModel):
    text: str

@router.post("/chat")
async def chat(request: ChatRequest):
    """AI对话"""
    response = await ai_service.chat(request.message)
    return {
        "code": 200,
        "message": "success",
        "data": {
            "response": response,
            "conversation_id": request.conversation_id or "default"
        }
    }

@router.post("/parse-task")
async def parse_task(request: ParseTaskRequest):
    """AI解析任务"""
    result = await ai_service.parse_task(request.text)
    return {
        "code": 200,
        "message": "success",
        "data": result
    }
```

**更新文件**: `backend/app/main.py` 添加路由
```python
from app.api import ai

app.include_router(ai.router, prefix="/api/ai", tags=["AI对话"])
```

**完成标志**: AI接口可正常调用

---

## 阶段五：完善优化（Day 7）

### 任务 5.1: 添加深色模式支持

**目标**: 实现主题切换功能

**创建文件**: `src/lib/theme.ts`
```typescript
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({
  theme: 'light',
  toggleTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('dark', saved === 'dark')
    }
  }, [])
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark')
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

**更新文件**: `src/app/layout.tsx` 添加 ThemeProvider

---

### 任务 5.2: 错误处理优化

**目标**: 统一错误处理和用户提示

**创建文件**: `src/lib/error.ts`
```typescript
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '发生未知错误'
}
```

---

### 任务 5.3: 创建 .gitignore

**目标**: 忽略不需要版本控制的文件

**创建文件**: `.gitignore`
```
# 依赖
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# 环境变量
.env
.env.local

# 数据库
*.db
*.sqlite

# 构建产物
.next/
out/
build/
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db
```

---

## 执行检查清单

### 阶段一完成检查
- [ ] Next.js 项目创建成功
- [ ] 所有依赖安装成功
- [ ] shadcn/ui 配置完成
- [ ] FastAPI 项目创建成功
- [ ] 数据库模型创建成功
- [ ] 后端可正常启动

### 阶段二完成检查
- [ ] 任务 API 接口可用
- [ ] 番茄钟 API 接口可用
- [ ] 课程表 API 接口可用
- [ ] 笔记 API 接口可用

### 阶段三完成检查
- [ ] 侧边栏导航正常
- [ ] 任务页面功能正常
- [ ] 番茄钟页面功能正常
- [ ] 课程表页面功能正常
- [ ] AI 对话页面功能正常

### 阶段四完成检查
- [ ] AI 服务封装完成
- [ ] AI 对话功能正常
- [ ] 任务解析功能正常

### 阶段五完成检查
- [ ] 深色模式可用
- [ ] 错误处理完善
- [ ] .gitignore 创建完成

---

## 注意事项

1. **每完成一个任务，更新此文档打勾**
2. **遇到问题及时记录，联系 Claude 解决**
3. **代码必须包含中文注释**
4. **API 返回格式必须统一**
5. **前端必须支持深色模式**
