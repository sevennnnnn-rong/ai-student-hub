import { useState, useEffect } from 'react'
import { Timer, Coffee, Moon, Target, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface PomodoroConfig {
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  dailyGoal: number
  autoStartNext: boolean
}

const STORAGE_KEY = 'pomodoro_settings'

function loadConfig(): PomodoroConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {
      workMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      dailyGoal: 4,
      autoStartNext: false,
    }
  } catch {
    return { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, dailyGoal: 4, autoStartNext: false }
  }
}

interface PomodoroSettingsProps {
  onConfigChange?: (config: PomodoroConfig) => void
  className?: string
}

export default function PomodoroSettings({ onConfigChange, className }: PomodoroSettingsProps) {
  const [config, setConfig] = useState<PomodoroConfig>(loadConfig)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    onConfigChange?.(config)
  }, [config, onConfigChange])

  const update = <K extends keyof PomodoroConfig>(key: K, value: PomodoroConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const SliderRow = ({
    icon: Icon,
    label,
    value,
    onChange,
    min,
    max,
    step,
    unit,
    color,
  }: {
    icon: typeof Timer
    label: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    step: number
    unit: string
    color: string
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <span className="text-sm text-text-secondary">{label}</span>
        </div>
        <span className="text-sm font-mono text-text-primary font-medium">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5"
        style={{
          accentColor: color === 'text-accent-blue'
            ? 'var(--color-accent-blue)'
            : color === 'text-accent-success'
              ? 'var(--color-accent-success)'
              : color === 'text-accent-purple'
                ? 'var(--color-accent-purple)'
                : 'var(--color-accent-amber)',
        }}
      />
    </div>
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h3 className="heading-md text-text-primary">番茄钟设置</h3>

      <div className="space-y-4">
        <SliderRow
          icon={Timer}
          label="专注时长"
          value={config.workMinutes}
          onChange={(v) => update('workMinutes', v)}
          min={5}
          max={60}
          step={5}
          unit=" 分钟"
          color="text-accent-blue"
        />

        <SliderRow
          icon={Coffee}
          label="休息时长"
          value={config.breakMinutes}
          onChange={(v) => update('breakMinutes', v)}
          min={1}
          max={15}
          step={1}
          unit=" 分钟"
          color="text-accent-success"
        />

        <SliderRow
          icon={Moon}
          label="长休息时长"
          value={config.longBreakMinutes}
          onChange={(v) => update('longBreakMinutes', v)}
          min={10}
          max={30}
          step={5}
          unit=" 分钟"
          color="text-accent-purple"
        />

        <SliderRow
          icon={Target}
          label="每日目标"
          value={config.dailyGoal}
          onChange={(v) => update('dailyGoal', v)}
          min={1}
          max={10}
          step={1}
          unit=" 次"
          color="text-accent-amber"
        />

        {/* Auto-start toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">自动开始下一个</span>
          <button
            onClick={() => update('autoStartNext', !config.autoStartNext)}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label={config.autoStartNext ? '关闭自动开始' : '开启自动开始'}
          >
            {config.autoStartNext ? (
              <ToggleRight size={28} className="text-accent-blue" />
            ) : (
              <ToggleLeft size={28} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
