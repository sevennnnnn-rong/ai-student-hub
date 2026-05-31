// Sync manager for coordinating online/offline data synchronization

import { getLocalData, saveLocalData, syncPendingActions, isOnline } from './api'
import { getAllFromStore, putManyToStore } from './db'

type StoreName = 'tasks' | 'courses' | 'notes' | 'pomodoroSessions'

interface SyncCallbacks {
  onSyncStart?: () => void
  onSyncComplete?: (result: { synced: number; failed: number }) => void
  onOnline?: () => void
  onOffline?: () => void
}

let callbacks: SyncCallbacks = {}
let isInitialized = false
let syncInterval: ReturnType<typeof setInterval> | null = null

export function initSync(cbs: SyncCallbacks = {}): void {
  if (isInitialized) return
  isInitialized = true

  callbacks = cbs

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  // Periodic sync attempt (every 30 seconds)
  syncInterval = setInterval(async () => {
    if (isOnline()) {
      await syncPendingActions()
    }
  }, 30000)
}

export function destroySync(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }

  isInitialized = false
}

function handleOnline(): void {
  callbacks.onOnline?.()
  // Attempt to sync when coming back online
  syncPendingActions().then(result => {
    callbacks.onSyncComplete?.(result)
  })
}

function handleOffline(): void {
  callbacks.onOffline?.()
}

// Initial data load from backend to IndexedDB
export async function loadInitialData(): Promise<void> {
  if (!isOnline()) return

  callbacks.onSyncStart?.()

  try {
    // Load each data type from backend and save locally
    const storeMap: { store: StoreName; fetchFn: () => Promise<any[]> }[] = [
      { store: 'tasks', fetchFn: async () => {
        const { taskApi } = await import('./api')
        return taskApi.getAll()
      }},
      { store: 'courses', fetchFn: async () => {
        const { scheduleApi } = await import('./api')
        return scheduleApi.getAll()
      }},
      { store: 'notes', fetchFn: async () => {
        const { noteApi } = await import('./api')
        return noteApi.getAll()
      }},
      { store: 'pomodoroSessions', fetchFn: async () => {
        const { pomodoroApi } = await import('./api')
        return pomodoroApi.getSessions({ limit: '50' })
      }},
    ]

    for (const { store, fetchFn } of storeMap) {
      try {
        const data = await fetchFn()
        if (Array.isArray(data)) {
          await saveLocalData(store, data)
        }
      } catch (error) {
        console.error(`Failed to load ${store}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }
}

// Called when app resumes (e.g., from background)
export async function onResume(): Promise<void> {
  // Sync any pending actions
  if (isOnline()) {
    const result = await syncPendingActions()
    callbacks.onSyncComplete?.(result)
  }
}

// Called when app pauses (e.g., goes to background)
export async function onPause(): Promise<void> {
  // Could save any in-progress state here
  // For now, this is a no-op placeholder
}

// Get data from IndexedDB with fallback
export async function getDataWithFallback<T>(
  storeName: StoreName,
  fetchFn: () => Promise<T[]>
): Promise<T[]> {
  // Try to get from IndexedDB first
  try {
    const localData = await getAllFromStore<T>(storeName)
    if (localData.length > 0) {
      // Return local data immediately, refresh in background
      fetchFn().then(remoteData => {
        if (Array.isArray(remoteData)) {
          putManyToStore(storeName, remoteData as any[]).catch(() => {})
        }
      }).catch(() => {})
      return localData
    }
  } catch {
    // IndexedDB not available
  }

  // No local data, fetch from backend
  try {
    const data = await fetchFn()
    // Save to IndexedDB for offline use
    if (Array.isArray(data)) {
      saveLocalData(storeName, data).catch(() => {})
    }
    return data
  } catch (error) {
    // Offline and no local data
    return []
  }
}
