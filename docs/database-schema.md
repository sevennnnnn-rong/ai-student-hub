# 数据库设计文档

## 数据库选型

- **开发环境**: SQLite（轻量、无需安装、文件存储）
- **生产环境**: PostgreSQL（如需扩展）

---

## 表结构设计

### 1. 任务表 (tasks)

存储用户创建的所有任务。

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,                          -- 任务标题（必填）
    description TEXT,                             -- 任务描述
    due_date DATETIME,                            -- 截止日期
    priority INTEGER DEFAULT 0,                   -- 优先级: 0=普通, 1=重要, 2=紧急
    status TEXT DEFAULT 'pending',                -- 状态: pending/in_progress/done
    category TEXT,                                -- 分类: 作业/考试/项目/其他
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 更新时间
);

-- 索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_category ON tasks(category);
```

**字段说明**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 主键，自增 |
| title | TEXT | NOT NULL | 任务标题 |
| description | TEXT | NULL | 任务描述，可选 |
| due_date | DATETIME | NULL | 截止日期，可选 |
| priority | INTEGER | DEFAULT 0 | 优先级: 0=普通, 1=重要, 2=紧急 |
| status | TEXT | DEFAULT 'pending' | 状态: pending/in_progress/done |
| category | TEXT | NULL | 分类: 作业/考试/项目/其他 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间，自动填充 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间，需手动更新 |

---

### 2. 番茄钟记录表 (pomodoro_sessions)

存储每次番茄钟的记录。

```sql
CREATE TABLE pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,                              -- 关联的任务ID（可选）
    start_time DATETIME NOT NULL,                 -- 开始时间
    end_time DATETIME,                            -- 结束时间
    duration_minutes INTEGER,                     -- 实际专注时长（分钟）
    planned_duration INTEGER DEFAULT 25,          -- 计划时长（分钟）
    completed BOOLEAN DEFAULT FALSE,              -- 是否完成
    notes TEXT,                                   -- 备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 创建时间
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_pomodoro_task_id ON pomodoro_sessions(task_id);
CREATE INDEX idx_pomodoro_start_time ON pomodoro_sessions(start_time);
CREATE INDEX idx_pomodoro_completed ON pomodoro_sessions(completed);
```

**字段说明**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 主键，自增 |
| task_id | INTEGER | FOREIGN KEY, NULL | 关联的任务ID，可选 |
| start_time | DATETIME | NOT NULL | 开始时间 |
| end_time | DATETIME | NULL | 结束时间 |
| duration_minutes | INTEGER | NULL | 实际专注时长（分钟） |
| planned_duration | INTEGER | DEFAULT 25 | 计划时长（分钟） |
| completed | BOOLEAN | DEFAULT FALSE | 是否完成整个番茄钟 |
| notes | TEXT | NULL | 备注，记录完成情况 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**外键关系**:
- `task_id` → `tasks.id`（ON DELETE SET NULL：任务删除时设为NULL）

---

### 3. 课程表 (courses)

存储课程信息。

```sql
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                           -- 课程名称（必填）
    teacher TEXT,                                 -- 教师姓名
    location TEXT,                                -- 上课地点
    day_of_week INTEGER NOT NULL,                 -- 星期几: 1=周一, 7=周日
    start_time TEXT NOT NULL,                     -- 开始时间 (HH:MM格式)
    end_time TEXT NOT NULL,                       -- 结束时间 (HH:MM格式)
    color TEXT DEFAULT '#3b82f6',                 -- 显示颜色（十六进制）
    semester TEXT,                                -- 学期标识
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 更新时间
);

