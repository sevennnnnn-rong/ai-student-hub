import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Pause, Play, RotateCcw, Bell } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface SittingConfig {
  intervalMinutes: number
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const STORAGE_KEY = 'pomodoro_sitting_reminder'
const DEFAULT_INTERVAL = 30

function loadConfig(): SittingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {
      intervalMinutes: DEFAULT_INTERVAL,
      soundEnabled: true,
      vibrationEnabled: true,
    }
  } catch {
    return { intervalMinutes: DEFAULT_INTERVAL, soundEnabled: true, vibrationEnabled: true }
  }
}

function playReminderSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

function triggerVibration() {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  } catch {}
}

interface SittingReminderProps {
  className?: string
}

export default function SittingReminder({ className }: SittingReminderProps) {
  const [config, setConfig] = useState<SittingConfig>(loadConfig)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [remaining, setRemaining] = useState(config.intervalMinutes * 60)
  const [triggered, setTriggered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  // Reset remaining when interval changes
  useEffect(() => {
    if (isActive && !isPaused) {
      setRemaining(config.intervalMinutes * 60)
    }
  }, [config.intervalMinutes, isActive, isPaused])

  const triggerAlert = useCallback(() => {
    setTriggered(true)
    if (config.soundEnabled) playReminderSound()
    if (config.vibrationEnabled) triggerVibration()
  }, [config.soundEnabled, config.vibrationEnabled])

  // Timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            triggerAlert()
            return config.intervalMinutes * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, isPaused, config.intervalMinutes, triggerAlert])

  const start = () => {
    setRemaining(config.intervalMinutes * 60)
    setTriggered(false)
    setIsActive(true)
    setIsPaused(false)
  }

  const pause = () => setIsPaused(true)

  const resume = () => setIsPaused(false)

  const reset = () => {
    setIsActive(false)
    setIsPaused(false)
    setRemaining(config.intervalMinutes * 60)
    setTriggered(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = 1 - remaining / (config.intervalMinutes * 60)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="heading-md text-text-primary flex items-center gap-2">
        <Clock size={16} className="text-accent-amber" />
        久坐提醒
      </h3>

      {/* Countdown display */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-28 h-28">
          {/* Background ring */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={triggered ? 'var(--color-accent-danger)' : 'var(--color-accent-amber)'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              style={{
                filter: `drop-shadow(0 0 6px ${triggered ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold tabular-nums">
              {triggered ? '!' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </span>
            {triggered && (
              <span className="caption text-accent-danger">该站起来活动了</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isActive ? (
          <button onClick={start} className="btn btn-md btn-primary rounded-xl">
            <Play size={16} />
            开始提醒
          </button>
        ) : (
          <>
            <button
              onClick={isPaused ? resume : pause}
              className="btn btn-icon-md rounded-xl glass glass-hover"
              aria-label={isPaused ? '继续' : '暂停'}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              onClick={reset}
              className="btn btn-icon-md rounded-xl glass glass-hover text-text-muted"
              aria-label="重置"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
      </div>

      {/* Status */}
      {isActive && (
        <p className="caption text-text-muted text-center">
          {isPaused ? '已暂停' : '提醒中...'}
          {triggered && ' - 点击重置继续'}
        </p>
      )}

      {/* Settings */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-text-secondary">提醒间隔</span>
            <span className="text-sm font-mono text-text-primary">{config.intervalMinutes} 分钟</span>
          </div>
          <input
            type="range"
            min={25}
            max={60}
            step={5}
            value={config.intervalMinutes}
            onChange={(e) => setConfig((prev) => ({ ...prev, intervalMinutes: Number(e.target.value) }))}
            className="w-full h-1.5 accent-accent-amber"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.soundEnabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
              className="accent-accent-amber"
            />
            <Bell size={14} className="text-text-muted" />
            <span className="text-sm text-text-secondary">声音</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.vibrationEnabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, vibrationEnabled: e.target.checked }))}
              className="accent-accent-amber"
            />
            <span className="text-sm text-text-secondary">震动</span>
          </label>
        </div>
      </div>
    </div>
  )
}
