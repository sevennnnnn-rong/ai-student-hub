// Note store using useSyncExternalStore pattern

import { useSyncExternalStore } from 'react'
import { noteApi } from '../api'
import { getAllFromStore, putToStore, deleteFromStore, putManyToStore } from '../db'

export interface Note {
  id: number
  title: string
  content: string | null
  task_id: number | null
  created_at: string
  updated_at: string
  synced?: boolean
}

interface NoteState {
  notes: Note[]
  loading: boolean
  error: string | null
}

let state: NoteState = {
  notes: [],
  loading: false,
  error: null,
}

let listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

function setState(partial: Partial<NoteState>) {
  state = { ...state, ...partial }
  notify()
}

const storeActions = {
  loadNotes: async () => {
    setState({ loading: true, error: null })
    try {
      const localNotes = await getAllFromStore<Note>('notes')
      if (localNotes.length > 0) {
        setState({ notes: localNotes, loading: false })
        noteApi.getAll().then(async (remoteNotes: Note[]) => {
          if (Array.isArray(remoteNotes)) {
            const notesWithSync = remoteNotes.map(n => ({ ...n, synced: true }))
            await putManyToStore('notes', notesWithSync)
            setState({ notes: notesWithSync })
          }
        }).catch(() => {})
      } else {
        const notes = await noteApi.getAll()
        const notesWithSync = Array.isArray(notes) ? notes.map(n => ({ ...n, synced: true })) : []
        await putManyToStore('notes', notesWithSync)
        setState({ notes: notesWithSync, loading: false })
      }
    } catch (error) {
      try {
        const localNotes = await getAllFromStore<Note>('notes')
        setState({ notes: localNotes, loading: false, error: 'Using offline data' })
      } catch {
        setState({ loading: false, error: 'Failed to load notes' })
      }
    }
  },

  addNote: async (data: Partial<Note>): Promise<Note> => {
    try {
      const note = await noteApi.create(data)
      const newNote = { ...note, synced: true }
      await putToStore('notes', newNote)
      setState({ notes: [newNote, ...state.notes] })
      return newNote
    } catch (error) {
      const tempId = Date.now()
      const now = new Date().toISOString()
      const newNote: Note = {
        id: tempId,
        title: data.title || '',
        content: data.content || null,
        task_id: data.task_id || null,
        created_at: now,
        updated_at: now,
        synced: false,
      }
      await putToStore('notes', newNote)
      setState({ notes: [newNote, ...state.notes] })
      return newNote
    }
  },

  updateNote: async (id: number, data: Partial<Note>): Promise<void> => {
    const updatedNotes = state.notes.map(n =>
      n.id === id ? { ...n, ...data, updated_at: new Date().toISOString(), synced: false } : n
    )
    setState({ notes: updatedNotes })

    try {
      const updated = await noteApi.update(id, data)
      const syncedNote = { ...updated, synced: true }
      await putToStore('notes', syncedNote)
      setState({
        notes: state.notes.map(n => n.id === id ? syncedNote : n)
      })
    } catch (error) {
      await putToStore('notes', { ...data, id, updated_at: new Date().toISOString(), synced: false } as Note)
    }
  },

  deleteNote: async (id: number): Promise<void> => {
    setState({ notes: state.notes.filter(n => n.id !== id) })

    try {
      await noteApi.delete(id)
      await deleteFromStore('notes', id)
    } catch (error) {
      const { enqueue } = await import('../sync-queue')
      await enqueue({ method: 'DELETE', endpoint: `/notes/${id}` })
    }
  },

  getNoteById: (id: number): Note | undefined => {
    return state.notes.find(n => n.id === id)
  },
}

// Server-safe initial state
const serverState: NoteState = {
  notes: [],
  loading: false,
  error: null,
}

export function useNoteStore() {
  const noteState = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => serverState
  )

  return {
    ...noteState,
    ...storeActions,
  }
}