-- 索引
CREATE INDEX idx_courses_day_of_week ON courses(day_of_week);
CREATE INDEX idx_courses_semester ON courses(semester);
```

**字段说明**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 主键，自增 |
| name | TEXT | NOT NULL | 课程名称 |
| teacher | TEXT | NULL | 教师姓名 |
| location | TEXT | NULL | 上课地点 |
| day_of_week | INTEGER | NOT NULL | 星期几: 1=周一, 2=周二, ..., 7=周日 |
| start_time | TEXT | NOT NULL | 开始时间，格式: "08:00" |
| end_time | TEXT | NOT NULL | 结束时间，格式: "09:40" |
| color | TEXT | DEFAULT '#3b82f6' | 显示颜色，十六进制格式 |
| semester | TEXT | NULL | 学期标识，如 "2024-spring" |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**注意**:
- `start_time` 和 `end_time` 使用 TEXT 类型存储 "HH:MM" 格式，方便前端显示
- `color` 默认蓝色，用户可自定义

---

### 4. 笔记表 (notes)

存储用户的笔记内容。

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,                          -- 笔记标题（必填）
    content TEXT,                                 -- 笔记内容（Markdown格式）
    task_id INTEGER,                              -- 关联的任务ID（可选）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,-- 更新时间
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_notes_task_id ON notes(task_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);
```

**字段说明**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 主键，自增 |
| title | TEXT | NOT NULL | 笔记标题 |
| content | TEXT | NULL | 笔记内容，Markdown格式 |
| task_id | INTEGER | FOREIGN KEY, NULL | 关联的任务ID，可选 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**外键关系**:
- `task_id` → `tasks.id`（ON DELETE SET NULL：任务删除时设为NULL）

---

### 5. AI对话记录表 (chat_messages) - 可选

如果需要持久化存储AI对话历史。

```sql
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,                -- 对话ID
    role TEXT NOT NULL,                           -- 角色: user/assistant
    content TEXT NOT NULL,                        -- 消息内容
    metadata TEXT,                                -- 元数据（JSON格式）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 索引
CREATE INDEX idx_chat_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at);
```

**字段说明**:
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 主键，自增 |
| conversation_id | TEXT | NOT NULL | 对话ID，用于关联同一对话 |
| role | TEXT | NOT NULL | 角色: user（用户）/ assistant（AI） |
| content | TEXT | NOT NULL | 消息内容 |
| metadata | TEXT | NULL | 元数据，JSON格式，存储额外信息 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

## SQLAlchemy 模型实现

### 基础模型类

```python
# app/models/base.py
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base

class BaseModel(Base):
    """基础模型类，包含通用字段"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

### 任务模型

```python
# app/models/task.py
from sqlalchemy import Column, String, Text, Integer, DateTime
from app.models.base import BaseModel

class Task(BaseModel):
    """任务模型"""
    __tablename__ = 'tasks'
    
    title = Column(String(200), nullable=False, comment='任务标题')
    description = Column(Text, nullable=True, comment='任务描述')
    due_date = Column(DateTime, nullable=True, comment='截止日期')
    priority = Column(Integer, default=0, comment='优先级: 0=普通, 1=重要, 2=紧急')
    status = Column(String(20), default='pending', comment='状态: pending/in_progress/done')
    category = Column(String(50), nullable=True, comment='分类: 作业/考试/项目/其他')
    
    def __repr__(self):
        return f'<Task {self.id}: {self.title}>'
```

### 番茄钟记录模型

```python
# app/models/pomodoro.py
from sqlalchemy import Column, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class PomodoroSession(BaseModel):
    """番茄钟记录模型"""
    __tablename__ = 'pomodoro_sessions'
    
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    start_time = Column(DateTime, nullable=False, comment='开始时间')
    end_time = Column(DateTime, nullable=True, comment='结束时间')
    duration_minutes = Column(Integer, nullable=True, comment='实际专注时长（分钟）')
    planned_duration = Column(Integer, default=25, comment='计划时长（分钟）')
    completed = Column(Boolean, default=False, comment='是否完成')
    notes = Column(Text, nullable=True, comment='备注')
    
    # 关联关系
    task = relationship('Task', backref='pomodoro_sessions')
    
    def __repr__(self):
        return f'<PomodoroSession {self.id}: {self.start_time}>'
