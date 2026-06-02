import { useEffect, useRef } from 'react'
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
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement
      setTimeout(() => cancelRef.current?.focus(), 50)
    } else if (previousFocus.current) {
      previousFocus.current.focus()
      previousFocus.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        ref={dialogRef}
        className="relative glass rounded-2xl p-6 w-96 max-w-[90vw] animate-scale-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.iconBg)}>
            <Icon size={24} className={config.iconColor} />
          </div>
          <div>
            <h3 className="heading-lg">{title}</h3>
          </div>
        </div>
        <p className="body-md mb-6 ml-16">{message}</p>
        <div className="flex gap-3 justify-end">
          <button ref={cancelRef} onClick={onCancel} className="btn btn-md btn-ghost rounded-xl">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={cn('btn btn-md rounded-xl font-medium text-white transition-all', config.confirmBg)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
