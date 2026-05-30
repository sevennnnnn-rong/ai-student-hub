# AI Student Hub - Handoff 文件

**最后更新**: 2026-05-30

---

## 项目状态

**定位**: AI 驱动的大学生效率助手（个人使用）
**技术栈**: Next.js 16 + React 19 + TailwindCSS 4 + shadcn/ui (前端) / Python FastAPI + SQLAlchemy + SQLite (后端)
**目标**: 电脑端与移动端同步使用的正规应用

---

## 已完成事项

### 1. 多 Agent 接入 ✅
- 4 个 Agent: DeepSeek, Claude, MiMo, Trae
- 流式输出支持
- Agent 选择器 UI

### 2. Bug 修复 (P0) ✅
- 修复前端消息重复问题 (`ai-chat/page.tsx`)
- 修复后端 Session 泄漏 (`api/ai.py`)
- 修复 `__dict__` 序列化问题 (所有 API 路由)

### 3. 番茄钟增强 ✅
- 热力图日历 (近30天)
- 每日目标设置
- 进度圈可视化
- 统计 API (daily/hourly)
- 设置面板

### 4. 课表导入 ✅
- ICS 文件解析器 (`services/ics_parser.py`)
- 导入预览界面
- 确认导入功能

### 5. 富文本笔记 ✅
- TipTap 编辑器集成
- 笔记编辑页面（新建 + 编辑模式）

### 6. 通知提醒 ✅
- APScheduler 后端调度服务
- 通知 API 端点

### 7. 数据看板 ✅
- 今日概览卡片 + recharts 图表 + 课程热力图

### 8. 编辑功能补全 ✅
- 任务编辑 (截止日期/优先级/状态)
- 课程编辑 (全部字段)

### 9. 同步服务 ✅
- Node.js + Express + sql.js 同步服务器
- REST API: register/push/pull/status/ack
- WebSocket 实时同步 + 心跳检测
- 前端适配层: SyncClient + OfflineQueue + SyncManager + SyncProvider
- 冲突解决: Last-Write-Wins / Higher-Version / Manual
- 自动重连 + 离线队列持久化

### 10. Tauri 桌面端 ✅
- src-tauri/ 项目初始化 (Tauri 2.x)
- Rust cargo check 通过
- 系统托盘配置
- CSP 安全策略配置
- .exe 打包配置 (bundle targets: all)

### 11. PWA 移动端 ✅
- manifest.json 配置
- Service Worker (cache-first 静态资源, network-only API)
- SWProvider 集成到 layout
- 移动端安全区域适配 (safe-area-inset)
- 触屏选择禁用 (PWA standalone 模式)

### 12. 代码质量审计与修复 ✅
- 前端: 24 个问题审计 + 关键修复
- 后端: 33 个问题审计 + 9 个文件修复
- 同步服务器: 44 个问题审计 + 4 个文件修复
- 前端: loading.tsx + error.tsx 添加到所有路由
- 前端: Pomodoro/Schedule 页面 loading skeleton
- 前端: sync 层 `any` 类型替换为 `Record<string, unknown>`
- 前端: api.ts `undefined as T` 类型安全修复
- 前端: viewport maximumScale 恢复为 5 (无障碍)
- 前端: 根页面重定向改为 /dashboard
- 后端: 全局异常处理器不再泄露内部错误
- 后端: lifespan 替代 deprecated on_event
- 后端: conversation_messages 添加索引
- 后端: Schema 添加 max_length 约束
- 后端: AI agent 错误返回 proper HTTP 状态码
- 后端: HTTPException 统一响应格式
- 同步: heartbeat 泄漏修复
- 同步: devices Map 限制 + sync_log 清理
- 同步: saveDatabase 改为异步
- 同步: shutdown 优雅关闭
- 同步: WebSocket 连接/消息大小限制

---

## 待办事项

### 第一阶段：功能完善 ✅ 已完成

#### 5. 富文本笔记 ✅
- 集成 TipTap 编辑器（Bold, Italic, Highlight, H2/H3, List, TaskList, CodeBlock, Quote, Link, Image）
- 支持 Markdown、图片、代码块(lowlight 语法高亮)、任务列表
- 笔记编辑页面（新建 + 编辑模式）
- **文件**: `frontend/src/app/(dashboard)/notes/page.tsx`, `frontend/src/components/TipTapEditor.tsx`

#### 6. 通知提醒 ✅
- 后端通知调度服务 (APScheduler) — 每5分钟检查到期任务
- API 端点: `/api/notifications/upcoming`, `/api/notifications/overdue`
- **新增文件**: `backend/app/services/notification_service.py`, `backend/app/api/notifications.py`
- **修改文件**: `backend/app/main.py` (启动/关闭调度器), `backend/requirements.txt` (添加 apscheduler)

#### 7. 数据看板 ✅
- 今日概览卡片 (待办/已完成/专注分钟/课程数)
- 专注时间趋势折线图 (recharts)
- 专注时间分布饼图 (recharts)
- 课程时间热力图
- **新增文件**: `frontend/src/app/(dashboard)/dashboard/page.tsx`
- **修改文件**: `frontend/src/components/sidebar.tsx` (添加导航入口)

#### 8. 编辑功能补全 ✅
- 任务管理：完善编辑对话框 (标题/描述/截止日期/优先级/状态)
- 课程表：添加编辑课程功能 (点击课程块可编辑)
- 笔记：编辑功能已在 #5 富文本笔记中完成

