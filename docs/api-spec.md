# API 接口规范

## 基础信息

- **Base URL**: `http://localhost:8000/api`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

---

## 统一响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误描述信息",
  "data": null
}
```

### 分页响应
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

---

## 1. 任务管理接口

### 1.1 获取任务列表

**GET** `/api/tasks`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 筛选状态: pending/in_progress/done |
| category | string | 否 | 筛选分类: 作业/考试/项目/其他 |
| priority | integer | 否 | 筛选优先级: 0/1/2 |
| sort_by | string | 否 | 排序字段: due_date/priority/created_at |
| sort_order | string | 否 | 排序方式: asc/desc |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "完成数学作业",
      "description": "第三章习题",
      "due_date": "2024-01-15T23:59:59",
      "priority": 1,
      "status": "pending",
      "category": "作业",
      "created_at": "2024-01-10T10:00:00",
      "updated_at": "2024-01-10T10:00:00"
    }
  ]
}
```

### 1.2 创建任务

**POST** `/api/tasks`

**请求体**:
```json
{
  "title": "完成数学作业",
  "description": "第三章习题",
  "due_date": "2024-01-15T23:59:59",
  "priority": 1,
  "category": "作业"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| description | string | 否 | 任务描述 |
| due_date | datetime | 否 | 截止日期 |
| priority | integer | 否 | 优先级: 0=普通, 1=重要, 2=紧急，默认0 |
| category | string | 否 | 分类: 作业/考试/项目/其他 |

**响应示例**:
```json
{
  "code": 200,
  "message": "任务创建成功",
  "data": {
    "id": 1,
    "title": "完成数学作业",
    "description": "第三章习题",
    "due_date": "2024-01-15T23:59:59",
    "priority": 1,
    "status": "pending",
    "category": "作业",
    "created_at": "2024-01-10T10:00:00",
    "updated_at": "2024-01-10T10:00:00"
  }
}
```

### 1.3 获取单个任务

**GET** `/api/tasks/{task_id}`

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| task_id | integer | 任务ID |

**响应**: 同任务对象结构

### 1.4 更新任务

**PUT** `/api/tasks/{task_id}`

**请求体**（所有字段可选）:
```json
{
  "title": "更新后的标题",
  "status": "in_progress",
  "priority": 2
}
```

**响应**: 返回更新后的任务对象

### 1.5 删除任务

**DELETE** `/api/tasks/{task_id}`

**响应**:
```json
{
  "code": 200,
  "message": "任务删除成功",
  "data": null
}
```

### 1.6 批量更新任务状态

**PATCH** `/api/tasks/batch-status`

**请求体**:
```json
{
  "task_ids": [1, 2, 3],
  "status": "done"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "批量更新成功",
  "data": {
    "updated_count": 3
  }
}
```

---

## 2. 番茄钟接口

### 2.1 开始番茄钟

**POST** `/api/pomodoro/start`

**请求体**:
```json
{
  "task_id": 1,
  "duration_minutes": 25
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | integer | 否 | 关联的任务ID |
| duration_minutes | integer | 否 | 计划时长（分钟），默认25 |

**响应**:
```json
{
  "code": 200,
  "message": "番茄钟已开始",
  "data": {
    "id": 1,
    "task_id": 1,
    "start_time": "2024-01-10T10:00:00",
    "duration_minutes": 25,
    "completed": false
  }
}
```

### 2.2 停止番茄钟

**POST** `/api/pomodoro/{session_id}/stop`

**请求体**:
```json
{
  "completed": true,
  "notes": "完成了大部分内容"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "番茄钟已结束",
  "data": {
    "id": 1,
    "task_id": 1,
    "start_time": "2024-01-10T10:00:00",
    "end_time": "2024-01-10T10:25:00",
    "duration_minutes": 25,
    "completed": true,
    "notes": "完成了大部分内容"
  }
}
```

### 2.3 获取番茄钟记录

**GET** `/api/pomodoro/sessions`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | integer | 否 | 按任务筛选 |
| date | string | 否 | 按日期筛选 (YYYY-MM-DD) |

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "task_id": 1,
      "task_title": "完成数学作业",
      "start_time": "2024-01-10T10:00:00",
      "end_time": "2024-01-10T10:25:00",
      "duration_minutes": 25,
      "completed": true,
      "notes": "完成了大部分内容"
    }
  ]
}
```

### 2.4 获取番茄钟统计

**GET** `/api/pomodoro/stats`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 统计周期: today/week/month，默认today |

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_sessions": 8,
    "completed_sessions": 7,
    "total_minutes": 175,
    "total_hours": 2.92,
    "completion_rate": 87.5,
    "daily_breakdown": [
      {
        "date": "2024-01-10",
        "sessions": 4,
        "minutes": 100
      },
      {
        "date": "2024-01-09",
        "sessions": 3,
        "minutes": 75
      }
    ]
  }
}
```

---

## 3. 课程表接口

### 3.1 获取课程列表

