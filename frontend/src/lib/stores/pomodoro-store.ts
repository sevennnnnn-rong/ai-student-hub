// Pomodoro store using useSyncExternalStore pattern

import { useSyncExternalStore } from 'react'
import { pomodoroApi } from '../api'
import { getAllFromStore, putToStore, putManyToStore } from '../db'

export interface PomodoroSession {
  id: number
  task_id: number | null
  task_title?: string
  duration_minutes: number
  completed: boolean
  started_at: string
  ended_at: string | null
  synced?: boolean
}

export interface PomodoroStats {
  completed_sessions: number
  total_hours: number
  completion_rate: number
}

interface PomodoroState {
  sessions: PomodoroSession[]
  stats: PomodoroStats | null
  activeSession: PomodoroSession | null
  loading: boolean
  error: string | null
}

let state: PomodoroState = {
  sessions: [],
  stats: null,
  activeSession: null,
  loading: false,
  error: null,
}

let listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

function setState(partial: Partial<PomodoroState>) {
  state = { ...state, ...partial }
  notify()
}

const storeActions = {
  loadSessions: async (params?: Record<string, string>) => {
    setState({ loading: true, error: null })
    try {
      const localSessions = await getAllFromStore<PomodoroSession>('pomodoroSessions')
      if (localSessions.length > 0) {
        const sorted = localSessions.sort((a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )
        setState({ sessions: sorted, loading: false })
        pomodoroApi.getSessions(params).then(async (remoteSessions: PomodoroSession[]) => {
          if (Array.isArray(remoteSessions)) {
            const sessionsWithSync = remoteSessions.map(s => ({ ...s, synced: true }))
            await putManyToStore('pomodoroSessions', sessionsWithSync)
            setState({ sessions: sessionsWithSync })
          }
        }).catch(() => {})
      } else {
        const sessions = await pomodoroApi.getSessions(params)
        const sessionsWithSync = Array.isArray(sessions) ? sessions.map(s => ({ ...s, synced: true })) : []
        await putManyToStore('pomodoroSessions', sessionsWithSync)
        setState({ sessions: sessionsWithSync, loading: false })
      }
    } catch (error) {
      try {
        const localSessions = await getAllFromStore<PomodoroSession>('pomodoroSessions')
        setState({ sessions: localSessions, loading: false, error: 'Using offline data' })
      } catch {
        setState({ loading: false, error: 'Failed to load sessions' })
      }
    }
  },

  loadStats: async (period: string = 'today') => {
    try {
      const data = await pomodoroApi.getStats(period)
      setState({ stats: data.data || data })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  },

  startSession: async (data: { task_id?: number | null; duration_minutes: number }): Promise<PomodoroSession> => {
    try {
      const session = await pomodoroApi.start(data)
      const newSession = { ...session, synced: true }
      await putToStore('pomodoroSessions', newSession)
      setState({
        activeSession: newSession,
        sessions: [newSession, ...state.sessions]
      })
      return newSession
    } catch (error) {
      const tempId = Date.now()
      const newSession: PomodoroSession = {
        id: tempId,
        task_id: data.task_id || null,
        duration_minutes: data.duration_minutes,
        completed: false,
        started_at: new Date().toISOString(),
        ended_at: null,
        synced: false,
      }
      await putToStore('pomodoroSessions', newSession)
      setState({
        activeSession: newSession,
        sessions: [newSession, ...state.sessions]
      })
      return newSession
    }
  },

  stopSession: async (id: number, data: { completed: boolean }): Promise<void> => {
    try {
      await pomodoroApi.stop(id, data)
      const updatedSessions = state.sessions.map(s =>
        s.id === id ? { ...s, completed: data.completed, ended_at: new Date().toISOString(), synced: true } : s
      )
      await putToStore('pomodoroSessions', { id, completed: data.completed, ended_at: new Date().toISOString(), synced: true } as PomodoroSession)
      setState({
        activeSession: null,
        sessions: updatedSessions
      })
      // Refresh stats
      await storeActions.loadStats()
    } catch (error) {
      const updatedSessions = state.sessions.map(s =>
        s.id === id ? { ...s, completed: data.completed, ended_at: new Date().toISOString(), synced: false } : s
      )
      await putToStore('pomodoroSessions', { id, completed: data.completed, ended_at: new Date().toISOString(), synced: false } as PomodoroSession)
      setState({
        activeSession: null,
        sessions: updatedSessions
      })
    }
  },

  setActiveSession: (session: PomodoroSession | null) => {
    setState({ activeSession: session })
  },
}

// Server-safe initial state
const serverState: PomodoroState = {
  sessions: [],
  stats: null,
  activeSession: null,
  loading: false,
  error: null,
}

export function usePomodoroStore() {
  const pomodoroState = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => serverState
  )

  return {
    ...pomodoroState,
    ...storeActions,
  }
}
