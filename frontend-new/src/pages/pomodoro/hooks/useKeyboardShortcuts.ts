import { useEffect, useCallback, useRef } from 'react'

interface KeyboardShortcutActions {
  togglePlay: () => void
  next: () => void
  prev: () => void
  seekForward: (sec: number) => void
  seekBackward: (sec: number) => void
  volumeUp: () => void
  volumeDown: () => void
  closeNowPlaying: () => void
  toggleMute: () => void       // 新增：M 键
  toggleLike: () => void       // 新增：L 键
  focusSearch: () => void      // 新增：Ctrl/Cmd+F
  cyclePlayMode: () => void    // 新增：S 键
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const handler = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

    const a = actionsRef.current
    switch (e.key) {
      case ' ':
        e.preventDefault()
        a.togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        a.seekBackward(5)
        break
      case 'ArrowRight':
        e.preventDefault()
        a.seekForward(5)
        break
      case 'ArrowUp':
        e.preventDefault()
        a.volumeUp()
        break
      case 'ArrowDown':
        e.preventDefault()
        a.volumeDown()
        break
      case 'n':
      case 'N':
        a.next()
        break
      case 'p':
      case 'P':
        a.prev()
        break
      case 'Escape':
        a.closeNowPlaying()
        break
      case 'm':
      case 'M':
        a.toggleMute()
        break
      case 'l':
      case 'L':
        a.toggleLike()
        break
      case 's':
      case 'S':
        a.cyclePlayMode()
        break
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          a.focusSearch()
        }
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
