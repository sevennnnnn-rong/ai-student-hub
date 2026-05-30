# 架构设计文档

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 前端 (Port 3000)                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ 任务管理 │ │ 番茄钟  │ │ 课程表  │ │  笔记   │ │ AI对话 ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│
│       └───────────┴───────────┴───────────┴───────────┘     │
│                           │ API调用                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP (CORS)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI 后端 (Port 8000)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    API 路由层                         │   │
│  │  /tasks  /pomodoro  /schedule  /notes  /ai           │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                    服务层                             │   │
│  │  TaskService  PomodoroService  AIService              │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │                    数据层                             │   │
│  │              SQLAlchemy ORM                           │   │
│  └──────────────────────────┬───────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite 数据库                             │
│  tasks表  pomodoro_sessions表  courses表  notes表            │
└─────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DeepSeek API                              │
│              (AI对话、任务解析、文档总结)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 前端架构

### 页面路由结构

```
app/
├── layout.tsx                 # 根布局（包含全局状态Provider）
├── page.tsx                   # 首页（重定向到/dashboard）
├── (auth)/                    # 认证相关（暂不需要，个人项目）
│   └── login/page.tsx
├── (dashboard)/               # 主面板布局（带侧边栏）
│   ├── layout.tsx             # Dashboard布局（侧边栏+内容区）
│   ├── page.tsx               # 默认页面（重定向到/tasks）
│   ├── tasks/
│   │   └── page.tsx           # 任务管理页
│   ├── pomodoro/
│   │   └── page.tsx           # 番茄钟页
│   ├── schedule/
│   │   └── page.tsx           # 课程表页
│   ├── notes/
│   │   ├── page.tsx           # 笔记列表页
│   │   └── [id]/page.tsx      # 笔记详情/编辑页
│   └── ai-chat/
│       └── page.tsx           # AI对话页
└── api/                       # API路由（可选，用于BFF）
```

### 组件架构

```
components/
├── ui/                        # shadcn/ui基础组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── toast.tsx
│   └── ...
├── layout/                    # 布局组件
│   ├── sidebar.tsx            # 侧边栏导航
│   ├── header.tsx             # 顶部栏
│   └── mobile-nav.tsx         # 移动端导航
├── task/                      # 任务相关组件
│   ├── task-card.tsx          # 任务卡片
│   ├── task-form.tsx          # 任务创建/编辑表单
│   ├── task-list.tsx          # 任务列表
│   └── task-filter.tsx        # 任务筛选器
├── pomodoro/                  # 番茄钟相关组件
│   ├── pomodoro-timer.tsx     # 计时器
│   ├── pomodoro-controls.tsx  # 控制按钮
│   └── pomodoro-stats.tsx     # 统计展示
├── schedule/                  # 课程表相关组件
│   ├── schedule-grid.tsx      # 周视图网格
│   ├── course-card.tsx        # 课程卡片
│   └── course-form.tsx        # 课程添加表单
├── notes/                     # 笔记相关组件
│   ├── note-editor.tsx        # Markdown编辑器
│   ├── note-list.tsx          # 笔记列表
│   └── note-preview.tsx       # 笔记预览
└── ai/                        # AI相关组件
    ├── chat-bubble.tsx        # 对话气泡
    ├── chat-input.tsx         # 输入框
    └── chat-history.tsx       # 历史记录
```

### 状态管理

使用 React Context + useReducer 实现全局状态：

```typescript
// lib/store.tsx
interface AppState {
  tasks: Task[];
  currentPomodoro: PomodoroSession | null;
  courses: Course[];
  notes: Note[];
  chatHistory: ChatMessage[];
  theme: 'light' | 'dark';
}

// 每个模块有独立的Context
// - TaskContext: 任务状态
// - PomodoroContext: 番茄钟状态
// - ScheduleContext: 课程表状态
// - ThemeContext: 主题状态
```

---

## 后端架构

