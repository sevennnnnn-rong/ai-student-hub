'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void
}>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-in slide-in-from-bottom-5 ${
              t.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            {t.message}
            <button
              aria-label="关闭"
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
