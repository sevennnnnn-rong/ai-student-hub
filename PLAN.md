# AI Student Hub - 项目总计划

## 项目定位

**AI驱动的大学生效率助手**（个人使用）

### 核心痛点
1. 作业考试课程安排记不住 → 任务/deadline管理
2. 拖延症 → 番茄钟+专注模式
3. 时间管理迭代混乱 → 课程表+日程可视化

### 技术栈
- **前端**: Next.js 14 + React 18 + TailwindCSS + shadcn/ui
- **后端**: Python FastAPI + SQLAlchemy
- **数据库**: SQLite（开发期）→ PostgreSQL（生产）
- **AI服务**: DeepSeek API（低成本，国内可用）
- **部署**: Vercel（前端）+ Railway/Render（后端）

### 角色分工
- **Claude（指挥官）**: 架构设计、计划制定、代码审查
- **Trae（执行者）**: 前端开发、后端开发、全部代码实现

---

## 项目结构

```
ai-student-hub/
├── frontend/                    # Next.js前端
│   ├── src/
│   │   ├── app/                 # App Router
│   │   │   ├── (dashboard)/     # 主面板布局
│   │   │   │   ├── tasks/       # 任务管理页
│   │   │   │   ├── pomodoro/    # 番茄钟页
│   │   │   │   ├── schedule/    # 课程表页
│   │   │   │   ├── notes/       # 笔记页
│   │   │   │   └── ai-chat/     # AI对话页
│   │   │   ├── layout.tsx       # 根布局
│   │   │   └── page.tsx         # 首页重定向
│   │   ├── components/          # 通用组件
│   │   │   ├── ui/              # shadcn/ui组件
│   │   │   ├── sidebar.tsx      # 侧边栏导航
│   │   │   ├── task-card.tsx    # 任务卡片
│   │   │   ├── pomodoro-timer.tsx # 番茄钟计时器
│   │   │   └── ai-chat-bubble.tsx # AI对话气泡
│   │   ├── lib/                 # 工具函数
│   │   │   ├── api.ts           # API客户端
│   │   │   └── utils.ts         # 通用工具
│   │   └── styles/
│   │       └── globals.css      # 全局样式
│   ├── public/                  # 静态资源
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                     # Python FastAPI后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI入口
│   │   ├── config.py            # 配置管理
│   │   ├── database.py          # 数据库连接
│   │   ├── api/                 # API路由
│   │   │   ├── __init__.py
│   │   │   ├── tasks.py         # 任务接口
│   │   │   ├── pomodoro.py      # 番茄钟接口
│   │   │   ├── schedule.py      # 课程表接口
│   │   │   ├── notes.py         # 笔记接口
│   │   │   └── ai.py            # AI对话接口
│   │   ├── models/              # SQLAlchemy模型
│   │   │   ├── __init__.py
│   │   │   ├── task.py
│   │   │   ├── pomodoro.py
│   │   │   ├── schedule.py
│   │   │   └── note.py
│   │   ├── schemas/             # Pydantic数据模型
│   │   │   ├── __init__.py
│   │   │   ├── task.py
│   │   │   ├── pomodoro.py
│   │   │   ├── schedule.py
│   │   │   └── note.py
│   │   └── services/            # 业务逻辑
│   │       ├── __init__.py
│   │       ├── ai_service.py    # DeepSeek API调用
│   │       └── task_parser.py   # AI任务解析
│   ├── requirements.txt
│   └── .env.example             # 环境变量模板
│
├── docs/                        # 项目文档
│   ├── PLAN.md                  # 本文件
│   ├── architecture.md          # 架构详解
│   ├── api-spec.md              # API接口规范
│   ├── database-schema.md       # 数据库设计
│   ├── tasks.md                 # Trae执行任务清单
│   └── coding-standards.md      # 代码规范
│
└── README.md                    # 项目说明
```

---

## 执行阶段

### 阶段一：基础搭建（Day 1-2）
**目标**: 前后端项目骨架跑通，数据库表创建完成

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 1.1 | 创建Next.js前端项目 | Trae | frontend/目录 |
| 1.2 | 配置TailwindCSS + shadcn/ui | Trae | 样式系统可用 |
| 1.3 | 创建FastAPI后端项目 | Trae | backend/目录 |
| 1.4 | 实现数据库模型 | Trae | models/目录 |
| 1.5 | 创建数据库表 | Trae | SQLite数据库文件 |
| 1.6 | 实现基础CORS配置 | Trae | 前后端可通信 |

