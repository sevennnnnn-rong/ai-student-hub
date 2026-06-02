import { memo } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface ImmersiveTimerProps {
  minutes: number
  secs: number
  progress: number
  isRunning: boolean
  isBreak: boolean
  isLongBreak: boolean
  cycleDots: boolean[]
  accentColor: string
  onToggle: () => void
  onReset: () => void
}

const RADIUS = 100
const STROKE = 4
const VIEW_SIZE = (RADIUS + STROKE) * 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ImmersiveTimerInner({
  minutes,
  secs,
  progress,
  isRunning,
  isBreak,
  isLongBreak,
  cycleDots,
  accentColor,
  onToggle,
  onReset,
}: ImmersiveTimerProps) {
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="immersive-timer">
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-15 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
        }}
      />

      {/* Timer SVG ring */}
      <svg
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        className="-rotate-90 relative"
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      >
        {/* Background ring */}
        <circle
          cx={VIEW_SIZE / 2}
          cy={VIEW_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={STROKE}
        />
        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const isMajor = i % 5 === 0
          const innerR = isMajor ? RADIUS - 12 : RADIUS - 8
          const outerR = RADIUS - 5
          const cx = VIEW_SIZE / 2
          const cy = VIEW_SIZE / 2
          return (
            <line
              key={i}
              x1={cx + innerR * Math.cos(rad)}
              y1={cy + innerR * Math.sin(rad)}
              x2={cx + outerR * Math.cos(rad)}
              y2={cy + outerR * Math.sin(rad)}
              stroke={isMajor ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
              strokeWidth={isMajor ? 1.5 : 0.5}
            />
          )
        })}
        {/* Progress ring */}
        <circle
          cx={VIEW_SIZE / 2}
          cy={VIEW_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={accentColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style={{
            filter: `drop-shadow(0 0 10px ${accentColor}80)`,
          }}
        />
      </svg>

      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl md:text-6xl font-mono font-bold tracking-wider tabular-nums text-white/90">
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <span className="text-sm font-medium mt-1.5 tracking-wide" style={{ color: accentColor }}>
          {isBreak ? (isLongBreak ? '长休息' : '休息中') : '专注中'}
        </span>

        {/* Cycle dots */}
        <div className="flex gap-1.5 mt-3">
          {cycleDots.map((completed, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-300',
                completed ? 'scale-125' : 'bg-white/10'
              )}
              style={completed ? { backgroundColor: accentColor } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={onReset}
          className="w-10 h-10 rounded-xl flex items-center justify-center glass glass-hover text-white/40 hover:text-white/70 transition-colors"
          title="重置 (R)"
          aria-label="重置计时器"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={onToggle}
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95',
            isRunning
              ? 'glass glass-hover'
              : 'glow-blue'
          )}
          style={!isRunning ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` } : undefined}
          title="播放/暂停 (Space)"
          aria-label={isRunning ? '暂停计时' : '开始计时'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
      </div>
    </div>
  )
}

export const ImmersiveTimer = memo(ImmersiveTimerInner)
