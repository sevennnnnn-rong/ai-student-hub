# 番茄钟沉浸式自习场景 - 架构设计

## 目录结构

```
src/pages/pomodoro/
├── index.tsx                    # 主入口，组合所有模块
├── components/
│   ├── ImmersiveTimer.tsx       # 浮动计时器核心
│   ├── SceneSwitcher.tsx        # 顶部场景切换条
│   ├── ToolBar.tsx              # 底部浮动工具栏
│   ├── BreathingGuide.tsx       # 呼吸引导工具
│   ├── QuickTodo.tsx            # 快速待办工具
│   ├── FocusStats.tsx           # 专注统计工具
│   ├── VolumeControl.tsx        # 音量控制工具
│   └── MotivationalQuote.tsx    # 座右铭显示
├── scenes/
│   ├── index.ts                 # 场景配置导出
│   ├── RainyWindow.tsx          # 雨天窗边
│   ├── ForestCabin.tsx          # 森林书屋
│   ├── BeachStudy.tsx           # 海边自习
│   ├── NightCafe.tsx            # 深夜咖啡馆
│   ├── StarryNight.tsx          # 星河夜空
│   ├── WarmFireplace.tsx        # 壁炉温暖
│   ├── Library.tsx              # 图书馆
│   └── DeepOcean.tsx            # 深海静谧
├── audio/
│   ├── AudioEngine.ts           # 音频引擎核心
│   ├── SoundMixer.tsx           # 混音器UI
│   └── noise-generators.ts      # Web Audio 噪音生成器
└── hooks/
    ├── usePomodoro.ts           # 番茄钟状态管理
    ├── useScene.ts              # 场景切换逻辑
    └── useAudioEngine.ts        # 音频引擎 hook
```

## 核心模块

### 1. 场景系统 (Scene System)
每个场景包含：
- `id`: 唯一标识
- `name`: 显示名称
- `icon`: 场景图标
- `gradient`: 背景渐变
- `particles`: 粒子动画配置
- `sounds`: 关联的音效列表
- `theme`: 场景专属主题色

### 2. 音频引擎 (Audio Engine)
- 单一 AudioContext 实例
- 多 GainNode 混音
- 支持真实音频文件 + Web Audio 生成
- 音量独立控制

### 3. 工具面板 (Tool Panel)
浮动工具栏，可展开/收起：
- 呼吸引导（4-7-8 呼吸法）
- 久坐提醒
- 白噪音混音器
- 快速待办
- 座右铭
- 专注统计
- 音量控制
- 快捷键帮助

## 状态管理

使用 React Context + useReducer：
- 计时器状态
- 当前场景
- 音频状态
- 工具面板状态
- 用户偏好

## 响应式策略

- PC: 全屏沉浸式，侧边工具面板
- 移动端: 全屏，底部工具栏，触摸手势
