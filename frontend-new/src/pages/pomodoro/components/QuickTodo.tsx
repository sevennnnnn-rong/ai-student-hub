import { useState, useEffect, useRef } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

const STORAGE_KEY = 'pomodoro_quick_todos'

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

interface QuickTodoProps {
  className?: string
}

export default function QuickTodo({ className }: QuickTodoProps) {
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos((prev) => [
      { id: Date.now().toString(), text, completed: false, createdAt: new Date().toISOString() },
      ...prev,
    ])
    setInput('')
    inputRef.current?.focus()
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTodo()
  }

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="heading-md text-text-primary">快速待办</h3>
        {totalCount > 0 && (
          <span className="caption text-text-muted">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="记录一个想法..."
          className="input-glass flex-1 text-sm"
        />
        <button
          onClick={addTodo}
          disabled={!input.trim()}
          className="btn btn-icon-md rounded-xl bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 disabled:opacity-30"
          aria-label="添加待办"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Todo list */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
        {todos.length === 0 ? (
          <p className="caption text-text-muted text-center py-6">
            专注时快速记录想法，不打断节奏
          </p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-xl group',
                'bg-white/[0.03] hover:bg-white/[0.06] transition-colors'
              )}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  todo.completed
                    ? 'bg-accent-success/20 border-accent-success/40 text-accent-success'
                    : 'border-white/15 hover:border-white/30 text-transparent'
                )}
                aria-label={todo.completed ? '标记未完成' : '标记完成'}
              >
                {todo.completed && <Check size={12} />}
              </button>
              <span
                className={cn(
                  'flex-1 text-sm leading-snug transition-all',
                  todo.completed
                    ? 'text-text-muted line-through'
                    : 'text-text-primary'
                )}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="btn-icon-sm opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-danger"
                aria-label="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
