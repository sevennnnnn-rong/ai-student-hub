import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const shortcuts: { key: string; ctrl?: boolean; shift?: boolean; action: string }[] = [
  { key: '1', ctrl: true, action: 'navigate:/' },
  { key: '2', ctrl: true, action: 'navigate:/chat' },
  { key: '3', ctrl: true, action: 'navigate:/tasks' },
  { key: '4', ctrl: true, action: 'navigate:/pomodoro' },
  { key: '5', ctrl: true, action: 'navigate:/schedule' },
  { key: '6', ctrl: true, action: 'navigate:/notes' },
  { key: '7', ctrl: true, action: 'navigate:/dashboard' },
  { key: ',', ctrl: true, action: 'navigate:/settings' },
]

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true
        const shiftMatch = shortcut.shift ? e.shiftKey : true
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault()
          if (shortcut.action.startsWith('navigate:')) {
            navigate(shortcut.action.replace('navigate:', ''))
          }
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}
