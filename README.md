# AI Student Hub

AI驱动的大学生效率助手

## 功能特性

- **任务管理**: 创建、完成、删除任务，支持优先级和分类
- **番茄钟**: 专注计时，关联任务，统计专注时长
- **课程表**: 周视图展示，支持增删改查
- **AI 助手**: 智能对话，自然语言创建任务
- **笔记**: Markdown 编辑器，支持任务关联

## 技术栈

- **前端**: Next.js 14 + React 18 + TailwindCSS + shadcn/ui
- **后端**: Python FastAPI + SQLAlchemy
- **数据库**: SQLite
- **AI**: DeepSeek API

## 快速开始

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 后端启动

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 编辑 .env 填入 DeepSeek API Key
uvicorn app.main:app --reload --port 8000
```

API 文档: http://localhost:8000/docs

## 项目结构

```
ai-student-hub/
├── frontend/          # Next.js 前端
├── backend/           # FastAPI 后端
├── docs/              # 项目文档
│   ├── PLAN.md        # 项目总计划
│   ├── architecture.md    # 架构设计
│   ├── api-spec.md        # API 规范
│   ├── database-schema.md # 数据库设计
│   ├── tasks.md           # Trae 执行任务清单
│   └── coding-standards.md # 代码规范
└── README.md
```

## 文档说明

- **PLAN.md**: 项目总计划，包含技术栈、目录结构、执行阶段
- **architecture.md**: 架构详解，包含前后端架构、数据流
- **api-spec.md**: API 接口规范，包含所有接口定义
- **database-schema.md**: 数据库设计，包含表结构和模型
- **tasks.md**: Trae 执行任务清单，按顺序执行
- **coding-standards.md**: 代码规范，包含命名、注释、样式

## 开发流程

1. **指挥官 (Claude)**: 设计架构、制定计划、审查代码
2. **执行者 (Trae)**: 按照 `tasks.md` 逐项执行

## 环境要求

- Node.js >= 18
- Python >= 3.9
- DeepSeek API Key (可选，AI 功能需要)

## 许可证

MIT
