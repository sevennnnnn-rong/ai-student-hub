export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

interface RawTask {
  id: number
  title: string
  description?: string
  priority: number
  status: string
  due_date?: string
  created_at: string
  updated_at: string
}

// Priority mapping: backend uses int (0-2), frontend uses string
const priorityIntToString: Record<number, 'low' | 'medium' | 'high'> = { 0: 'low', 1: 'medium', 2: 'high' }
const priorityStringToInt: Record<string, number> = { low: 0, medium: 1, high: 2 }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || '请求失败')
  }
  const json = await res.json()
  return json.data ?? json
}

// ===== Agents =====
export const agentApi = {
  list: () => request<AgentInfo[]>('/api/ai/agents'),
}

// ===== Chat =====
export const chatApi = {
  send: (message: string, agent: string, conversationId?: number) =>
    request<{ response: string; conversation_id: number }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, agent, conversation_id: conversationId }),
    }),
  stream: async function* (message: string, agent: string, conversationId?: number) {
    const res = await fetch(`${API_BASE}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, agent, conversation_id: conversationId }),
    })
    if (!res.body) throw new Error('No response body')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          yield data
        }
      }
    }
  },
}

// ===== Conversations =====
export const conversationApi = {
  list: () => request<Conversation[]>('/api/conversations'),
  create: (title?: string) =>
    request<{ id: number; title: string }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  messages: (id: number) =>
    request<ChatMessage[]>(`/api/conversations/${id}/messages`),
  delete: (id: number) =>
    request<void>(`/api/conversations/${id}`, { method: 'DELETE' }),
}

// ===== Tasks =====
function mapTaskPriority(task: RawTask): Task {
  return {
    ...task,
    priority: priorityIntToString[task.priority] ?? 'medium',
    status: task.status as Task['status'],
  }
}

export const taskApi = {
  getAll: () => request<RawTask[]>('/api/tasks').then((tasks) => tasks.map(mapTaskPriority)),
  create: (task: Partial<Task>) => {
    const { priority: p, ...rest } = task
    const payload: Record<string, unknown> = { ...rest }
    if (p != null) payload.priority = priorityStringToInt[p] ?? 1
    return request<RawTask>('/api/tasks', { method: 'POST', body: JSON.stringify(payload) }).then(mapTaskPriority)
  },
  update: (id: number, task: Partial<Task>) => {
    const { priority: p, ...rest } = task
    const payload: Record<string, unknown> = { ...rest }
    if (p != null) payload.priority = priorityStringToInt[p] ?? 1
    return request<RawTask>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(mapTaskPriority)
  },
  delete: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
}

// ===== Pomodoro =====
export const pomodoroApi = {
  getStats: (period: string) => request<PomodoroStats>(`/api/pomodoro/stats?period=${period}`),
  getDailyStats: (days: number) => request<DailyStats[]>(`/api/pomodoro/stats/daily?days=${days}`),
  getHourlyStats: () => request<HourlyStats[]>('/api/pomodoro/stats/hourly'),
  start: (taskId?: number) =>
    request<any>('/api/pomodoro/start', { method: 'POST', body: JSON.stringify({ task_id: taskId }) }),
  stop: () => request<any>('/api/pomodoro/stop', { method: 'POST' }),
}

// ===== Schedule =====
export const scheduleApi = {
  getAll: (semester?: string) =>
    request<Course[]>(`/api/schedule${semester ? `?semester=${semester}` : ''}`),
  create: (course: Partial<Course>) =>
    request<Course>('/api/schedule', { method: 'POST', body: JSON.stringify(course) }),
  update: (id: number, course: Partial<Course>) =>
    request<Course>(`/api/schedule/${id}`, { method: 'PUT', body: JSON.stringify(course) }),
  delete: (id: number) =>
    request<void>(`/api/schedule/${id}`, { method: 'DELETE' }),
}

// ===== Notes =====
export const noteApi = {
  getAll: (keyword?: string) =>
    request<Note[]>(`/api/notes${keyword ? `?keyword=${keyword}` : ''}`),
  create: (note: Partial<Note>) =>
    request<Note>('/api/notes', { method: 'POST', body: JSON.stringify(note) }),
  update: (id: number, note: Partial<Note>) =>
    request<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) }),
  delete: (id: number) =>
    request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
}

// ===== Types =====
export interface AgentInfo {
  name: string
  display_name: string
  description: string
  icon: string
}

export interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Task {
  id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  updated_at: string
}

export interface PomodoroStats {
  total_minutes: number
  total_sessions: number
  today_minutes: number
}

export interface DailyStats {
  date: string
  minutes: number
  sessions: number
}

export interface HourlyStats {
  hour: number
  count: number
}

export interface Course {
  id: number
  name: string
  teacher?: string
  location?: string
  day_of_week: number
  start_time: string
  end_time: string
  color?: string
  semester?: string
}

export interface Note {
  id: number
  title: string
  content: string
  task_id?: number
  created_at: string
  updated_at: string
}
