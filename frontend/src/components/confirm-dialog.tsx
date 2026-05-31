'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label={title}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button
              variant={variant === 'danger' ? 'destructive' : 'default'}
              onClick={onConfirm}
            >
              确认
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
