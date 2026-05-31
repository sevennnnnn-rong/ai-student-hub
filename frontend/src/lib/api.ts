function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl) return envUrl

  // Capacitor / native: use stored config or default
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('api_base_url')
    if (stored) return stored
    // In Capacitor, window.location.origin is the app scheme
    // Default to localhost for web dev
    return 'http://localhost:8000/api'
  }
  return 'http://localhost:8000/api'
}

export function setApiBase(url: string) {
  localStorage.setItem('api_base_url', url)
}

export function getApiUrl() {
  return getApiBase()
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `API error: ${response.status}`
    try {
      const body = await response.json()
      if (body.detail) message = body.detail
    } catch {}
    throw new Error(message)
  }

  return response.json()
}

export const taskApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/tasks${query}`)
  },
  create: (data: any) => fetchApi('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/tasks/${id}`, { method: 'DELETE' }),
}

export const pomodoroApi = {
  start: (data: any) => fetchApi('/pomodoro/start', { method: 'POST', body: JSON.stringify(data) }),
  stop: (id: number, data: any) => fetchApi(`/pomodoro/${id}/stop`, { method: 'POST', body: JSON.stringify(data) }),
  getSessions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/pomodoro/sessions${query}`)
  },
  getStats: (period: string = 'today') => fetchApi(`/pomodoro/stats?period=${period}`),
}

export const scheduleApi = {
  getAll: (semester?: string) => {
    const query = semester ? `?semester=${semester}` : ''
    return fetchApi(`/schedule${query}`)
  },
  create: (data: any) => fetchApi('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/schedule/${id}`, { method: 'DELETE' }),
}

export const noteApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/notes${query}`)
  },
  create: (data: any) => fetchApi('/notes', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => fetchApi(`/notes/${id}`),
  update: (id: number, data: any) => fetchApi(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/notes/${id}`, { method: 'DELETE' }),
}

export const aiApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    fetchApi('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  parseTask: (text: string) => fetchApi('/ai/parse-task', { method: 'POST', body: JSON.stringify({ text }) }),
}
