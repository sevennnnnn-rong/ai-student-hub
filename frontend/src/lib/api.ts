// API layer with offline support and local-first data

import { putToStore, getAllFromStore, deleteFromStore } from './db'
import { enqueue, getPendingActions, markSynced, clearSynced } from './sync-queue'

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

// Online/offline detection
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine
  }
  return true
}

// Local data helpers
export async function getLocalData<T = any>(storeName: 'tasks' | 'courses' | 'notes' | 'pomodoroSessions'): Promise<T[]> {
  try {
    return await getAllFromStore<T>(storeName)
  } catch {
    return []
  }
}

export async function saveLocalData<T = any>(
  storeName: 'tasks' | 'courses' | 'notes' | 'pomodoroSessions',
  data: T[]
): Promise<void> {
  try {
    const { putManyToStore } = await import('./db')
    await putManyToStore(storeName, data)
  } catch (error) {
    console.error('Failed to save local data:', error)
  }
}

export async function saveLocalItem<T = any>(
  storeName: 'tasks' | 'courses' | 'notes' | 'pomodoroSessions',
  item: T
): Promise<void> {
  try {
    await putToStore(storeName, item)
  } catch (error) {
    console.error('Failed to save local item:', error)
  }
}

export async function deleteLocalItem(
  storeName: 'tasks' | 'courses' | 'notes' | 'pomodoroSessions',
  id: string | number
): Promise<void> {
  try {
    await deleteFromStore(storeName, id)
  } catch (error) {
    console.error('Failed to delete local item:', error)
  }
}

// Generic fetch with offline queue support
async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE'

  // For read operations, try online first, fall back to nothing
  if (method === 'GET') {
    if (!isOnline()) {
      throw new Error('OFFLINE')
    }
    try {
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
    } catch (error) {
      if (error instanceof Error && error.message === 'OFFLINE') throw error
      throw error
    }
  }

  // For write operations (POST, PUT, DELETE)
  if (isOnline()) {
    try {
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
    } catch (error) {
      // If online but request failed, queue it
      await enqueue({
        method,
        endpoint,
        body: options.body as string | undefined,
      })
      throw error
    }
  } else {
    // Offline: queue the action
    await enqueue({
      method,
      endpoint,
      body: options.body as string | undefined,
    })
    // Return a mock response for offline writes
    return { _offline: true, _queued: true }
  }
}

// Sync pending actions when back online
export async function syncPendingActions(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) return { synced: 0, failed: 0 }

  const pending = await getPendingActions()
  let synced = 0
  let failed = 0

  for (const action of pending) {
    try {
      const response = await fetch(`${getApiBase()}${action.endpoint}`, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: action.body,
      })

      if (response.ok) {
        if (action.id) await markSynced(action.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  // Clean up synced items
  await clearSynced()

  return { synced, failed }
}

// Task API
export const taskApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/tasks${query}`)
  },
  create: (data: any) => fetchApi('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/tasks/${id}`, { method: 'DELETE' }),
}

// Pomodoro API
export const pomodoroApi = {
  start: (data: any) => fetchApi('/pomodoro/start', { method: 'POST', body: JSON.stringify(data) }),
  stop: (id: number, data: any) => fetchApi(`/pomodoro/${id}/stop`, { method: 'POST', body: JSON.stringify(data) }),
  getSessions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi(`/pomodoro/sessions${query}`)
  },
  getStats: (period: string = 'today') => fetchApi(`/pomodoro/stats?period=${period}`),
}

// Schedule API
export const scheduleApi = {
  getAll: (semester?: string) => {
    const query = semester ? `?semester=${semester}` : ''
    return fetchApi(`/schedule${query}`)
  },
  create: (data: any) => fetchApi('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/schedule/${id}`, { method: 'DELETE' }),
}

// Notes API
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

// AI API
export const aiApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    fetchApi('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  parseTask: (text: string) => fetchApi('/ai/parse-task', { method: 'POST', body: JSON.stringify({ text }) }),
}
