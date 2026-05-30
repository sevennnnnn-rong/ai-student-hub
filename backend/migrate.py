"""
数据库迁移脚本
处理 schema 变更：日期字段类型 + 索引 + 对话表
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'app', 'student_hub.db')


def migrate():
    if not os.path.exists(DB_PATH):
        print("数据库不存在，跳过迁移（将在启动时自动创建）")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. 迁移 tasks.due_date: String -> DateTime
        print("迁移 tasks.due_date ...")
        cursor.execute("PRAGMA table_info(tasks)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        if columns.get('due_date') == 'VARCHAR(30)':
            cursor.execute("""
                CREATE TABLE tasks_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    due_date DATETIME,
                    priority INTEGER DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'pending',
                    category VARCHAR(50),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                INSERT INTO tasks_new (id, title, description, priority, status, category, created_at, updated_at)
                SELECT id, title, description, priority, status, category, created_at, updated_at FROM tasks
            """)
            cursor.execute("DROP TABLE tasks")
            cursor.execute("ALTER TABLE tasks_new RENAME TO tasks")
            print("  tasks.due_date 迁移完成")

        # 2. 迁移 pomodoro_sessions: String -> DateTime
        print("迁移 pomodoro_sessions ...")
        cursor.execute("PRAGMA table_info(pomodoro_sessions)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        if columns.get('start_time') == 'VARCHAR(30)':
            cursor.execute("""
                CREATE TABLE pomodoro_sessions_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id INTEGER,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    duration_minutes INTEGER,
                    planned_duration INTEGER DEFAULT 25,
                    completed BOOLEAN DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
                )
            """)
            cursor.execute("""
                INSERT INTO pomodoro_sessions_new
                (id, task_id, duration_minutes, planned_duration, completed, notes, created_at, updated_at)
                SELECT id, task_id, duration_minutes, planned_duration, completed, notes, created_at, updated_at
                FROM pomodoro_sessions
            """)
            cursor.execute("DROP TABLE pomodoro_sessions")
            cursor.execute("ALTER TABLE pomodoro_sessions_new RENAME TO pomodoro_sessions")
            print("  pomodoro_sessions 时间字段迁移完成")

        # 3. 创建 conversations 表
        print("创建 conversations 表 ...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(200) DEFAULT '新对话',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 4. 创建 conversation_messages 表
        print("创建 conversation_messages 表 ...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversation_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        """)

        # 5. 添加索引
        print("添加索引 ...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks(status)",
            "CREATE INDEX IF NOT EXISTS ix_tasks_category ON tasks(category)",
            "CREATE INDEX IF NOT EXISTS ix_tasks_due_date ON tasks(due_date)",
            "CREATE INDEX IF NOT EXISTS ix_tasks_priority ON tasks(priority)",
            "CREATE INDEX IF NOT EXISTS ix_pomodoro_task_id ON pomodoro_sessions(task_id)",
            "CREATE INDEX IF NOT EXISTS ix_pomodoro_completed ON pomodoro_sessions(completed)",
            "CREATE INDEX IF NOT EXISTS ix_notes_task_id ON notes(task_id)",
            "CREATE INDEX IF NOT EXISTS ix_courses_semester ON courses(semester)",
            "CREATE INDEX IF NOT EXISTS ix_courses_day_of_week ON courses(day_of_week)",
            "CREATE INDEX IF NOT EXISTS ix_conv_messages_conv_id ON conversation_messages(conversation_id)",
        ]
        for idx_sql in indexes:
            cursor.execute(idx_sql)
        print("  索引创建完成")

        conn.commit()
        print("迁移完成！")

    except Exception as e:
        conn.rollback()
        print(f"迁移失败: {e}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
