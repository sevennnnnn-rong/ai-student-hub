import { useState, useEffect, useRef, createContext, useContext } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
  registerTheme: (fn: () => void) => void
  registerFocus: (fn: () => void) => void
  getTheme: () => (() => void) | null
  getFocus: () => (() => void) | null
}>({ theme: 'dark', toggle: () => {}, registerTheme: () => {}, registerFocus: () => {}, getTheme: () => null, getFocus: () => null })

export function useTheme() {
  return useContext(ThemeContext)
}

let themeToggleFn: (() => void) | null = null
let focusToggleFn: (() => void) | null = null

export function registerThemeToggle(fn: () => void) { themeToggleFn = fn }
export function registerFocusToggle(fn: () => void) { focusToggleFn = fn }
export function getThemeToggle() { return themeToggleFn }
export function getFocusToggle() { return focusToggleFn }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'dark'
    } catch {
      return 'dark'
    }
  })

  const themeToggleRef = useRef<(() => void) | null>(null)
  const focusToggleRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  themeToggleRef.current = toggle

  const registerTheme = (fn: () => void) => { themeToggleRef.current = fn; themeToggleFn = fn }
  const registerFocus = (fn: () => void) => { focusToggleRef.current = fn; focusToggleFn = fn }
  const getTheme = () => themeToggleRef.current
  const getFocus = () => focusToggleRef.current

  return (
    <ThemeContext.Provider value={{ theme, toggle, registerTheme, registerFocus, getTheme, getFocus }}>
      {children}
    </ThemeContext.Provider>
  )
}
