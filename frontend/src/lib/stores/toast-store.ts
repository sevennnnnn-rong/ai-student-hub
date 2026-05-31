// Unified toast store using useSyncExternalStore pattern

import { useSyncExternalStore } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let state: ToastState = {
  toasts: [],
}

let listeners = new Set<() => void>()
let toastId = 0

function notify() {
  listeners.forEach(l => l())
}

function setState(partial: Partial<ToastState>) {
  state = { ...state, ...partial }
  notify()
}

const storeActions = {
  showToast: (message: string, type: Toast['type'] = 'info', duration: number = 3000): string => {
    const id = `toast-${++toastId}`
    const toast: Toast = { id, message, type, duration }

    setState({ toasts: [...state.toasts, toast] })

    // Auto-dismiss
    setTimeout(() => {
      setState({
        toasts: state.toasts.filter(t => t.id !== id)
      })
    }, duration)

    return id
  },

  dismissToast: (id: string) => {
    setState({
      toasts: state.toasts.filter(t => t.id !== id)
    })
  },

  success: (message: string, duration?: number): string => {
    return storeActions.showToast(message, 'success', duration)
  },

  error: (message: string, duration?: number): string => {
    return storeActions.showToast(message, 'error', duration)
  },

  info: (message: string, duration?: number): string => {
    return storeActions.showToast(message, 'info', duration)
  },
}

// Server-safe initial state
const serverState: ToastState = {
  toasts: [],
}

export function useToastStore() {
  const toastState = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => serverState
  )

  return {
    ...toastState,
    ...storeActions,
  }
}

// Convenience hook that returns toast methods
export function useToast() {
  const { toasts } = useToastStore()

  return {
    toasts,
    toast: {
      success: storeActions.success,
      error: storeActions.error,
      info: storeActions.info,
    },
    dismiss: storeActions.dismissToast,
  }
}
