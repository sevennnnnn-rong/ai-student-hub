import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '../../../lib/utils'

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale'

const PHASE_CONFIG: Record<Exclude<Phase, 'idle'>, { duration: number; label: string; color: string }> = {
  inhale: { duration: 4000, label: '吸气...', color: 'var(--color-accent-blue)' },
  hold:   { duration: 7000, label: '屏住...', color: 'var(--color-accent-purple)' },
  exhale: { duration: 8000, label: '呼气...', color: 'var(--color-accent-success)' },
}

const PHASE_ORDER: Exclude<Phase, 'idle'>[] = ['inhale', 'hold', 'exhale']

function playPhaseTone(phase: Exclude<Phase, 'idle'>) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const freqMap = { inhale: 392, hold: 440, exhale: 329.63 }
    osc.frequency.setValueAtTime(freqMap[phase], ctx.currentTime)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

interface BreathingGuideProps {
  className?: string
}

export default function BreathingGuide({ className }: BreathingGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  const runPhase = useCallback((phaseIndex: number) => {
    const currentPhase = PHASE_ORDER[phaseIndex % 3]
    setPhase(currentPhase)
    setElapsed(0)

    if (soundEnabled) playPhaseTone(currentPhase)

    startTimeRef.current = performance.now()
    const duration = PHASE_CONFIG[currentPhase].duration

    const tick = () => {
      const now = performance.now()
      const progress = Math.min((now - startTimeRef.current) / duration, 1)
      setElapsed(progress)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    timerRef.current = setTimeout(() => {
      cancelAnimationFrame(rafRef.current)
      runPhase(phaseIndex + 1)
    }, duration)
  }, [soundEnabled])

  const start = useCallback(() => {
    setIsPlaying(true)
    runPhase(0)
  }, [runPhase])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setPhase('idle')
    setElapsed(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const config = phase !== 'idle' ? PHASE_CONFIG[phase] : null
  const scale = phase === 'inhale'
    ? 1 + 0.5 * elapsed
    : phase === 'hold'
      ? 1.5
      : phase === 'exhale'
        ? 1.5 - 0.5 * elapsed
        : 1

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <h3 className="heading-md text-text-primary">呼吸引导</h3>
      <p className="caption text-text-muted">4-7-8 呼吸法</p>

      {/* Breathing circle */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border border-white/10 transition-transform"
          style={{ transform: `scale(${scale})` }}
        />
        {/* Inner glow circle */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            transform: `scale(${scale})`,
            background: config
              ? `radial-gradient(circle, ${config.color}33 0%, ${config.color}08 70%)`
              : 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
            boxShadow: config
              ? `0 0 40px ${config.color}22, 0 0 80px ${config.color}0a`
              : 'none',
          }}
        >
          <span className="text-lg font-medium text-text-primary select-none">
            {config ? config.label : '开始'}
          </span>
        </div>
        {/* Progress arc */}
        {phase !== 'idle' && config && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80" cy="80" r="76"
              fill="none"
              stroke={config.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 76}
              strokeDashoffset={2 * Math.PI * 76 * (1 - elapsed)}
              className="transition-none"
              style={{ filter: `drop-shadow(0 0 6px ${config.color}66)` }}
            />
          </svg>
        )}
      </div>

      {/* Phase progress dots */}
      <div className="flex gap-2">
        {(['inhale', 'hold', 'exhale'] as const).map((p) => (
          <div
            key={p}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              phase === p ? 'scale-125' : 'scale-100'
            )}
            style={{
              background: phase === p ? PHASE_CONFIG[p].color : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* Cycle info */}
      <p className="caption text-text-muted">
        4s 吸气 / 7s 屏住 / 8s 呼气
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="btn-icon-sm"
          aria-label={soundEnabled ? '关闭提示音' : '开启提示音'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          onClick={isPlaying ? stop : start}
          className={cn(
            'btn btn-md rounded-xl',
            isPlaying ? 'btn-danger' : 'btn-primary'
          )}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? '停止' : '开始'}
        </button>
      </div>
    </div>
  )
}
