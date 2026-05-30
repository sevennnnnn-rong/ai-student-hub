# 代码规范文档

## 概述

本文档定义了 AI Student Hub 项目的代码规范，请所有开发者严格遵守。

---

## Python 后端规范

### 1. 文件结构

```
backend/
├── app/
│   ├── __init__.py          # 空文件
│   ├── main.py              # 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── api/                 # API路由
│   │   ├── __init__.py
│   │   ├── deps.py          # 依赖注入
│   │   └── *.py             # 各模块路由
│   ├── models/              # 数据库模型
│   │   ├── __init__.py
│   │   ├── base.py          # 基础模型
│   │   └── *.py             # 各模块模型
│   ├── schemas/             # Pydantic模型
│   │   ├── __init__.py
│   │   └── *.py             # 各模块Schema
│   └── services/            # 业务逻辑
│       ├── __init__.py
│       └── *.py             # 各模块服务
└── requirements.txt
```

### 2. 命名规范

```python
# 文件名: 小写 + 下划线
task.py
pomodoro_session.py

# 类名: 大驼峰
class Task(BaseModel):
    pass

class PomodoroSession(BaseModel):
    pass

# 函数名/变量名: 小写 + 下划线
def get_tasks():
    pass

def create_task():
    pass

task_list = []
current_user = None

# 常量: 大写 + 下划线
MAX_RETRY_COUNT = 3
DEFAULT_PAGE_SIZE = 20

# 私有变量/函数: 单下划线前缀
def _internal_function():
    pass

_private_var = "secret"
```

### 3. 注释规范

```python
def create_task(task_data: TaskCreate, db: Session) -> Task:
    """
    创建新任务
    
    Args:
        task_data: 任务数据，包含标题、描述等
        db: 数据库会话
    
    Returns:
        Task: 创建成功的任务对象
    
    Raises:
        ValueError: 当任务标题为空时
    """
    if not task_data.title:
        raise ValueError("任务标题不能为空")
    
    # 创建任务记录
    task = Task(**task_data.model_dump())
    db.add(task)
    db.commit()
    
    return task
```

### 4. 导入顺序

```python
# 1. 标准库
import os
import sys
from datetime import datetime
from typing import List, Optional

# 2. 第三方库
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# 3. 本地模块
from app.config import settings
from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse
```

### 5. 异常处理

```python
from fastapi import HTTPException

# API 层使用 HTTPException
@router.get("/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task

# 服务层使用自定义异常
class TaskNotFoundError(Exception):
    """任务不存在异常"""
    pass

def get_task_or_raise(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise TaskNotFoundError(f"任务 {task_id} 不存在")
    return task
```

### 6. 类型提示

```python
from typing import List, Optional
from datetime import datetime

# 函数必须有类型提示
def get_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100
) -> List[Task]:
    """获取任务列表"""
    pass

# 变量声明类型
task_count: int = 0
task_list: List[Task] = []
created_at: Optional[datetime] = None
```

---

## TypeScript/React 前端规范

### 1. 文件结构

```
frontend/src/
├── app/                     # Next.js App Router
│   ├── (dashboard)/         # 主面板布局
│   │   ├── layout.tsx
│   │   ├── tasks/
│   │   │   └── page.tsx
│   │   └── ...
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
├── components/              # 组件
│   ├── ui/                  # 基础UI组件
│   ├── layout/              # 布局组件
│   └── *.tsx                # 业务组件
├── lib/                     # 工具函数
│   ├── api.ts               # API客户端
│   ├── utils.ts             # 通用工具
│   └── theme.ts             # 主题管理
└── styles/                  # 样式
    └── globals.css
```

### 2. 命名规范

```typescript
// 文件名: 小写 + 连字符 (kebab-case)
task-card.tsx
pomodoro-timer.tsx

// 组件名: 大驼峰
export function TaskCard() {}
export function PomodoroTimer() {}

// 函数名/变量名: 小驼峰
const getTasks = () => {}
const handleSubmit = () => {}
const taskList: Task[] = []

// 常量: 大写 + 下划线
const API_BASE_URL = 'http://localhost:8000/api'
const DEFAULT_TIMEOUT = 30000

// 接口/类型: 大驼峰，I前缀可选
interface Task {
  id: number
  title: string
}

type TaskStatus = 'pending' | 'in_progress' | 'done'

// 枚举: 大驼峰
enum Priority {
  Low = 0,
  Medium = 1,
  High = 2
}
```

### 3. 组件规范