### 目录结构详解

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI应用入口
│   ├── config.py              # 配置管理（环境变量）
│   ├── database.py            # 数据库连接和Session管理
│   │
│   ├── api/                   # API路由层
│   │   ├── __init__.py
│   │   ├── deps.py            # 依赖注入（数据库Session等）
│   │   ├── tasks.py           # 任务相关接口
│   │   ├── pomodoro.py        # 番茄钟相关接口
│   │   ├── schedule.py        # 课程表相关接口
│   │   ├── notes.py           # 笔记相关接口
│   │   └── ai.py              # AI相关接口
│   │
│   ├── models/                # SQLAlchemy数据库模型
│   │   ├── __init__.py
│   │   ├── base.py            # 基础模型类
│   │   ├── task.py            # 任务模型
│   │   ├── pomodoro.py        # 番茄钟记录模型
│   │   ├── schedule.py        # 课程模型
│   │   └── note.py            # 笔记模型
│   │
│   ├── schemas/               # Pydantic数据模型（请求/响应）
│   │   ├── __init__.py
│   │   ├── task.py            # 任务相关Schema
│   │   ├── pomodoro.py        # 番茄钟相关Schema
│   │   ├── schedule.py        # 课程表相关Schema
│   │   ├── note.py            # 笔记相关Schema
│   │   └── ai.py              # AI相关Schema
│   │
│   └── services/              # 业务逻辑层
│       ├── __init__.py
│       ├── ai_service.py      # DeepSeek API调用封装
│       └── task_parser.py     # AI任务解析逻辑
│
├── requirements.txt           # Python依赖
├── .env.example               # 环境变量模板
└── alembic/                   # 数据库迁移（可选）
```

### 核心模块说明

#### main.py - 应用入口
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tasks, pomodoro, schedule, notes, ai
from app.database import engine, Base

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
    allow_origins=["http://localhost:3000"],  # 前端地址
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
```

#### config.py - 配置管理
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 数据库
    database_url: str = "sqlite:///./student_hub.db"
    
    # DeepSeek API
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    
    # 应用配置
    app_name: str = "AI Student Hub"
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
```

#### database.py - 数据库连接
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # SQLite需要
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 依赖注入：获取数据库Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 数据流示例

### 创建任务的数据流

```
1. 用户在前端填写任务表单
   ↓
2. 前端调用 POST /api/tasks
   请求体: { "title": "完成数学作业", "due_date": "2024-01-15", "category": "作业" }
   ↓
3. FastAPI接收请求，Pydantic验证数据
   ↓
4. 路由层调用对应的处理函数
   ↓
5. 创建Task数据库记录
   ↓
6. 返回响应: { "code": 200, "message": "success", "data": { "id": 1, ... } }
   ↓
7. 前端更新任务列表状态
```

### AI对话的数据流

```
1. 用户在AI对话页输入消息
   ↓
2. 前端调用 POST /api/ai/chat
   请求体: { "message": "帮我创建一个明天交的数学作业任务" }
   ↓
3. FastAPI接收请求
   ↓
4. ai_service.py调用DeepSeek API
   ↓
5. DeepSeek返回响应（可能包含任务创建指令）
   ↓
6. 如果是任务创建指令，调用task_parser.py解析
   ↓
7. 自动创建任务记录
   ↓
8. 返回AI响应给前端
```

---

## 安全考虑

### 当前阶段（个人使用）
- 无需用户认证
- 无需数据加密
- 本地SQLite存储

### 后续扩展（如果需要多用户）
- 添加JWT认证
- 实现用户表
- 数据库迁移到PostgreSQL
- 添加数据加密

---

## 性能优化

### 前端
- 使用React.memo减少不必要的重渲染
- 使用useMemo缓存计算结果
- 图片懒加载
- 代码分割（Next.js自动处理）

### 后端
- 数据库查询优化（添加索引）
- 使用异步操作（FastAPI原生支持）
- 缓存常用数据（可选，使用Redis）

---

## 错误处理

### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "参数错误：标题不能为空",
  "data": null
}
```

### 常见错误码
- 200: 成功
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误

---

## 部署架构

### 开发环境
```
前端: localhost:3000 (npm run dev)
后端: localhost:8000 (uvicorn --reload)
数据库: ./student_hub.db (本地文件)
```

### 生产环境（可选）
```
前端: Vercel (自动部署)
后端: Railway/Render (容器部署)
数据库: PostgreSQL (云数据库)
```

---

## 扩展性设计

### 模块化设计
- 每个功能模块独立（任务、番茄钟、课程表、笔记）
- 新增模块只需：
  1. 添加数据库模型
  2. 添加API路由
  3. 添加前端页面

### AI能力扩展
- 当前: DeepSeek对话、任务解析
- 可扩展: 文档总结、智能推荐、学习分析

### GIS功能扩展（后续）
- 添加ArcPy模块
- 添加地图可视化（Leaflet）
- 添加空间数据处理