### 第二阶段：同步服务 ✅ 已完成
- Node.js + Express + sql.js 同步服务器 (port 3001)
- REST API: register, push, pull, status, ack
- WebSocket 实时同步 (ws-server.js)
- 前端同步适配层: SyncClient, OfflineQueue, SyncManager, SyncProvider
- 冲突解决: Last-Write-Wins / Higher-Version / Manual
- 自动重连 + 心跳保活 + 离线队列持久化

### 第三阶段：Tauri 桌面端 ✅ 已完成
- src-tauri/ 项目初始化 (Cargo.toml, tauri.conf.json, lib.rs, main.rs)
- Rust cargo check 零警告通过
- 系统托盘配置 (trayIcon in tauri.conf.json)
- CSP 安全策略 (允许 localhost:3001/8000, WebSocket)
- .exe 打包配置 (release profile: LTO + strip)
- 前端: @tauri-apps/api + tauri scripts

### 第四阶段：PWA 移动端适配 ✅ 已完成
- manifest.json (standalone, zh-CN, education/productivity)
- Service Worker: cache-first 静态资源, network-only API
- SWProvider + service-worker-registration.ts
- 移动端: safe-area-inset, 触屏选择禁用
- 前端 layout 集成 SyncProvider + SWProvider

---

## 关键决策

1. **同步方案**: 自建同步服务（Node.js + SQLite + WebSocket）
2. **桌面端**: Tauri (体积小、性能好)
3. **课表导入**: ICS 文件格式（通用标准）
4. **富文本编辑器**: TipTap (已集成)
5. **冲突解决**: 最后写入胜出（Last-Write-Wins）

---

## 文件结构

```
D:/Software/ai-student-hub/
├── backend/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   └── notifications.py  # ✅ 通知 API
│   │   ├── models/        # 数据模型
│   │   ├── schemas/       # Pydantic Schema
│   │   ├── services/      # 服务层
│   │   │   ├── agents/    # 多 Agent 实现
│   │   │   ├── ics_parser.py  # ICS 解析器 ✅
│   │   │   └── notification_service.py  # ✅ 通知调度
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── manifest.json          # ✅ PWA manifest
│   │   ├── sw.js                  # ✅ Service Worker
│   │   └── icons/                 # ✅ PWA 图标 (占位)
│   ├── src/
│   │   ├── app/(dashboard)/
│   │   │   ├── ai-chat/page.tsx
│   │   │   ├── notes/page.tsx      # ✅ 已增强
│   │   │   ├── pomodoro/page.tsx   # ✅ 已增强
│   │   │   ├── schedule/page.tsx   # ✅ 已增强
│   │   │   ├── tasks/page.tsx      # ✅ 已补全编辑
│   │   │   └── dashboard/page.tsx  # ✅ 数据看板
│   │   ├── components/
│   │   │   ├── sw-provider.tsx              # ✅ SW Provider
│   │   │   └── service-worker-registration.ts  # ✅ SW 注册
│   │   └── lib/
│   │       ├── api.ts
│   │       ├── sync-client.ts      # ✅ 同步客户端
│   │       ├── offline-queue.ts    # ✅ 离线队列
│   │       ├── sync-manager.ts     # ✅ 同步管理器
│   │       └── sync-provider.tsx   # ✅ React Provider
│   └── package.json
├── sync-server/           # ✅ 同步服务 (Node.js)
│   ├── server.js          # Express + WebSocket 服务器
│   ├── db.js              # sql.js 数据库
│   ├── sync-service.js    # 同步逻辑
│   ├── ws-server.js       # WebSocket 服务器
│   ├── ws-client.js       # WebSocket 客户端
│   ├── conflict-resolver.js  # 冲突解决器
│   └── package.json
├── src-tauri/             # ✅ Tauri 桌面端
│   ├── Cargo.toml         # Rust 依赖
│   ├── tauri.conf.json    # Tauri 配置
│   ├── build.rs           # 构建脚本
│   ├── icons/             # 应用图标
│   └── src/
│       ├── main.rs        # 入口
│       └── lib.rs         # 库
```

---

## 启动命令

```bash
# 后端
cd D:/Software/ai-student-hub/backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 前端
cd D:/Software/ai-student-hub/frontend
npm install
npm run dev

# 同步服务
cd D:/Software/ai-student-hub/sync-server
npm install
npm run dev

# Tauri 桌面端 (开发模式)
cd D:/Software/ai-student-hub/frontend
npm run tauri:dev

# Tauri 桌面端 (打包 .exe)
cd D:/Software/ai-student-hub/frontend
npm run tauri:build
```

---

## 下一步行动

1. **安装后端依赖**: `pip install apscheduler icalendar`
2. **测试同步**: 启动 sync-server + 前端，验证多设备同步
3. **Tauri 打包**: `npm run tauri:build` 生成 .exe
4. **PWA 图标**: 替换 `frontend/public/icons/` 下的占位图标
5. **部署**: 前端 build + 同步服务部署

---

## 注意事项

- 所有 API 响应使用 Pydantic Response 模型序列化
- 前端使用 AsyncGenerator 实现流式输出
- 番茄钟使用 useRef 管理定时器和 sessionId
- 课表导入支持 .ics 格式（iCalendar 标准）
