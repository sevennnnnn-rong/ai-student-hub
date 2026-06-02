# AI Student Hub - Handoff 文件

**最后更新**: 2026-06-02（全面重构后）

---

## 项目状态

**定位**: AI 驱动的大学生效率助手（个人使用）
**技术栈**: React 19 + Vite 8 + Tailwind CSS v4 + TypeScript（前端）/ Python FastAPI + SQLAlchemy 2.0（后端）/ Node.js + Express + sql.js（同步服务）/ Tauri 2.x（桌面端）
**目标**: 电脑端与移动端同步使用的正规应用

---

## 已完成事项

### 1. 核心功能
- 多 Agent 接入（Claude、Codex、豆包），流式输出
- 任务管理（CRUD、优先级、截止日期、筛选排序）
- 番茄钟（热力图日历、每日目标、进度圈可视化）
- 课程表（周视图、ICS 文件导入、颜色标记）
- 富文本笔记（TipTap 编辑器、自动保存）
- 数据看板（recharts 图表、专注趋势）
- 通知提醒（APScheduler 调度）

### 2. 多设备同步
- Node.js + Express + sql.js 同步服务器
- REST API: register/push/pull/status/ack
- WebSocket 实时同步 + 心跳检测
- 离线队列 + 冲突解决（Last-Write-Wins）
- 设备注册持久化到数据库

### 3. 桌面端与移动端
- Tauri 2.x 桌面端（.exe + NSIS 安装包）
- PWA 支持（manifest + Service Worker）
- 移动端安全区域适配

### 4. 全面代码重构（2026-06-02）
- **P0 关键修复**: Settings 配置补全、SQLAlchemy DeclarativeBase 迁移、SSE 会话泄漏修复、前端硬编码 URL 修复、类型安全改进、数据库写入同步化
- **P1 重构**: Agent 代码合并（CliAgent 基类）、Pydantic ConfigDict 迁移、共享配置提取（tooltipStyle/navItems/agentConfig）、闭包过期修复、分页支持、死代码清理
- **P2 打磨**: 未用资源清理、CSS 精简、health 端点增强、类型注解补全

---

## 当前状态

| 组件 | 状态 | 说明 |
|------|------|------|
| 后端 API | ✅ 就绪 | localhost:8000 |
| 前端 | ✅ 就绪 | localhost:3000 |
| 同步服务 | ✅ 就绪 | localhost:3001 |
| Tauri 桌面端 | ✅ 配置就绪 | 需 `cargo tauri build` |

---

## 项目结构

```
ai-student-hub/
├── frontend-new/          # React 前端（Vite）
│   ├── src/
│   │   ├── pages/         # 8 个页面组件
│   │   ├── components/    # UI 组件 + 图表
│   │   ├── hooks/         # useTheme, useFocusMode, usePageTitle, useKeyboardShortcuts
│   │   └── lib/           # api.ts, chart-config.ts, nav-config.ts, agent-config.ts
│   └── package.json
├── backend/               # Python FastAPI 后端
│   ├── app/
│   │   ├── api/           # 7 个 API 路由模块
│   │   ├── models/        # SQLAlchemy 模型
│   │   ├── schemas/       # Pydantic Schema（ConfigDict 模式）
│   │   └── services/      # 业务逻辑（含 CliAgent 基类）
│   └── requirements.txt
├── sync-server/           # Node.js 同步服务
│   ├── server.js
│   ├── db.js              # 设备表 + 索引
│   ├── sync-service.js    # 设备持久化 + 同步逻辑
│   └── ws-server.js       # WebSocket（含 DB 持久化）
├── src-tauri/             # Tauri 桌面端
│   ├── src/
│   └── tauri.conf.json
├── scripts/               # 一次性工具脚本
└── start.bat              # 一键启动脚本
```

---

## 启动命令

```bash
# 一键启动
start.bat

# 手动启动
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend-new && npm run dev
cd sync-server && node server.js
```

---

## 关键决策

1. **前端框架**: React 19 + Vite 8（替代原来的 Next.js）
2. **同步方案**: 自建同步服务（Node.js + SQLite + WebSocket）
3. **桌面端**: Tauri（体积小、性能好）
4. **Agent 架构**: CliAgent 基类 + HTTP API Agent（豆包）
5. **冲突解决**: Last-Write-Wins

---

## 下一步

- [ ] 版本号从 0.1.0 升级
- [ ] 添加认证中间件（当前所有端点开放）
- [ ] 编写测试用例
- [ ] 考虑 Alembic 替代手动 migration
