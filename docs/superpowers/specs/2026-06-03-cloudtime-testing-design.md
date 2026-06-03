# CloudTime 升级测试修复方案

**日期**: 2026-06-03
**项目**: AI Student Hub (气象台Hub)
**版本**: v1.4.0
**状态**: 待实施

---

## 背景

CloudTime 网易云播放器升级已完成开发，Vite 构建通过。需要：
1. Tauri 构建桌面应用
2. 安装测试
3. 按测试清单逐条验证 13 项功能
4. 修复发现的 bug
5. 全部 OK 后提交 commit

**用户约定**: 先本地测试，OK 后再提交 commit

---

## 测试清单

| # | 功能 | 测试要点 |
|---|------|---------|
| 1 | QR 登录 | 扫码 → 登录成功 → 状态持久化 |
| 2 | 推荐歌单 | 加载 → 点击进入 → 播放全部 |
| 3 | MiniPlayer | 播放/暂停/上下首/进度条 |
| 4 | 全屏播放器 | 点击封面打开 → 歌词同步 → 进度拖拽 → 控制 |
| 5 | 关闭全屏 | 下滑/点X → 关闭 |
| 6 | 快捷键 | Space/M/L/S/Ctrl+F/Esc |
| 7 | 搜索 | 输入 → tabs切换 → 搜索历史 |
| 8 | 搜索历史 | localStorage 10条 → 点击回填 |
| 9 | 睡眠定时 | 30/60/90分钟 → 到期暂停 |
| 10 | 每日推荐 | 需登录 → 加载推荐 |
| 11 | 排行榜 | 加载排行榜列表 |
| 12 | 音频可视化 | 32柱CSS频谱动画 |
| 13 | 状态恢复 | 重启后恢复播放状态 |

---

## 架构设计

### 10 Agent 并行方案

```
阶段1：构建准备（1 agent）
├── Agent-Build: Tauri构建 + 安装 + 配置Playwright

阶段2：测试并行（5 agents）
├── Agent-Test-1: QR登录流程
├── Agent-Test-2: 播放器控制（MiniPlayer + 全屏）
├── Agent-Test-3: 歌词与音频可视化
├── Agent-Test-4: 搜索与快捷键
├── Agent-Test-5: 辅助功能（睡眠定时/每日推荐/排行榜）

阶段3：修复并行（4 agents）
├── Agent-Fix-1: 登录模块bug
├── Agent-Fix-2: 播放器核心bug
├── Agent-Fix-3: UI/交互bug
├── Agent-Fix-4: API/存储bug

阶段4：汇总提交（1 agent）
└── Agent-Final: 重新构建 + 回归测试 + commit
```

---

## Agent 详细职责

### Agent-Build（构建准备）

**职责**:
1. 执行 `cd D:\Software\ai-student-hub\src-tauri && cargo tauri build`
2. 复制 exe 到 `C:\Users\lenovo\AppData\Local\Programs\气象台Hub`
3. 检查 Playwright for Tauri 依赖
4. 输出构建状态

**执行命令**:
```bash
cd D:\Software\ai-student-hub\src-tauri
cargo tauri build

# 复制到安装路径
cp target/release/bundle/nsis/*.exe "C:\Users\lenovo\AppData\Local\Programs\气象台Hub\"
```

**输出格式**:
```json
{
  "build_success": true,
  "exe_path": "target/release/bundle/nsis/...",
  "install_path": "C:\\Users\\lenovo\\AppData\\Local\\Programs\\气象台Hub",
  "playwright_ready": true
}
```

---

### Agent-Test-1（QR登录测试）

**测试项**:
- [ ] 打开应用，触发 QR 登录
- [ ] 扫码后登录成功
- [ ] 登录状态持久化（重启后仍登录）
- [ ] 登录失败处理

**测试方法**:
1. Playwright 启动 Tauri 窗口
2. 导航到登录页面
3. 截图 QR 码
4. 验证登录后 UI 状态变化

**关键文件**:
- `LoginModal.tsx`
- `netease-api.ts` (login 相关)
- `login_qr_check.js` (注意 EAPI 修复是临时的)

---

### Agent-Test-2（播放器控制测试）

**测试项**:
- [ ] MiniPlayer 播放/暂停/上一首/下一首
- [ ] 进度条拖拽
- [ ] 点击专辑封面打开全屏播放器
- [ ] 全屏播放器播放控制
- [ ] 下滑/点X关闭全屏播放器

**关键文件**:
- `MiniPlayer.tsx`
- `NowPlayingView.tsx`
- `CloudTime.tsx` (~850行核心)

**注意事项**:
- CloudTime.tsx 是多文件核心，改动时注意别破坏 JSX 结构
- Portal 渲染全屏播放器

---

### Agent-Test-3（歌词与可视化测试）

**测试项**:
- [ ] 歌词同步显示
- [ ] 歌词自动滚动
- [ ] 音频可视化（32柱频谱）
- [ ] 可视化动画流畅

**关键文件**:
- `NowPlayingView.tsx` (歌词+可视化)

---

### Agent-Test-4（搜索与快捷键测试）