**GET** `/api/schedule`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| semester | string | 否 | 学期标识，如 "2024-spring" |

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "高等数学",
      "teacher": "张教授",
      "location": "教学楼A301",
      "day_of_week": 1,
      "start_time": "08:00",
      "end_time": "09:40",
      "color": "#3b82f6",
      "semester": "2024-spring"
    }
  ]
}
```

### 3.2 创建课程

**POST** `/api/schedule`

**请求体**:
```json
{
  "name": "高等数学",
  "teacher": "张教授",
  "location": "教学楼A301",
  "day_of_week": 1,
  "start_time": "08:00",
  "end_time": "09:40",
  "color": "#3b82f6",
  "semester": "2024-spring"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 课程名称 |
| teacher | string | 否 | 教师姓名 |
| location | string | 否 | 上课地点 |
| day_of_week | integer | 是 | 星期几: 1=周一, 7=周日 |
| start_time | string | 是 | 开始时间 (HH:MM) |
| end_time | string | 是 | 结束时间 (HH:MM) |
| color | string | 否 | 显示颜色 (十六进制) |
| semester | string | 否 | 学期标识 |

**响应**: 返回创建的课程对象

### 3.3 更新课程

**PUT** `/api/schedule/{course_id}`

**请求体**: 同创建课程，所有字段可选

**响应**: 返回更新后的课程对象

### 3.4 删除课程

**DELETE** `/api/schedule/{course_id}`

**响应**:
```json
{
  "code": 200,
  "message": "课程删除成功",
  "data": null
}
```

---

## 4. 笔记接口

### 4.1 获取笔记列表

**GET** `/api/notes`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | integer | 否 | 按关联任务筛选 |
| keyword | string | 否 | 搜索关键词 |

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "数学笔记",
      "content": "# 微积分\n\n...",
      "task_id": 1,
      "created_at": "2024-01-10T10:00:00",
      "updated_at": "2024-01-10T10:00:00"
    }
  ]
}
```

### 4.2 创建笔记

**POST** `/api/notes`

**请求体**:
```json
{
  "title": "数学笔记",
  "content": "# 微积分\n\n导数的定义...",
  "task_id": 1
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 笔记标题 |
| content | string | 否 | 笔记内容（Markdown格式） |
| task_id | integer | 否 | 关联的任务ID |

**响应**: 返回创建的笔记对象

### 4.3 获取单个笔记

**GET** `/api/notes/{note_id}`

**响应**: 返回笔记对象（包含完整内容）

### 4.4 更新笔记

**PUT** `/api/notes/{note_id}`

**请求体**: 同创建笔记，所有字段可选

**响应**: 返回更新后的笔记对象

### 4.5 删除笔记

**DELETE** `/api/notes/{note_id}`

**响应**:
```json
{
  "code": 200,
  "message": "笔记删除成功",
  "data": null
}
```

---

## 5. AI对话接口

### 5.1 发送消息

**POST** `/api/ai/chat`

**请求体**:
```json
{
  "message": "帮我创建一个明天交的数学作业任务",
  "conversation_id": "optional-conversation-id"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息 |
| conversation_id | string | 否 | 对话ID（用于多轮对话） |

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "response": "好的，我帮你创建一个数学作业任务。",
    "conversation_id": "conv-123",
    "action": {
      "type": "create_task",
      "data": {
        "title": "数学作业",
        "due_date": "2024-01-11T23:59:59",
        "category": "作业"
      }
    }
  }
}
```

### 5.2 AI任务解析

**POST** `/api/ai/parse-task`

**请求体**:
```json
{
  "text": "明天下午3点前要交数学作业，还有后天的英语考试要准备"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tasks": [
      {
        "title": "交数学作业",
        "due_date": "2024-01-11T15:00:00",
        "category": "作业",
        "priority": 1
      },
      {
        "title": "准备英语考试",
        "due_date": "2024-01-12T00:00:00",
        "category": "考试",
        "priority": 2
      }
    ]
  }
}
```

### 5.3 AI文档总结

**POST** `/api/ai/summarize`

**请求体**:
```json
{
  "content": "这是一篇很长的文档内容...",
  "max_length": 200
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "summary": "本文主要讨论了...",
    "key_points": [
      "要点1",
      "要点2",
      "要点3"
    ]
  }
}
```

### 5.4 获取对话历史

**GET** `/api/ai/history`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conversation_id | string | 否 | 对话ID |

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "role": "user",
      "content": "帮我创建任务",
      "timestamp": "2024-01-10T10:00:00"
    },
    {
      "role": "assistant",
      "content": "好的，请问是什么任务？",
      "timestamp": "2024-01-10T10:00:01"
    }
  ]
}
```

---

## 错误码参考

| 错误码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | 成功 | 正常请求 |
| 400 | 请求参数错误 | 缺少必填字段、字段类型错误 |
| 404 | 资源不存在 | 任务ID不存在 |
| 422 | 数据验证失败 | 日期格式错误 |
| 500 | 服务器内部错误 | 数据库连接失败、AI服务异常 |

---

## 调用示例

### cURL 示例

```bash
# 创建任务
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "完成数学作业", "category": "作业", "due_date": "2024-01-15T23:59:59"}'

# 获取任务列表
curl http://localhost:8000/api/tasks?status=pending

# 开始番茄钟
curl -X POST http://localhost:8000/api/pomodoro/start \
  -H "Content-Type: application/json" \
  -d '{"task_id": 1, "duration_minutes": 25}'

# AI对话
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "帮我创建一个明天交的数学作业任务"}'
```

### JavaScript 示例

```typescript
// 创建任务
const response = await fetch('http://localhost:8000/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '完成数学作业',
    category: '作业',
    due_date: '2024-01-15T23:59:59'
  })
});
const data = await response.json();

// 获取任务列表
const tasks = await fetch('http://localhost:8000/api/tasks?status=pending');
const tasksData = await tasks.json();
```

---

## 注意事项

1. **日期格式**: 所有日期时间字段使用 ISO 8601 格式 (`YYYY-MM-DDTHH:MM:SS`)
2. **时区**: 默认使用服务器本地时区
3. **字符编码**: 所有接口使用 UTF-8 编码
4. **分页**: 列表接口默认返回所有数据，后续可添加分页支持
5. **排序**: 默认按创建时间倒序排列
