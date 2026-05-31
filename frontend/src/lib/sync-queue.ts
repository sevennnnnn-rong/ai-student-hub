// Offline sync queue for pending API actions

import { getDb } from './db'

export interface SyncAction {
  id?: number
  method: 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  body?: string
  timestamp: number
  synced: boolean
  retries?: number
}

const STORE_NAME = 'syncQueue' as const

export async function enqueue(action: Omit<SyncAction, 'id' | 'synced' | 'timestamp'>): Promise<number> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const syncAction: Omit<SyncAction, 'id'> = {
      ...action,
      timestamp: Date.now(),
      synced: false,
      retries: 0,
    }

    const request = store.add(syncAction)

    request.onsuccess = () => resolve(request.result as number)
    request.onerror = () => reject(request.error)
  })
}

export async function getPendingActions(): Promise<SyncAction[]> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const all = request.result as SyncAction[]
      resolve(all.filter(a => !a.synced))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function markSynced(id: number): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const action = getReq.result
      if (action) {
        action.synced = true
        const putReq = store.put(action)
        putReq.onsuccess = () => resolve()
        putReq.onerror = () => reject(putReq.error)
      } else {
        resolve()
      }
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function markFailed(id: number): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)

    getReq.onsuccess = () => {
      const action = getReq.result
      if (action) {
        action.retries = (action.retries || 0) + 1
        const putReq = store.put(action)
        putReq.onsuccess = () => resolve()
        putReq.onerror = () => reject(putReq.error)
      } else {
        resolve()
      }
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function clearSynced(): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.openCursor()

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        const action = cursor.value as SyncAction
        if (action.synced) {
          cursor.delete()
        }
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getQueueSize(): Promise<number> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const all = request.result as SyncAction[]
      resolve(all.filter(a => !a.synced).length)
    }
    request.onerror = () => reject(request.error)
  })
}
