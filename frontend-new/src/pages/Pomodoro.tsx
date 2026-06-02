import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Zap, Clock, TrendingUp, Volume2, VolumeX, Settings, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'

const CYCLE_LENGTH = 4

interface Session {
  id: number
  type: 'work' | 'break' | 'long_break'
  duration: number
  completedAt: Date
}

type AmbientSound = 'none' | 'rain' | 'forest' | 'ocean' | 'white'

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15) // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3) // C6
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

function createAmbientNoise(ctx: AudioContext, type: AmbientSound): AudioNode | null {
  if (type === 'none') return null

  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  // Generate different noise types
  for (let i = 0; i < bufferSize; i++) {
    switch (type) {
      case 'rain':
        // Pink-ish noise for rain
        data[i] = (Math.random() * 2 - 1) * 0.3
        if (i > 0) data[i] = data[i] * 0.3 + data[i - 1] * 0.7
        break
      case 'forest':
        // Soft filtered noise for forest ambience
        data[i] = (Math.random() * 2 - 1) * 0.15
        if (i > 0) data[i] = data[i] * 0.1 + data[i - 1] * 0.9
        break
      case 'ocean':
        // Low frequency wave-like noise
        data[i] = (Math.random() * 2 - 1) * 0.25 * (0.5 + 0.5 * Math.sin(i / (ctx.sampleRate * 3)))
        break
      case 'white':
        // Pure white noise
        data[i] = (Math.random() * 2 - 1) * 0.1
        break
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const gainNode = ctx.createGain()
  gainNode.gain.value = 0.15

  source.connect(gainNode)
  source.start()

  return gainNode
}

function loadPomodoroState() {
  try {
    const saved = localStorage.getItem('pomodoro_state')
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
  } catch {}
  return { sessions: [], soundEnabled: true, workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, dailyGoal: 4 }
}

export default function Pomodoro() {
  const saved = loadPomodoroState()
  const [workMin, setWorkMin] = useState(saved.workMinutes)
  const [breakMin, setBreakMin] = useState(saved.breakMinutes)
  const [longBreakMin, setLongBreakMin] = useState(saved.longBreakMinutes)
  const [seconds, setSeconds] = useState(saved.workMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState<Session[]>(saved.sessions)
  const [soundEnabled, setSoundEnabled] = useState(saved.soundEnabled)
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none')
  const [dailyGoal, setDailyGoal] = useState(saved.dailyGoal)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ambientRef = useRef<AudioNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const { toast } = useToast()
  usePageTitle('番茄钟')

  // Refs to avoid stale closures in timer callback
  const sessionsRef = useRef(sessions)
  const workMinRef = useRef(workMin)
  const breakMinRef = useRef(breakMin)
  const longBreakMinRef = useRef(longBreakMin)
  const soundEnabledRef = useRef(soundEnabled)
  const isBreakRef = useRef(isBreak)

  // Keep refs in sync with state
  useEffect(() => { sessionsRef.current = sessions }, [sessions])
  useEffect(() => { workMinRef.current = workMin }, [workMin])
  useEffect(() => { breakMinRef.current = breakMin }, [breakMin])
  useEffect(() => { longBreakMinRef.current = longBreakMin }, [longBreakMin])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { isBreakRef.current = isBreak }, [isBreak])

  const reset = useCallback(() => {
    setIsRunning(false)
    setIsBreak(false)
    setSeconds(workMin * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [workMin])

  // Keyboard shortcuts: Space to start/pause, R to reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setIsRunning((prev) => !prev)
      }
      if (e.key === 'r' || e.key === 'R') {
        reset()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [reset])

  // Calculate current cycle (how many work sessions since last long break)
  const recentWorkSessions = sessions.filter((s) => s.type === 'work').length % CYCLE_LENGTH
  const isLongBreak = isBreak && recentWorkSessions === 0 && sessions.filter((s) => s.type === 'work').length > 0
  const currentBreakMin = isLongBreak ? longBreakMin : breakMin
  const total = isBreak ? currentBreakMin * 60 : workMin * 60
  const progress = 1 - seconds / total
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference * (1 - progress)

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro_state', JSON.stringify({
      sessions,
      soundEnabled,
      workMinutes: workMin,
      breakMinutes: breakMin,
      longBreakMinutes: longBreakMin,
      dailyGoal,
    }))
  }, [sessions, soundEnabled, workMin, breakMin, longBreakMin, dailyGoal])

  // Ambient sound management
  useEffect(() => {
    if (isRunning && ambientSound !== 'none' && soundEnabled) {
      try {
        const ctx = new AudioContext()
        audioCtxRef.current = ctx
        ambientRef.current = createAmbientNoise(ctx, ambientSound)
      } catch {}
    } else {
      // Stop ambient sound
      if (ambientRef.current) {
        try { ambientRef.current.disconnect() } catch {}
        ambientRef.current = null
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch {}
        audioCtxRef.current = null
      }
    }
    return () => {
      if (ambientRef.current) {
        try { ambientRef.current.disconnect() } catch {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch {}
      }
    }
  }, [isRunning, ambientSound, soundEnabled])

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

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            const currentIsBreak = isBreakRef.current
            const newIsBreak = !currentIsBreak
            setIsBreak(newIsBreak)
            isBreakRef.current = newIsBreak

            // Use refs to get latest values (avoids stale closure)
            const currentSessions = sessionsRef.current
            const currentWorkMin = workMinRef.current
            const currentBreakMin = breakMinRef.current
            const currentLongBreakMin = longBreakMinRef.current
            const currentSoundEnabled = soundEnabledRef.current

            // Calculate if this should be a long break
            const workCount = currentSessions.filter((s: Session) => s.type === 'work').length + (currentIsBreak ? 0 : 1)
            const shouldLongBreak = !currentIsBreak && workCount % CYCLE_LENGTH === 0 && workCount > 0
            const breakDuration = shouldLongBreak ? currentLongBreakMin : currentBreakMin

            // Determine if current break is long break
            const isLongBreakNow = currentIsBreak && currentSessions.filter((s: Session) => s.type === 'work').length % CYCLE_LENGTH === 0 && currentSessions.filter((s: Session) => s.type === 'work').length > 0

            // Record session
            const session: Session = {
              id: Date.now(),
              type: currentIsBreak ? 'break' : 'work',
              duration: currentIsBreak ? (isLongBreakNow ? currentLongBreakMin : currentBreakMin) : currentWorkMin,
              completedAt: new Date(),
            }
            setSessions((prevSessions) => [...prevSessions, session])

            if (currentSoundEnabled) playNotificationSound()

            if (!currentIsBreak) {
              if (shouldLongBreak) {
                toast('专注完成！享受长休息吧', 'success')
              } else {
                toast('专注完成！休息一下吧', 'success')
              }
            } else {
              toast('休息结束，继续加油！', 'info')
            }

            return newIsBreak ? breakDuration * 60 : currentWorkMin * 60

          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isBreak, toast])

  return (
    <div className="h-full flex items-center justify-center animate-fade-in">
      <div className="flex gap-12 items-start">
        {/* Main Timer */}
        <div className="flex flex-col items-center">
          <h1 className="heading-xl mb-10">番茄钟</h1>

          {/* Timer Ring */}
          <div className="relative mb-10">
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000"
              style={{
                background: isBreak
                  ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)',
              }}
            />
            <svg width="280" height="280" className="-rotate-90 relative">
              {/* Background ring */}
              <circle
                cx="140" cy="140" r="120"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="6"
              />
              {/* Tick marks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i / 60) * 360 - 90
                const rad = (angle * Math.PI) / 180
                const isMajor = i % 5 === 0
                const innerR = isMajor ? 108 : 112
                const outerR = 115
                return (
                  <line
                    key={i}
                    x1={140 + innerR * Math.cos(rad)}
                    y1={140 + innerR * Math.sin(rad)}
                    x2={140 + outerR * Math.cos(rad)}
                    y2={140 + outerR * Math.sin(rad)}
                    stroke={isMajor ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}
                    strokeWidth={isMajor ? 1.5 : 0.5}
                  />
                )
              })}
              {/* Progress ring */}
              <circle
                cx="140" cy="140" r="120"
                fill="none"
                stroke={isBreak ? '#10b981' : '#00d4ff'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                style={{
                  filter: `drop-shadow(0 0 12px ${isBreak ? 'rgba(16,185,129,0.5)' : 'rgba(0,212,255,0.5)'})`,
                }}
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold tracking-wider tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <div className={cn(
                'flex items-center gap-1.5 mt-2 text-sm font-medium',
                isBreak ? 'text-accent-success' : 'text-accent-blue'
              )}>
                {isBreak ? <Coffee size={14} /> : <Zap size={14} />}
                {isBreak ? (isLongBreak ? '长休息' : '休息中') : '专注中'}
              </div>
              {/* Cycle dots */}
              <div className="flex gap-1.5 mt-3">
                {cycleDots.map((completed, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      completed ? 'bg-accent-blue' : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn-icon-md rounded-xl glass glass-hover text-text-secondary hover:text-text-primary"
              title={soundEnabled ? '关闭声音' : '开启声音'}
              aria-label={soundEnabled ? '关闭声音' : '开启声音'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'btn-icon-md rounded-xl glass glass-hover transition-all',
                showSettings ? 'text-accent-blue' : 'text-text-secondary hover:text-text-primary'
              )}
              title="设置时长"
              aria-label="设置时长"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={reset}
              className="btn-icon-md rounded-xl glass glass-hover text-text-secondary hover:text-text-primary"
              title="重置计时器"
              aria-label="重置计时器"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95',
                isRunning
                  ? 'bg-accent-danger/80 hover:bg-accent-danger'
                  : 'bg-gradient-to-br from-accent-blue to-blue-600 glow-blue'
              )}
              aria-label={isRunning ? '暂停计时' : '开始计时'}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 glass rounded-xl p-4 w-64 animate-slide-up">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-text-muted mb-1 block">专注时长（分钟）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={workMin}
                      onChange={(e) => setWorkMin(Number(e.target.value))}
                      className="flex-1 accent-accent-blue"
                    />
                    <span className="text-sm font-mono w-8 text-right">{workMin}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">休息时长（分钟）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={1}
                      value={breakMin}
                      onChange={(e) => setBreakMin(Number(e.target.value))}
                      className="flex-1 accent-accent-success"
                    />
                    <span className="text-sm font-mono w-8 text-right">{breakMin}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">长休息时长（分钟）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={30}
                      step={5}
                      value={longBreakMin}
                      onChange={(e) => setLongBreakMin(Number(e.target.value))}
                      className="flex-1 accent-accent-purple"
                    />
                    <span className="text-sm font-mono w-8 text-right">{longBreakMin}</span>
                  </div>
                  <p className="caption text-text-muted mt-1">每 {CYCLE_LENGTH} 个番茄后自动长休息</p>
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">每日目标（次）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="flex-1 accent-accent-purple"
                    />
                    <span className="text-sm font-mono w-8 text-right">{dailyGoal}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-text-muted mb-1 block">环境音效</label>
                  <div className="flex gap-1.5">
                    {(['none', 'rain', 'forest', 'ocean', 'white'] as AmbientSound[]).map((sound) => (
                      <button
                        key={sound}
                        onClick={() => setAmbientSound(sound)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs transition-all',
                          ambientSound === sound
                            ? 'bg-accent-blue/15 text-accent-blue'
                            : 'text-text-muted hover:bg-bg-panel-hover'
                        )}
                      >
                        {sound === 'none' ? '无' : sound === 'rain' ? '雨声' : sound === 'forest' ? '森林' : sound === 'ocean' ? '海浪' : '白噪'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    reset()
                    setShowSettings(false)
                  }}
                  className="w-full py-1.5 caption text-text-muted hover:text-text-primary transition-colors"
                >
                  应用并重置
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="mt-6 text-text-muted text-sm">
            {isBreak ? `${isLongBreak ? '长休息' : '休息'} ${currentBreakMin} 分钟` : `专注 ${workMin} 分钟`}
          </div>
        </div>

        {/* Session History */}
        <div className="w-72 glass rounded-2xl p-5">
          <h3 className="heading-md mb-4 flex items-center gap-2">
            <Clock size={16} className="text-accent-blue" />
            今日统计
          </h3>

          {/* Daily Goal Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">每日目标</span>
              <span className="text-sm font-mono text-accent-blue">{totalWorkSessions}/{dailyGoal}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  totalWorkSessions >= dailyGoal ? 'bg-accent-success' : 'bg-accent-blue'
                )}
                style={{ width: `${Math.min((totalWorkSessions / dailyGoal) * 100, 100)}%` }}
              />
            </div>
            {totalWorkSessions >= dailyGoal && (
              <p className="caption text-accent-success mt-1">今日目标已达成！</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-2xl font-bold tracking-tight">{totalWorkSessions}</div>
              <div className="body-sm mt-0.5">完成次数</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-2xl font-bold tracking-tight">{totalWorkMinutes}</div>
              <div className="body-sm mt-0.5">专注分钟</div>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-white/[0.03] rounded-xl p-3 mb-5">
            <div className="text-sm text-text-muted mb-2">本周统计</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-accent-blue">
                  {sessions.filter((s) => {
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return s.type === 'work' && s.completedAt >= weekAgo
                  }).length}
                </div>
                <div className="caption text-text-muted">本周专注</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent-purple">
                  {sessions.filter((s) => {
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return s.type === 'work' && s.completedAt >= weekAgo
                  }).reduce((acc, s) => acc + s.duration, 0)}
                </div>
                <div className="caption text-text-muted">本周分钟</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent-amber">
                  {Math.round(sessions.filter((s) => {
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return s.type === 'work' && s.completedAt >= weekAgo
                  }).length / 7 * 10) / 10 || 0}
                </div>
                <div className="caption text-text-muted">日均次数</div>
              </div>
            </div>
          </div>

          {/* Session list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center text-text-muted caption py-8">
                <TrendingUp size={24} className="mx-auto mb-2 opacity-30" />
                还没有完成的会话
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="caption text-text-muted">会话记录</span>
                  <button
                    onClick={() => { setSessions([]); toast('历史已清除', 'success') }}
                    className="caption text-text-muted hover:text-accent-danger transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={12} />清除
                  </button>
                </div>
                {[...sessions].reverse().map((session) => {
                  const isToday = session.completedAt.toDateString() === new Date().toDateString()
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl text-sm',
                        session.type === 'work' ? 'bg-accent-blue/5' : 'bg-accent-success/5'
                      )}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        session.type === 'work' ? 'bg-accent-blue' : 'bg-accent-success'
                      )} />
                      <div className="flex-1 min-w-0">
                        <span className="caption">
                          {session.type === 'work' ? '专注' : session.type === 'long_break' ? '长休息' : '休息'} {session.duration}分钟
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="caption text-text-muted block">
                          {session.completedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!isToday && (
                          <span className="caption text-text-muted/50">
                            {session.completedAt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
