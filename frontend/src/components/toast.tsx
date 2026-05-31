'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg ${bgColors[toast.type]} animate-slide-in`}
        >
          {icons[toast.type]}
          <span className="text-sm">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