### 阶段二：任务管理（Day 3-4）
**目标**: 任务CRUD功能完成，前端可操作

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 2.1 | 实现任务API接口 | Trae | /api/tasks系列接口 |
| 2.2 | 创建任务列表页面 | Trae | tasks/page.tsx |
| 2.3 | 创建任务卡片组件 | Trae | task-card.tsx |
| 2.4 | 实现任务创建表单 | Trae | 新建任务功能 |
| 2.5 | 实现任务状态切换 | Trae | 完成/未完成切换 |
| 2.6 | 实现任务筛选排序 | Trae | 按日期/优先级筛选 |

### 阶段三：番茄钟（Day 5）
**目标**: 番茄钟计时功能完成，可关联任务

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 3.1 | 实现番茄钟API接口 | Trae | /api/pomodoro系列接口 |
| 3.2 | 创建番茄钟计时器组件 | Trae | pomodoro-timer.tsx |
| 3.3 | 创建番茄钟页面 | Trae | pomodoro/page.tsx |
| 3.4 | 实现任务关联功能 | Trae | 选择任务开始专注 |
| 3.5 | 实现统计数据展示 | Trae | 今日/本周专注时长 |

### 阶段四：课程表（Day 6）
**目标**: 周视图课程表完成，可增删改查

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 4.1 | 实现课程表API接口 | Trae | /api/schedule系列接口 |
| 4.2 | 创建课程表周视图组件 | Trae | schedule-grid.tsx |
| 4.3 | 创建课程表页面 | Trae | schedule/page.tsx |
| 4.4 | 实现课程添加表单 | Trae | 新增课程功能 |
| 4.5 | 实现课程颜色标记 | Trae | 不同课程不同颜色 |

### 阶段五：AI功能（Day 7-8）
**目标**: AI对话可用，可自然语言创建任务

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 5.1 | 配置DeepSeek API | Trae | AI服务可用 |
| 5.2 | 实现AI对话接口 | Trae | /api/ai/chat接口 |
| 5.3 | 创建AI聊天页面 | Trae | ai-chat/page.tsx |
| 5.4 | 实现对话历史存储 | Trae | 对话可追溯 |
| 5.5 | 实现AI任务解析 | Trae | 自然语言→任务 |
| 5.6 | 实现AI总结功能 | Trae | 笔记/文档总结 |

### 阶段六：笔记系统（Day 9）
**目标**: Markdown笔记完成，可关联任务

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 6.1 | 实现笔记API接口 | Trae | /api/notes系列接口 |
| 6.2 | 集成Markdown编辑器 | Trae | 编辑器组件 |
| 6.3 | 创建笔记页面 | Trae | notes/page.tsx |
| 6.4 | 实现笔记与任务关联 | Trae | 双向链接 |
| 6.5 | 实现笔记搜索功能 | Trae | 全文搜索 |

### 阶段七：完善优化（Day 10）
**目标**: UI打磨，体验优化

| 序号 | 任务 | 负责人 | 产出 |
|------|------|--------|------|
| 7.1 | 实现深色模式 | Trae | 主题切换 |
| 7.2 | 响应式适配 | Trae | 移动端可用 |
| 7.3 | 数据看板页面 | Trae | 统计可视化 |
| 7.4 | 快捷键支持 | Trae | 效率提升 |
| 7.5 | 错误处理优化 | Trae | 用户友好提示 |

---

## 关键决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 前端框架 | Next.js 14 | SSR支持，SEO友好，生态成熟 |
| UI组件库 | shadcn/ui | 可定制性强，无额外依赖 |
| 后端框架 | FastAPI | 异步支持，自动文档，Python生态 |
| 数据库 | SQLite | 个人项目，无需复杂部署 |
| AI服务 | DeepSeek | 国内可用，成本低，中文能力强 |
| 状态管理 | React Context | 简单场景无需Redux |

---

## 环境要求

### 前端
- Node.js >= 18
- npm 或 pnpm

### 后端
- Python >= 3.9
- pip

### API密钥
- DeepSeek API Key（从 https://platform.deepseek.com 获取）

---

## 启动命令

### 前端
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

### 后端
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API文档 http://localhost:8000/docs
```

---

## 注意事项

1. **所有代码必须包含中文注释**，方便理解和维护
2. **API接口必须返回统一格式**，包含code、message、data字段
3. **前端必须支持深色模式**，使用CSS变量实现
4. **后端必须处理异常**，返回友好的错误信息
5. **数据库操作必须使用事务**，确保数据一致性

---

## 下一步

请Trae阅读 `docs/tasks.md` 文件，按顺序执行任务清单中的每一项。

如有疑问，联系Claude（指挥官）确认。
