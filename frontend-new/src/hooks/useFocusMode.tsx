import { useState, useEffect, createContext, useContext } from 'react'

const FocusModeContext = createContext<{
  focusMode: boolean
  toggle: () => void
}>({ focusMode: false, toggle: () => {} })

export function useFocusMode() {
  return useContext(FocusModeContext)
}

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(() => {
    try {
      return localStorage.getItem('focus_mode') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem('focus_mode', String(focusMode))
    if (focusMode) {
      document.body.classList.add('focus-mode')
    } else {
      document.body.classList.remove('focus-mode')
    }
  }, [focusMode])

  const toggle = () => setFocusMode((f) => !f)

  return (
    <FocusModeContext.Provider value={{ focusMode, toggle }}>
      {children}
    </FocusModeContext.Provider>
  )
}
