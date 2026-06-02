# AI Student Hub - Handoff 文件

**最后更新**: 2026-06-03（测试配置进行中）

---

## 项目状态

**版本**: v1.4.0
**分支**: refactor/comprehensive-cleanup
**技术栈**: Tauri 2.x + React 19 + Vite 8 + TypeScript + Python FastAPI
**源码**: D:\Software\ai-student-hub
**安装路径**: C:\Users\lenovo\AppData\Local\Programs\气象台Hub
**GitHub**: https://github.com/sevennnnnn-rong/ai-student-hub

---

## CloudTime 网易云播放器升级（2026-06-03）

### 开发状态: ✅ 代码完成，⏳ 测试配置进行中

**用户约定**: 先本地测试，OK 后再提交 commit

### 测试进度（2026-06-03）

**已完成**：
- [x] Tauri 构建成功（exe: `气象台Hub_1.0.0_x64-setup.exe`，44.5MB）
- [x] Playwright 环境配置（@playwright/test 已安装）
- [x] 5 个测试文件创建（28 个测试用例）
- [x] WebDriverIO 环境配置（v9.27.2）

**待完成**：
- [ ] 启用 Tauri WebView 调试端口（端口 9222）
- [ ] 运行自动化测试
- [ ] 修复发现的 bug
- [ ] 重新构建并提交

**测试文件**：
```
frontend-new/tests/
├── playwright.config.ts
├── wdio.conf.ts
├── fixtures/tauri-fixture.ts
├── qr-login.spec.ts (7 tests)
├── player-controls.spec.ts (10 tests)
├── lyrics-viz.spec.ts (3 tests)
├── search-shortcuts.spec.ts (4 tests)
├── auxiliary-features.spec.ts (4 tests)
└── wdio/login.spec.ts
```

**下次继续**：
1. 启动 Tauri 开发模式并启用调试端口：
   ```bash
   set WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222
   cd D:\Software\ai-student-hub\src-tauri
   cargo tauri dev
   ```
2. 运行测试：
   ```bash
   cd D:\Software\ai-student-hub\frontend-new
   npx wdio run wdio.conf.ts
   ```

### 快速开始

```bash
cd D:\Software\ai-student-hub\frontend-new
npx vite dev          # 开发服务器
npx vite build        # 生产构建（已验证通过）
cd ../src-tauri && cargo tauri build  # 桌面应用构建
```

### 已完成功能

| 功能 | 文件 | 说明 |
|------|------|------|
| 组件拆分 | CloudTime.tsx (~850行) | 1385行 → 8个组件 |
| 全屏播放器 | NowPlayingView.tsx | Portal渲染, 模糊背景, 唱片旋转, 歌词同步, 下滑关闭 |
| 键盘快捷键 | useKeyboardShortcuts.ts | Space/←→/↑↓/N/P/M/L/S/Ctrl+F/Esc |
| 搜索历史 | player-storage.ts + SearchView.tsx | localStorage 10条, 点击回填 |
| 睡眠定时器 | CloudTime.tsx + MiniPlayer + NowPlaying | 30/60/90分钟, 到期暂停 |
| 每日推荐 | netease-api.ts + HomeView.tsx | 登录后显示 |
| 排行榜 | netease-api.ts + HomeView.tsx | 横向滚动卡片 |
| 音频可视化 | NowPlayingView.tsx | 32柱CSS模拟频谱 |
| ErrorBoundary | ErrorBoundary.tsx | 渲染错误捕获+重试 |

### 修改的文件

```
修改:
- CloudTime.tsx (~850行)
- MiniPlayer.tsx
- NowPlayingView.tsx
- SearchView.tsx
- HomeView.tsx
- netease-api.ts (getDailyRecommend, getToplists)
- player-storage.ts (搜索历史)
- useKeyboardShortcuts.ts (4个新快捷键)

新建:
- ErrorBoundary.tsx
```

### 测试清单

- [ ] QR 登录 → 扫码 → 登录成功
- [ ] 推荐歌单加载 → 点击进入 → 播放全部
- [ ] MiniPlayer 播放控制正常
- [ ] 点击专辑封面 → 全屏播放器打开
- [ ] 全屏播放器：歌词同步、进度拖拽、播放控制
- [ ] 下滑/点 X → 关闭全屏播放器
- [ ] 键盘快捷键（Space/M/L/S/Ctrl+F/Esc）
- [ ] 搜索 → tabs 切换 → 搜索历史
- [ ] 睡眠定时器设置/取消
- [ ] 每日推荐加载（需登录）
- [ ] 排行榜加载
- [ ] 音频可视化效果
- [ ] 重启后恢复播放状态

### 已知问题

1. **`node_modules` 中 `login_qr_check.js` 的 WEAPI→EAPI 修复是临时的**，npm install 后会丢失
2. **并行 agent 写同一文件会冲突** — CloudTime.tsx 被 3 个 agent 同时修改，已修复乱码和 JSX 结构问题
3. **版本号待升级**（当前 1.0.0）

---

## 历史记录

### 2026-06-02 全面重构（v1.4.0）
- 92 个问题修复，跨 4 个组件
- 后端/前端/同步服务器/脚本全面优化

### 2026-06-02 番茄钟沉浸式场景
- 8 个沉浸式场景 + CSS 粒子动画
- Liquid Glass 浮动计时器 + 8 个专注工具
- 音频引擎（Web Audio API）

---

## 待办事项

- [ ] CloudTime 交互测试通过后提交 commit
- [ ] 版本号从 1.0.0 升级
- [ ] 添加认证中间件（当前端点开放）
- [ ] 编写测试用例
- [ ] 考虑 Alembic 替代手动 migration

---

## 相关资源

- **发布清单**: production/releases/release-checklist-1.4.0.md
- **GitHub**: https://github.com/sevennnnnn-rong/ai-student-hub
