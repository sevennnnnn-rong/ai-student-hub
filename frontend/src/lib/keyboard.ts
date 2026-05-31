'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const shortcuts: Record<string, string> = {
  '1': '/tasks',
  '2': '/pomodoro',
  '3': '/schedule',
  '4': '/notes',
  '5': '/ai-chat',
}

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      const path = shortcuts[e.key]
      if (path) {
        e.preventDefault()
        router.push(path)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])
}
