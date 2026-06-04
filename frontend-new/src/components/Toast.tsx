import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  dismissing?: boolean
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export function useToast() {
  return useContext(ToastContext)
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const colors = {
  success: 'border-accent-success/30 bg-accent-success/10 text-accent-success',
  error: 'border-accent-danger/30 bg-accent-danger/10 text-accent-danger',
  info: 'border-accent/30 bg-accent/10 text-accent',
}

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, dismissing: true } : t))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 200)
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
    const timer = setTimeout(() => removeToast(id), 3500)
    timersRef.current.set(id, timer)

    // Play sound if enabled
    if (localStorage.getItem('toast_sound') !== 'false') {
      try {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(type === 'error' ? 220 : type === 'success' ? 587.33 : 440, ctx.currentTime)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
      } catch {}
    }
  }, [removeToast])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 right-6 md:bottom-6 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = icons[t.type]
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto glass px-4 py-3 rounded-xl border flex items-center gap-3 min-w-[280px] max-w-[400px]',
                'shadow-lg backdrop-blur-xl',
                t.dismissing ? 'animate-[fade-out_0.2s_ease-out_forwards]' : 'animate-slide-up',
                colors[t.type]
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="body-md flex-1 text-text-primary">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="btn-icon-sm rounded-md text-text-muted hover:text-text-primary shrink-0"
                aria-label="关闭"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