```tsx
'use client'  // 客户端组件需要声明

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { taskApi } from '@/lib/api'

// Props 接口定义
interface TaskCardProps {
  task: Task
  onComplete: (id: number) => void
  onDelete: (id: number) => void
}

// 组件定义
export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  // 状态定义
  const [loading, setLoading] = useState(false)
  
  // 副作用
  useEffect(() => {
    // 初始化逻辑
  }, [])
  
  // 事件处理函数
  const handleComplete = async () => {
    setLoading(true)
    try {
      await onComplete(task.id)
    } finally {
      setLoading(false)
    }
  }
  
  // 渲染
  return (
    <div className="border rounded p-4">
      <h3>{task.title}</h3>
      <Button onClick={handleComplete} disabled={loading}>
        完成
      </Button>
    </div>
  )
}
```

### 4. Hook 规范

```typescript
// 自定义 Hook 以 use 开头
function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadTasks()
  }, [])
  
  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await taskApi.getAll()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }
  
  return { tasks, loading, error, refetch: loadTasks }
}
```

### 5. 样式规范

```tsx
// 使用 Tailwind CSS 类名
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
    标题
  </h1>
</div>

// 条件样式使用模板字符串
const className = `
  p-4 rounded
  ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100'}
  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
`

// 避免内联样式，除非必要
<div style={{ width: `${percentage}%` }} />
```

### 6. 状态管理

```typescript
// 使用 Zustand 进行全局状态管理
import { create } from 'zustand'

interface TaskStore {
  tasks: Task[]
  addTask: (task: Task) => void
  removeTask: (id: number) => void
  updateTask: (id: number, updates: Partial<Task>) => void
}

const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  removeTask: (id) => set((state) => ({ 
    tasks: state.tasks.filter(t => t.id !== id) 
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  }))
}))
```

---

## API 规范

### 1. 响应格式

```json
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 错误响应
{
  "code": 400,
  "message": "错误描述",
  "data": null
}

// 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 2. HTTP 方法

```
GET    /api/tasks          # 获取列表
POST   /api/tasks          # 创建
GET    /api/tasks/{id}     # 获取单个
PUT    /api/tasks/{id}     # 更新
DELETE /api/tasks/{id}     # 删除
```

### 3. 状态码

```
200 - 成功
201 - 创建成功
400 - 请求参数错误
404 - 资源不存在
422 - 数据验证失败
500 - 服务器内部错误
```

---

## 数据库规范

### 1. 表名

```sql
-- 小写 + 下划线
tasks
pomodoro_sessions
courses
notes
```

### 2. 字段名

```sql
-- 小写 + 下划线
id
title
created_at
updated_at
task_id
```

### 3. 索引

```sql
-- 主键自动索引
PRIMARY KEY (id)

-- 外键索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_pomodoro_task_id ON pomodoro_sessions(task_id);

-- 查询频繁的字段加索引
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

---

## Git 提交规范

### 1. 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2. Type 类型

```
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
test:     测试相关
chore:    构建/工具相关
```

### 3. 示例

```
feat(task): 添加任务优先级功能

- 支持设置任务优先级（普通/重要/紧急）
- 任务列表支持按优先级排序
- 更新任务卡片显示优先级标识

Closes #123
```

---

## 注释规范

### 1. 文件头注释

```python
"""
任务管理模块

包含任务的创建、查询、更新、删除等功能
"""
```

### 2. 函数注释

```python
def create_task(title: str, description: str = None) -> Task:
    """
    创建新任务
    
    Args:
        title: 任务标题
        description: 任务描述，可选
    
    Returns:
        Task: 创建成功的任务对象
    
    Raises:
        ValueError: 当标题为空时
    """
    pass
```

### 3. 行内注释

```python
# 计算任务完成率
completion_rate = completed_count / total_count * 100

# 如果没有设置截止日期，默认为一周后
if not due_date:
    due_date = datetime.now() + timedelta(days=7)
```

---

## 代码审查清单

### Python 后端

- [ ] 是否有类型提示？
- [ ] 是否有文档字符串？
- [ ] 是否处理了异常？
- [ ] 是否有 SQL 注入风险？
- [ ] 是否有敏感信息泄露？
- [ ] 是否遵循命名规范？

### React 前端

- [ ] 是否有 TypeScript 类型？
- [ ] 是否处理了 loading/error 状态？
- [ ] 是否支持深色模式？
- [ ] 是否响应式适配？
- [ ] 是否有内存泄漏（useEffect 清理）？
- [ ] 是否遵循命名规范？

---

## 工具配置

### ESLint (frontend/.eslintrc.json)

```json
{
  "extends": [
    "next/core-web-vitals",
    "typescript"
  ],
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier (frontend/.prettierrc)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Black (backend/pyproject.toml)

```toml
[tool.black]
line-length = 88
target-version = ['py39']
```

---

## 注意事项

1. **中文注释**：所有代码必须包含清晰的中文注释
2. **错误处理**：不要吞掉异常，要么处理要么抛出
3. **类型安全**：TypeScript 必须开启严格模式
4. **代码复用**：避免重复代码，提取公共函数/组件
5. **性能优化**：避免不必要的渲染和计算
