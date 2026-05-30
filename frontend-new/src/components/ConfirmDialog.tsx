import { useEffect } from 'react'
import { AlertTriangle, Info, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-accent-danger/15',
    iconColor: 'text-accent-danger',
    confirmBg: 'bg-accent-danger hover:bg-accent-danger/80',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-accent-amber/15',
    iconColor: 'text-accent-amber',
    confirmBg: 'bg-accent-amber hover:bg-accent-amber/80',
  },
  info: {
    icon: Info,
    iconBg: 'bg-accent-blue/15',
    iconColor: 'text-accent-blue',
    confirmBg: 'bg-accent-blue hover:bg-accent-blue/80',
  },
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative glass rounded-2xl p-6 w-96 max-w-[90vw] animate-scale-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.iconBg)}>
            <Icon size={24} className={config.iconColor} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
        </div>
        <p className="text-text-secondary text-sm mb-6 ml-16">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={cn('px-4 py-2 rounded-xl text-sm font-medium text-white transition-all', config.confirmBg)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
