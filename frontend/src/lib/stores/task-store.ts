// Task store using useSyncExternalStore pattern

import { useSyncExternalStore, useCallback } from 'react'
import { taskApi } from '../api'
import { getAllFromStore, putToStore, putManyToStore, deleteFromStore } from '../db'

export interface Task {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: number
  status: string
  category: string | null
  created_at: string
  updated_at?: string
  synced?: boolean
}

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
}

// Module-level state
let state: TaskState = {
  tasks: [],
  loading: false,
  error: null,
}

let listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

function setState(partial: Partial<TaskState>) {
  state = { ...state, ...partial }
  notify()
}

// Store methods (can be called from anywhere)
const storeActions = {
  loadTasks: async () => {
    setState({ loading: true, error: null })
    try {
      // Try to load from IndexedDB first
      const localTasks = await getAllFromStore<Task>('tasks')
      if (localTasks.length > 0) {
        setState({ tasks: localTasks, loading: false })
        // Refresh from API in background
        taskApi.getAll().then(async (remoteTasks: Task[]) => {
          if (Array.isArray(remoteTasks)) {
            const tasksWithSync = remoteTasks.map(t => ({ ...t, synced: true }))
            await putManyToStore('tasks', tasksWithSync)
            setState({ tasks: tasksWithSync })
          }
        }).catch(() => {})
      } else {
        // No local data, fetch from API
        const tasks = await taskApi.getAll()
        const tasksWithSync = Array.isArray(tasks) ? tasks.map(t => ({ ...t, synced: true })) : []
        await putManyToStore('tasks', tasksWithSync)
        setState({ tasks: tasksWithSync, loading: false })
      }
    } catch (error) {
      // Try loading from IndexedDB as fallback
      try {
        const localTasks = await getAllFromStore<Task>('tasks')
        setState({ tasks: localTasks, loading: false, error: 'Using offline data' })
      } catch {
        setState({ loading: false, error: 'Failed to load tasks' })
      }
    }
  },

  addTask: async (data: Partial<Task>): Promise<Task> => {
    try {
      const task = await taskApi.create(data)
      const newTask = { ...task, synced: true }
      await putToStore('tasks', newTask)
      setState({ tasks: [newTask, ...state.tasks] })
      return newTask
    } catch (error) {
      // Offline: create locally with temp ID
      const tempId = Date.now()
      const newTask: Task = {
        id: tempId,
        title: data.title || '',
        description: data.description || null,
        due_date: data.due_date || null,
        priority: data.priority || 0,
        status: 'pending',
        category: data.category || null,
        created_at: new Date().toISOString(),
        synced: false,
      }
      await putToStore('tasks', newTask)
      setState({ tasks: [newTask, ...state.tasks] })
      return newTask
    }
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<void> => {
    // Optimistic update
    const updatedTasks = state.tasks.map(t =>
      t.id === id ? { ...t, ...data, synced: false } : t
    )
    setState({ tasks: updatedTasks })

    try {
      const updated = await taskApi.update(id, data)
      const syncedTask = { ...updated, synced: true }
      await putToStore('tasks', syncedTask)
      setState({
        tasks: state.tasks.map(t => t.id === id ? syncedTask : t)
      })
    } catch (error) {
      // Keep optimistic update, mark as unsynced
      await putToStore('tasks', { ...data, id, synced: false } as Task)
    }
  },

  deleteTask: async (id: number): Promise<void> => {
    // Optimistic update
    setState({ tasks: state.tasks.filter(t => t.id !== id) })

    try {
      await taskApi.delete(id)
      await deleteFromStore('tasks', id)
    } catch (error) {
      // Keep optimistic delete, queue for sync
      const { enqueue } = await import('../sync-queue')
      await enqueue({ method: 'DELETE', endpoint: `/tasks/${id}` })
    }
  },

  getTaskById: (id: number): Task | undefined => {
    return state.tasks.find(t => t.id === id)
  },
}

// Server-safe initial state
const serverState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
}

// React hook that returns state + actions
export function useTaskStore() {
  const taskState = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => serverState
  )

  return {
    ...taskState,
    ...storeActions,
  }
}
