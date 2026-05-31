// IndexedDB schema and helpers for local-first data layer

const DB_NAME = 'ai-student-hub'
const DB_VERSION = 1

const STORES = {
  tasks: 'tasks',
  courses: 'courses',
  notes: 'notes',
  pomodoroSessions: 'pomodoroSessions',
  syncQueue: 'syncQueue',
} as const

type StoreName = keyof typeof STORES

let dbInstance: IDBDatabase | null = null

export function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Tasks store
      if (!db.objectStoreNames.contains(STORES.tasks)) {
        const taskStore = db.createObjectStore(STORES.tasks, { keyPath: 'id' })
        taskStore.createIndex('status', 'status', { unique: false })
        taskStore.createIndex('updated_at', 'updated_at', { unique: false })
        taskStore.createIndex('synced', 'synced', { unique: false })
      }

      // Courses store
      if (!db.objectStoreNames.contains(STORES.courses)) {
        const courseStore = db.createObjectStore(STORES.courses, { keyPath: 'id' })
        courseStore.createIndex('day_of_week', 'day_of_week', { unique: false })
        courseStore.createIndex('updated_at', 'updated_at', { unique: false })
        courseStore.createIndex('synced', 'synced', { unique: false })
      }

      // Notes store
      if (!db.objectStoreNames.contains(STORES.notes)) {
        const noteStore = db.createObjectStore(STORES.notes, { keyPath: 'id' })
        noteStore.createIndex('updated_at', 'updated_at', { unique: false })
        noteStore.createIndex('synced', 'synced', { unique: false })
      }

      // Pomodoro sessions store
      if (!db.objectStoreNames.contains(STORES.pomodoroSessions)) {
        const pomodoroStore = db.createObjectStore(STORES.pomodoroSessions, { keyPath: 'id' })
        pomodoroStore.createIndex('started_at', 'started_at', { unique: false })
        pomodoroStore.createIndex('synced', 'synced', { unique: false })
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const syncStore = db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true })
        syncStore.createIndex('synced', 'synced', { unique: false })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

export async function getAllFromStore<T = any>(storeName: StoreName): Promise<T[]> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readonly')
    const store = tx.objectStore(STORES[storeName])
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getFromStore<T = any>(storeName: StoreName, id: string | number): Promise<T | undefined> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readonly')
    const store = tx.objectStore(STORES[storeName])
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function putToStore<T = any>(storeName: StoreName, item: T): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readwrite')
    const store = tx.objectStore(STORES[storeName])
    const request = store.put(item)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function putManyToStore<T = any>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readwrite')
    const store = tx.objectStore(STORES[storeName])

    items.forEach(item => store.put(item))

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteFromStore(storeName: StoreName, id: string | number): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readwrite')
    const store = tx.objectStore(STORES[storeName])
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readwrite')
    const store = tx.objectStore(STORES[storeName])
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function countInStore(storeName: StoreName): Promise<number> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[storeName], 'readonly')
    const store = tx.objectStore(STORES[storeName])
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
