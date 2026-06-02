# 气象台Hub (AI Student Hub)

AI 驱动的大学生效率助手，支持桌面端和移动端同步使用。

## 技术栈

- **桌面端**: Tauri 2.x + Rust
- **前端**: React 19 + Vite 8 + Tailwind CSS v4 + TypeScript
- **后端**: Python FastAPI + SQLAlchemy + SQLite
- **同步服务**: Node.js + Express + sql.js + WebSocket

## 功能模块

- **任务管理**: 创建、编辑、筛选、排序任务，支持优先级和截止日期
- **番茄钟**: 专注计时、热力图日历、每日目标、进度可视化
- **课程表**: 周视图、ICS 文件导入、课程颜色标记
- **AI 对话**: 多 Agent 支持（Claude、Codex、豆包），流式输出
- **富文本笔记**: TipTap 编辑器、自动保存、Markdown 支持
- **数据看板**: 今日概览、专注趋势、任务完成率图表
- **多设备同步**: REST API + WebSocket 实时同步，离线队列
- **PWA 支持**: 移动端可添加到主屏幕

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- Rust（Tauri 构建需要）

### 启动方式

**方式一：使用启动脚本（推荐）**

```bash
start.bat
```

**方式二：手动启动**

```bash
# 后端
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend-new
npm install
npm run dev

# 同步服务
cd sync-server
npm install
node server.js
```

### 访问地址

- 前端: http://localhost:3000
- 后端 API: http://localhost:8000/docs
- 同步服务: http://localhost:3001

## 构建桌面应用

```bash
cd frontend-new
npm run build
cd ../src-tauri
cargo tauri build
```

## 项目结构

```
ai-student-hub/
├── frontend-new/          # React 前端（Vite）
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   └── lib/           # 工具函数和配置
│   └── package.json
├── backend/               # Python FastAPI 后端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── models/        # 数据模型
│   │   ├── schemas/       # Pydantic Schema
│   │   └── services/      # 业务逻辑
│   └── requirements.txt
├── sync-server/           # Node.js 同步服务
│   ├── server.js
│   ├── sync-service.js
│   └── ws-server.js
├── src-tauri/             # Tauri 桌面端
│   ├── src/
│   └── tauri.conf.json
└── start.bat              # 一键启动脚本
```

## 许可证

个人项目，仅供学习使用。