```

### 课程模型

```python
# app/models/schedule.py
from sqlalchemy import Column, String, Integer
from app.models.base import BaseModel

class Course(BaseModel):
    """课程模型"""
    __tablename__ = 'courses'
    
    name = Column(String(100), nullable=False, comment='课程名称')
    teacher = Column(String(50), nullable=True, comment='教师姓名')
    location = Column(String(100), nullable=True, comment='上课地点')
    day_of_week = Column(Integer, nullable=False, comment='星期几: 1=周一, 7=周日')
    start_time = Column(String(10), nullable=False, comment='开始时间 (HH:MM)')
    end_time = Column(String(10), nullable=False, comment='结束时间 (HH:MM)')
    color = Column(String(20), default='#3b82f6', comment='显示颜色')
    semester = Column(String(20), nullable=True, comment='学期标识')
    
    def __repr__(self):
        return f'<Course {self.id}: {self.name}>'
```

### 笔记模型

```python
# app/models/note.py
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Note(BaseModel):
    """笔记模型"""
    __tablename__ = 'notes'
    
    title = Column(String(200), nullable=False, comment='笔记标题')
    content = Column(Text, nullable=True, comment='笔记内容（Markdown格式）')
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    
    # 关联关系
    task = relationship('Task', backref='notes')
    
    def __repr__(self):
        return f'<Note {self.id}: {self.title}>'
```

---

## 数据库初始化脚本

```python
# app/init_db.py
from app.database import engine, Base
from app.models.task import Task
from app.models.pomodoro import PomodoroSession
from app.models.schedule import Course
from app.models.note import Note

def init_database():
    """初始化数据库，创建所有表"""
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")

if __name__ == "__main__":
    init_database()
```

---

## 数据库迁移（可选）

如果使用 Alembic 进行数据库迁移：

```bash
# 初始化 Alembic
alembic init alembic

# 生成迁移脚本
alembic revision --autogenerate -m "initial migration"

# 执行迁移
alembic upgrade head
```

---

## 测试数据

### 插入测试数据的SQL

```sql
-- 插入测试任务
INSERT INTO tasks (title, description, due_date, priority, status, category) VALUES
('完成数学作业', '第三章习题1-10', '2024-01-15 23:59:59', 1, 'pending', '作业'),
('准备英语考试', '复习Unit 1-5', '2024-01-16 09:00:00', 2, 'pending', '考试'),
('写代码项目', '完成用户登录功能', '2024-01-20 23:59:59', 0, 'in_progress', '项目');

-- 插入测试课程
INSERT INTO courses (name, teacher, location, day_of_week, start_time, end_time, color, semester) VALUES
('高等数学', '张教授', '教学楼A301', 1, '08:00', '09:40', '#3b82f6', '2024-spring'),
('英语听说', '李老师', '外语楼B201', 2, '14:00', '15:40', '#10b981', '2024-spring'),
('数据结构', '王教授', '计算机楼C101', 3, '10:00', '11:40', '#f59e0b', '2024-spring');

-- 插入测试笔记
INSERT INTO notes (title, content, task_id) VALUES
('数学笔记', '# 微积分\n\n## 导数\n\n导数的定义...', 1),
('英语单词', '# Unit 1 单词\n\n- abandon: 放弃\n- ability: 能力', 2);
```

---

## 注意事项

1. **SQLite 限制**:
   - 不支持 ALTER TABLE 的某些操作
   - 并发写入性能有限（个人项目足够）
   - 日期时间存储为 TEXT 或 REAL

2. **外键约束**:
   - SQLite 默认不启用外键，需要在连接时设置 `PRAGMA foreign_keys = ON`
   - SQLAlchemy 会自动处理

3. **时间字段**:
   - 使用 `server_default=func.now()` 让数据库自动填充创建时间
   - 更新时间需要在业务逻辑中手动设置，或使用触发器

4. **字符编码**:
   - SQLite 默认使用 UTF-8，无需额外配置
   - 确保 Python 代码使用 UTF-8 编码