**测试项**:
- [ ] 搜索功能正常
- [ ] tabs 切换
- [ ] 搜索历史（localStorage 10条）
- [ ] 快捷键：Space/←→/↑↓/M/L/S/Ctrl+F/Esc

**关键文件**:
- `SearchView.tsx`
- `player-storage.ts` (搜索历史)
- `useKeyboardShortcuts.ts`

---

### Agent-Test-5（辅助功能测试）

**测试项**:
- [ ] 睡眠定时器（30/60/90分钟）
- [ ] 定时器到期暂停
- [ ] 每日推荐加载（需登录）
- [ ] 排行榜加载
- [ ] 重启后恢复播放状态

**关键文件**:
- `CloudTime.tsx` (睡眠定时)
- `MiniPlayer.tsx` (睡眠定时)
- `NowPlayingView.tsx` (睡眠定时)
- `HomeView.tsx` (每日推荐/排行榜)
- `netease-api.ts` (getDailyRecommend, getToplists)
- `player-storage.ts` (状态恢复)

---

### 修复 Agents（Fix-1 ~ Fix-4）

| Agent | 负责模块 | 关键文件 |
|-------|---------|---------|
| Fix-1 | 登录模块 | LoginModal.tsx, netease-api.ts (login) |
| Fix-2 | 播放器核心 | CloudTime.tsx, MiniPlayer.tsx, NowPlayingView.tsx |
| Fix-3 | UI交互 | SearchView.tsx, ToolBar.tsx, ErrorBoundary.tsx |
| Fix-4 | API存储 | netease-api.ts, player-storage.ts, useKeyboardShortcuts.ts |

**修复策略**: 批量修复（所有测试 agent 跑完后汇总问题清单）

---

### Agent-Final（汇总提交）

**职责**:
1. 重新 `cargo tauri build`
2. 安装到目标路径
3. 运行全量回归测试
4. 确认所有测试通过
5. 提交 commit

**Commit 消息**:
```
feat: CloudTime upgrade - full player with lyrics, search, shortcuts

- Component split: 1385 → 850 lines with 8 components
- Full-screen player with Portal rendering, blur background, vinyl rotation
- Lyrics sync with auto-scroll
- Audio visualizer (32-bar CSS spectrum)
- Keyboard shortcuts: Space/←→/↑↓/N/P/M/L/S/Ctrl+F/Esc
- Search with history (localStorage 10 items)
- Sleep timer (30/60/90 min)
- Daily recommend & toplists (login required)
- ErrorBoundary for render error capture
```

---

## 数据流

```
测试 Agent → bug-report.json → 修复 Agent
                              ↓
                    修复代码 → git diff
                              ↓
Agent-Final ← 重建 → 回归测试 → commit
```

**bug-report.json 格式**:
```json
{
  "agent": "Test-2",
  "test_case": "全屏播放器打开",
  "status": "FAIL",
  "error": "点击封面后无反应",
  "screenshot": "screenshots/test2-fail.png",
  "suggested_fix": "检查 Portal 渲染逻辑"
}
```

---

## Playwright for Tauri 配置

### 目录结构

```
tests/
├── playwright.config.ts
├── fixtures/
│   └── tauri-fixture.ts    # Tauri 启动/停止
├── qr-login.spec.ts
├── player-controls.spec.ts
├── lyrics-viz.spec.ts
├── search-shortcuts.spec.ts
└── auxiliary-features.spec.ts
```

### 配置文件

**playwright.config.ts**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'tauri',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
```

**tauri-fixture.ts**:
```typescript
import { test as base, _electron as electron } from '@playwright/test';
import { join } from 'path';

export const test = base.extend({
  app: async ({}, use) => {
    const app = await electron.launch({
      args: [join(__dirname, '../../src-tauri/target/release/气象台Hub.exe')],
    });
    await use(app);
    await app.close();
  },
});

export { expect } from '@playwright/test';
```

---

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 构建失败 | Agent-Build 记录错误，流程终止 |
| 测试超时 | 单个测试最多 60s，超时标记为 SKIP |
| 修复冲突 | 多个 agent 改同一文件时，由 Agent-Final 合并 |
| Playwright 启动失败 | 回退到代码审查模式 |

---

## 输出物

| 阶段 | 输出 | 位置 |
|------|------|------|
| 构建 | exe + 安装日志 | `target/release/bundle/` |
| 测试 | 5 份 bug-report.json | `tests/reports/` |
| 修复 | git diff | 工作区 |
| 提交 | 1 个 commit | git history |

---

## 已知问题

1. **`login_qr_check.js` 的 WEAPI→EAPI 修复是临时的**，npm install 后会丢失
2. **并行 agent 写同一文件会冲突** — CloudTime.tsx 被 3 个 agent 同时修改，已修复乱码和 JSX 结构问题
3. **版本号待升级**（当前 1.0.0）

---

## 相关资源

- **源码**: D:\Software\ai-student-hub
- **安装路径**: C:\Users\lenovo\AppData\Local\Programs\气象台Hub
- **GitHub**: https://github.com/sevennnnnn-rong/ai-student-hub
- **HANDOFF**: D:\Software\ai-student-hub\HANDOFF.md
