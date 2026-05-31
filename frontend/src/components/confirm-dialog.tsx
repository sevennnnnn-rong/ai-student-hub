'use client'

import { useEffect } from 'react'
import { RippleButton } from '@/components/ripple-button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, variant = 'danger' }: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-label={title}>
      <Card className="w-full max-w-md mx-4 glass-strong animate-scale-in">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold gradient-text">{title}</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-gray-400 mb-6">{message}</p>
          <div className="flex justify-end gap-2">
            <RippleButton variant="outline" onClick={onCancel}>
              取消
            </RippleButton>
            <RippleButton
              variant={variant === 'danger' ? 'destructive' : 'default'}
              onClick={onConfirm}
            >
              确认
            </RippleButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
