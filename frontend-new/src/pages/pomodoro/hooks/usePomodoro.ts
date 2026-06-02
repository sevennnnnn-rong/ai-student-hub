import { useState, useRef, useEffect, useCallback } from 'react'

const CYCLE_LENGTH = 4

export interface Session {
  id: number
  type: 'work' | 'break' | 'long_break'
  duration: number
  completedAt: Date
}

export interface PomodoroState {
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  dailyGoal: number
  soundEnabled: boolean
  sessions: Session[]
}

const STORAGE_KEY = 'pomodoro_immersive_state'

function loadState(): PomodoroState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      return {
        sessions: (data.sessions || []).map((s: Session) => ({
          ...s,
          completedAt: new Date(s.completedAt),
        })),
        soundEnabled: data.soundEnabled ?? true,
        workMinutes: data.workMinutes ?? 25,
        breakMinutes: data.breakMinutes ?? 5,
        longBreakMinutes: data.longBreakMinutes ?? 15,
        dailyGoal: data.dailyGoal ?? 4,
      }
    }
  } catch { /* ignore */ }
  return {
    sessions: [],
    soundEnabled: true,
    workMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    dailyGoal: 4,
  }
}

function saveState(state: PomodoroState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15)
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* ignore */ }
}

export function usePomodoro(onNotify?: (msg: string, type: 'success' | 'info') => void) {
  const saved = useRef(loadState())
  const [workMin, setWorkMin] = useState(saved.current.workMinutes)
  const [breakMin, setBreakMin] = useState(saved.current.breakMinutes)
  const [longBreakMin, setLongBreakMin] = useState(saved.current.longBreakMinutes)
  const [seconds, setSeconds] = useState(saved.current.workMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState<Session[]>(saved.current.sessions)
  const [soundEnabled, setSoundEnabled] = useState(saved.current.soundEnabled)
  const [dailyGoal, setDailyGoal] = useState(saved.current.dailyGoal)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs to avoid stale closures in timer callback
  const sessionsRef = useRef(sessions)
  const workMinRef = useRef(workMin)
  const breakMinRef = useRef(breakMin)
  const longBreakMinRef = useRef(longBreakMin)
  const soundEnabledRef = useRef(soundEnabled)
  const isBreakRef = useRef(isBreak)

  useEffect(() => { sessionsRef.current = sessions }, [sessions])
  useEffect(() => { workMinRef.current = workMin }, [workMin])
  useEffect(() => { breakMinRef.current = breakMin }, [breakMin])
  useEffect(() => { longBreakMinRef.current = longBreakMin }, [longBreakMin])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { isBreakRef.current = isBreak }, [isBreak])

  // Persist state
  useEffect(() => {
    saveState({
      sessions,
      soundEnabled,
      workMinutes: workMin,
      breakMinutes: breakMin,
      longBreakMinutes: longBreakMin,
      dailyGoal,
    })
  }, [sessions, soundEnabled, workMin, breakMin, longBreakMin, dailyGoal])

  const recentWorkSessions = sessions.filter((s) => s.type === 'work').length % CYCLE_LENGTH
  const isLongBreak = isBreak && recentWorkSessions === 0 && sessions.filter((s) => s.type === 'work').length > 0
  const currentBreakMin = isLongBreak ? longBreakMin : breakMin
  const total = isBreak ? currentBreakMin * 60 : workMin * 60
  const progress = 1 - seconds / total
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  const totalWorkSessions = sessions.filter((s) => s.type === 'work').length
  const totalWorkMinutes = sessions
    .filter((s) => s.type === 'work')
    .reduce((acc, s) => acc + s.duration, 0)

  // Cycle indicator dots
  const cycleDots = Array.from({ length: CYCLE_LENGTH }).map((_, i) => {
    const workSessions = sessions.filter((s) => s.type === 'work').length
    const currentInCycle = workSessions % CYCLE_LENGTH
    return i < currentInCycle
  })

  const reset = useCallback(() => {
    setIsRunning(false)
    setIsBreak(false)
    setSeconds(workMinRef.current * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const toggle = useCallback(() => setIsRunning((prev) => !prev), [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setIsRunning((prev) => !prev)
      }
      if (e.key === 'r' || e.key === 'R') {
        setIsRunning(false)
        setIsBreak(false)
        setSeconds(workMinRef.current * 60)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            const currentIsBreak = isBreakRef.current
            const newIsBreak = !currentIsBreak
            setIsBreak(newIsBreak)
            isBreakRef.current = newIsBreak

            const currentSessions = sessionsRef.current
            const currentWorkMin = workMinRef.current
            const currentBreakMin = breakMinRef.current
            const currentLongBreakMin = longBreakMinRef.current
            const currentSoundEnabled = soundEnabledRef.current

            const workCount = currentSessions.filter((s: Session) => s.type === 'work').length + (currentIsBreak ? 0 : 1)
            const shouldLongBreak = !currentIsBreak && workCount % CYCLE_LENGTH === 0 && workCount > 0
            const breakDuration = shouldLongBreak ? currentLongBreakMin : currentBreakMin

            const isLongBreakNow = currentIsBreak &&
              currentSessions.filter((s: Session) => s.type === 'work').length % CYCLE_LENGTH === 0 &&
              currentSessions.filter((s: Session) => s.type === 'work').length > 0

            const session: Session = {
              id: Date.now(),
              type: currentIsBreak ? 'break' : 'work',
              duration: currentIsBreak ? (isLongBreakNow ? currentLongBreakMin : currentBreakMin) : currentWorkMin,
              completedAt: new Date(),
            }
            setSessions((prevSessions) => [...prevSessions, session])

            if (currentSoundEnabled) playNotificationSound()

            if (!currentIsBreak) {
              onNotify?.(
                shouldLongBreak ? '专注完成！享受长休息吧' : '专注完成！休息一下吧',
                'success'
              )
            } else {
              onNotify?.('休息结束，继续加油！', 'info')
            }

            return newIsBreak ? breakDuration * 60 : currentWorkMin * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isBreak, onNotify])

  return {
    // State
    seconds,
    isRunning,
    isBreak,
    isLongBreak,
    sessions,
    soundEnabled,
    dailyGoal,
    workMin,
    breakMin,
    longBreakMin,

    // Computed
    progress,
    minutes,
    secs,
    total,
    cycleDots,
    totalWorkSessions,
    totalWorkMinutes,
    currentBreakMin,
    recentWorkSessions,

    // Actions
    toggle,
    reset,
    setWorkMin,
    setBreakMin,
    setLongBreakMin,
    setDailyGoal,
    setSoundEnabled,
    setSessions,
    setIsBreak,
    setIsRunning,
  }
}
