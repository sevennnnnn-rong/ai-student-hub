# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\qr-login.spec.ts >> QR 登录功能 >> 显示 QR 码
- Location: tests\qr-login.spec.ts:14:3

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - button "快速操作" [ref=e4]:
    - img [ref=e5]
  - button "快速笔记 (Ctrl+Shift+N)" [ref=e6]:
    - img [ref=e7]
  - generic [ref=e12]:
    - button "关闭引导" [ref=e13] [cursor=pointer]:
      - img [ref=e14]
    - generic [ref=e23]:
      - img [ref=e25]
      - heading "欢迎使用 气象台Hub" [level=2] [ref=e28]
      - paragraph [ref=e29]: 你的 AI 驱动学习助手，让学习更智能、更高效。
    - button "下一步" [ref=e31]:
      - text: 下一步
      - img [ref=e32]
  - generic [ref=e34]:
    - complementary [ref=e36]:
      - generic [ref=e37]:
        - generic [ref=e39]: AI
        - generic [ref=e40]: 气象台Hub
      - navigation "主导航" [ref=e42]:
        - generic [ref=e43]: 导航
        - link "首页" [ref=e44] [cursor=pointer]:
          - /url: /
          - img [ref=e45]
          - generic [ref=e48]: 首页
        - link "对话" [ref=e49] [cursor=pointer]:
          - /url: /chat
          - img [ref=e50]
          - generic [ref=e52]: 对话
        - link "任务" [ref=e53] [cursor=pointer]:
          - /url: /tasks
          - img [ref=e54]
          - generic [ref=e57]: 任务
        - link "番茄钟" [ref=e58] [cursor=pointer]:
          - /url: /pomodoro
          - img [ref=e59]
          - generic [ref=e62]: 番茄钟
        - link "课程表" [ref=e63] [cursor=pointer]:
          - /url: /schedule
          - img [ref=e64]
          - generic [ref=e66]: 课程表
        - link "笔记" [ref=e67] [cursor=pointer]:
          - /url: /notes
          - img [ref=e68]
          - generic [ref=e71]: 笔记
        - link "看板" [ref=e72] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e73]
          - generic [ref=e75]: 看板
      - generic [ref=e77]:
        - generic [ref=e78]: 工具
        - button "切换到浅色模式" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
          - generic [ref=e86]: 浅色模式
        - button "进入专注模式" [ref=e87] [cursor=pointer]:
          - img [ref=e88]
          - generic [ref=e93]: 专注模式
        - link "设置" [ref=e94] [cursor=pointer]:
          - /url: /settings
          - img [ref=e95]
          - generic [ref=e98]: 设置
    - main [ref=e100]:
      - generic [ref=e101]:
        - generic [ref=e102]:
          - generic [ref=e103]:
            - img [ref=e104]
            - generic [ref=e107]: AI-Powered 气象台 Hub
            - img [ref=e108]
          - heading "气象台Hub" [level=1] [ref=e111]
          - generic [ref=e112]:
            - img [ref=e113]
            - paragraph [ref=e115]: 6月3日 周三
          - paragraph [ref=e116]: 上午好，保持专注
          - generic [ref=e117]:
            - paragraph [ref=e118]: "\"宝剑锋从磨砺出，梅花香自苦寒来。\""
            - paragraph [ref=e119]: —— 警世贤文
          - paragraph [ref=e120]: 选择你的 AI 搭档，开始高效协作
        - generic [ref=e121]:
          - button "指挥官 Claude 战略规划、复杂推理、多步任务编排 深度思考 任务拆解 创意写作 开始对话" [ref=e122] [cursor=pointer]:
            - img [ref=e124]
            - generic [ref=e132]: 指挥官
            - heading "Claude" [level=2] [ref=e133]
            - paragraph [ref=e134]: 战略规划、复杂推理、多步任务编排
            - generic [ref=e135]:
              - generic [ref=e136]: 深度思考
              - generic [ref=e137]: 任务拆解
              - generic [ref=e138]: 创意写作
            - generic [ref=e139]:
              - generic [ref=e140]: 开始对话
              - img [ref=e141]
          - button "引擎 Codex 代码生成、技术实现、工程执行 代码生成 Bug修复 架构设计 开始对话" [ref=e143] [cursor=pointer]:
            - img [ref=e145]
            - generic [ref=e148]: 引擎
            - heading "Codex" [level=2] [ref=e149]
            - paragraph [ref=e150]: 代码生成、技术实现、工程执行
            - generic [ref=e151]:
              - generic [ref=e152]: 代码生成
              - generic [ref=e153]: Bug修复
              - generic [ref=e154]: 架构设计
            - generic [ref=e155]:
              - generic [ref=e156]: 开始对话
              - img [ref=e157]
          - button "苦力工 Doubao 批量处理、数据整理、重复性任务 数据处理 文本整理 批量操作 开始对话" [ref=e159] [cursor=pointer]:
            - img [ref=e161]
            - generic [ref=e163]: 苦力工
            - heading "Doubao" [level=2] [ref=e164]
            - paragraph [ref=e165]: 批量处理、数据整理、重复性任务
            - generic [ref=e166]:
              - generic [ref=e167]: 数据处理
              - generic [ref=e168]: 文本整理
              - generic [ref=e169]: 批量操作
            - generic [ref=e170]:
              - generic [ref=e171]: 开始对话
              - img [ref=e172]
        - generic [ref=e175]:
          - button "AI 对话 与 AI 搭档交流" [ref=e176]:
            - img [ref=e178]
            - generic [ref=e180]: AI 对话
            - generic [ref=e181]: 与 AI 搭档交流
          - button "任务管理 规划今日任务" [ref=e182]:
            - img [ref=e184]
            - generic [ref=e187]: 任务管理
            - generic [ref=e188]: 规划今日任务
          - button "番茄钟 开始专注" [ref=e189]:
            - img [ref=e191]
            - generic [ref=e194]: 番茄钟
            - generic [ref=e195]: 开始专注
          - button "笔记 记录想法" [ref=e196]:
            - img [ref=e198]
            - generic [ref=e201]: 笔记
            - generic [ref=e202]: 记录想法
        - generic [ref=e203]:
          - img [ref=e204]
          - generic [ref=e206]: 按 Ctrl+K 打开命令面板
```