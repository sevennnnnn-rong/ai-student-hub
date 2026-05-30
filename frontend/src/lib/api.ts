const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// API 错误响应类型
interface ApiErrorResponse {
  message?: string
  detail?: string
}

// 任务状态联合类型
export type TaskStatus = 'pending' | 'in_progress' | 'done'

// 消息角色联合类型
export type MessageRole = 'user' | 'assistant'

export interface Task {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: number
  status: TaskStatus
  category: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string
  due_date?: string
  priority?: number
  category?: string
}

export interface TaskUpdate {
  title?: string
  description?: string | null
  due_date?: string | null
  priority?: number
  status?: TaskStatus
  category?: string | null
}

export interface Course {
  id: number
  name: string
  teacher: string | null
  location: string | null
  day_of_week: number
  start_time: string
  end_time: string
  color: string
  semester: string | null
}

export interface CourseCreate {
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
  content: string | null
  task_id: number | null
  created_at: string
}

export interface NoteCreate {
  title: string
  content?: string
  task_id?: number
}

export interface PomodoroSession {
  id: number
  task_id: number | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  planned_duration: number
  completed: boolean
  notes: string | null
  tags: string | null
}

export interface PomodoroStats {
  total_sessions: number
  completed_sessions: number
  total_minutes: number
  total_hours: number
  completion_rate: number
}

export interface PomodoroSettings {
  work_duration: number
  short_break: number
  long_break: number
  daily_goal: number
  long_break_interval: number
}

export interface DailyStats {
  date: string
  count: number
  minutes: number
}

export interface HourlyStats {
  hour: number
  count: number
}

export interface Conversation {
  id: number
  title: string
  message_count: number
  created_at: string
}

export interface ConversationMessage {
  id: number
  role: MessageRole
  content: string
}

export interface ChatResponse {
  response: string
  conversation_id: number
}

export interface Agent {
  name: string
  display_name: string
  description: string
  icon: string
}

// 带有响应体的请求
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorMsg = `请求失败 (${response.status})`
    try {
      const json: ApiErrorResponse = await response.json()
      errorMsg = json.message || json.detail || errorMsg
    } catch {
      // 响应体不是 JSON，使用默认错误信息
    }
    throw new Error(errorMsg)
  }

  // 204 No Content 或空响应体
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as unknown as T
  }

  let json: Record<string, unknown>
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('响应格式错误')
  }
  return (json.data as T) ?? (json as T)
}

// 无响应体的请求（DELETE 等）
async function fetchApiVoid(endpoint: string, options: RequestInit = {}): Promise<void> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorMsg = `请求失败 (${response.status})`
    try {
      const json: ApiErrorResponse = await response.json()
      errorMsg = json.message || json.detail || errorMsg
    } catch {
      // 响应体不是 JSON，使用默认错误信息
    }
    throw new Error(errorMsg)
  }
}

export const taskApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi<Task[]>(`/tasks${query}`)
  },
  create: (data: TaskCreate) => fetchApi<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: TaskUpdate) => fetchApi<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApiVoid(`/tasks/${id}`, { method: 'DELETE' }),
}

export const pomodoroApi = {
  start: (data: { task_id?: number; duration_minutes?: number; tags?: string }) =>
    fetchApi<PomodoroSession>('/pomodoro/start', { method: 'POST', body: JSON.stringify(data) }),
  stop: (id: number, data: { completed: boolean; notes?: string }) =>
    fetchApi<PomodoroSession>(`/pomodoro/${id}/stop`, { method: 'POST', body: JSON.stringify(data) }),
  getSessions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi<PomodoroSession[]>(`/pomodoro/sessions${query}`)
  },
  getStats: (period: string = 'today') =>
    fetchApi<PomodoroStats>(`/pomodoro/stats?period=${period}`),
  getDailyStats: (days: number = 7) =>
    fetchApi<DailyStats[]>(`/pomodoro/stats/daily?days=${days}`),
  getHourlyStats: () =>
    fetchApi<HourlyStats[]>('/pomodoro/stats/hourly'),
  getSettings: () =>
    fetchApi<PomodoroSettings>('/pomodoro/settings'),
  updateSettings: (data: Partial<PomodoroSettings>) =>
    fetchApi<PomodoroSettings>('/pomodoro/settings', { method: 'PUT', body: JSON.stringify(data) }),
}

export const scheduleApi = {
  getAll: (semester?: string) => {
    const query = semester ? `?semester=${semester}` : ''
    return fetchApi<Course[]>(`/schedule${query}`)
  },
  create: (data: CourseCreate) => fetchApi<Course>('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<CourseCreate>) => fetchApi<Course>(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApiVoid(`/schedule/${id}`, { method: 'DELETE' }),
  importPreview: (content: string) =>
    fetchApi<{ courses: CourseCreate[]; count: number }>('/schedule/import/preview', {
      method: 'POST',
      body: JSON.stringify({ content })
    }),
  importConfirm: (courses: CourseCreate[], semester?: string) =>
    fetchApi<{ imported: Course[]; count: number }>('/schedule/import/confirm', {
      method: 'POST',
      body: JSON.stringify(courses),
      headers: semester ? { 'X-Semester': semester } : {}
    }),
}

export const noteApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi<Note[]>(`/notes${query}`)
  },
  create: (data: NoteCreate) => fetchApi<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => fetchApi<Note>(`/notes/${id}`),
  update: (id: number, data: Partial<NoteCreate>) => fetchApi<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApiVoid(`/notes/${id}`, { method: 'DELETE' }),
}

export const conversationApi = {
  getAll: () => fetchApi<Conversation[]>('/conversations'),
  create: (data?: { title?: string }) => fetchApi<Conversation>('/conversations', { method: 'POST', body: JSON.stringify(data || {}) }),
  getMessages: (id: number) => fetchApi<ConversationMessage[]>(`/conversations/${id}/messages`),
  delete: (id: number) => fetchApiVoid(`/conversations/${id}`, { method: 'DELETE' }),
}

export const agentApi = {
  list: () => fetchApi<Agent[]>('/ai/agents'),
}

export const aiApi = {
  chat: (message: string, conversationId?: number, agent: string = 'deepseek') =>
    fetchApi<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId, agent }),
    }),
  chatStream: async function* (message: string, conversationId?: number, agent: string = 'deepseek') {
    const response = await fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId, agent }),
    })

    if (!response.ok) {
      throw new Error(`流式请求失败 (${response.status})`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          yield data
        }
      }
    }
  },
  parseTask: (text: string) => fetchApi<{ tasks: Array<{ title: string; due_date: string | null; category: string; priority: number }> }>('/ai/parse-task', { method: 'POST', body: JSON.stringify({ text }) }),
}
