// Schedule store using useSyncExternalStore pattern

import { useSyncExternalStore } from 'react'
import { scheduleApi } from '../api'
import { getAllFromStore, putToStore, deleteFromStore, putManyToStore } from '../db'

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
  synced?: boolean
}

interface ScheduleState {
  courses: Course[]
  loading: boolean
  error: string | null
}

let state: ScheduleState = {
  courses: [],
  loading: false,
  error: null,
}

let listeners = new Set<() => void>()

function notify() {
  listeners.forEach(l => l())
}

function setState(partial: Partial<ScheduleState>) {
  state = { ...state, ...partial }
  notify()
}

const storeActions = {
  loadCourses: async (semester?: string) => {
    setState({ loading: true, error: null })
    try {
      const localCourses = await getAllFromStore<Course>('courses')
      let filteredLocal = localCourses
      if (semester) {
        filteredLocal = localCourses.filter(c => c.semester === semester)
      }

      if (filteredLocal.length > 0) {
        setState({ courses: filteredLocal, loading: false })
        scheduleApi.getAll(semester).then(async (remoteCourses: Course[]) => {
          if (Array.isArray(remoteCourses)) {
            const coursesWithSync = remoteCourses.map(c => ({ ...c, synced: true }))
            await putManyToStore('courses', coursesWithSync)
            const filtered = semester
              ? coursesWithSync.filter(c => c.semester === semester)
              : coursesWithSync
            setState({ courses: filtered })
          }
        }).catch(() => {})
      } else {
        const courses = await scheduleApi.getAll(semester)
        const coursesWithSync = Array.isArray(courses) ? courses.map(c => ({ ...c, synced: true })) : []
        await putManyToStore('courses', coursesWithSync)
        setState({ courses: coursesWithSync, loading: false })
      }
    } catch (error) {
      try {
        const localCourses = await getAllFromStore<Course>('courses')
        const filtered = semester
          ? localCourses.filter(c => c.semester === semester)
          : localCourses
        setState({ courses: filtered, loading: false, error: 'Using offline data' })
      } catch {
        setState({ loading: false, error: 'Failed to load courses' })
      }
    }
  },

  addCourse: async (data: Partial<Course>): Promise<Course> => {
    try {
      const course = await scheduleApi.create(data)
      const newCourse = { ...course, synced: true }
      await putToStore('courses', newCourse)
      setState({ courses: [...state.courses, newCourse] })
      return newCourse
    } catch (error) {
      const tempId = Date.now()
      const newCourse: Course = {
        id: tempId,
        name: data.name || '',
        teacher: data.teacher || null,
        location: data.location || null,
        day_of_week: data.day_of_week || 1,
        start_time: data.start_time || '08:00',
        end_time: data.end_time || '09:00',
        color: data.color || '#3b82f6',
        semester: data.semester || null,
        synced: false,
      }
      await putToStore('courses', newCourse)
      setState({ courses: [...state.courses, newCourse] })
      return newCourse
    }
  },

  updateCourse: async (id: number, data: Partial<Course>): Promise<void> => {
    const updatedCourses = state.courses.map(c =>
      c.id === id ? { ...c, ...data, synced: false } : c
    )
    setState({ courses: updatedCourses })

    try {
      const updated = await scheduleApi.update(id, data)
      const syncedCourse = { ...updated, synced: true }
      await putToStore('courses', syncedCourse)
      setState({
        courses: state.courses.map(c => c.id === id ? syncedCourse : c)
      })
    } catch (error) {
      await putToStore('courses', { ...data, id, synced: false } as Course)
    }
  },

  deleteCourse: async (id: number): Promise<void> => {
    setState({ courses: state.courses.filter(c => c.id !== id) })

    try {
      await scheduleApi.delete(id)
      await deleteFromStore('courses', id)
    } catch (error) {
      const { enqueue } = await import('../sync-queue')
      await enqueue({ method: 'DELETE', endpoint: `/schedule/${id}` })
    }
  },

  getCourseById: (id: number): Course | undefined => {
    return state.courses.find(c => c.id === id)
  },
}

// Server-safe initial state
const serverState: ScheduleState = {
  courses: [],
  loading: false,
  error: null,
}

export function useScheduleStore() {
  const scheduleState = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => serverState
  )

  return {
    ...scheduleState,
    ...storeActions,
  }
}
