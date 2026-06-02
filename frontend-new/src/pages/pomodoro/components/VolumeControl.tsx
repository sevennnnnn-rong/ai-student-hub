import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Music, Bell } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface VolumeSettings {
  scene: number
  notification: number
  muted: boolean
}

const STORAGE_KEY = 'pomodoro_volume_settings'

function loadVolume(): VolumeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { scene: 70, notification: 80, muted: false }
  } catch {
    return { scene: 70, notification: 80, muted: false }
  }
}

interface VolumeControlProps {
  onSceneVolumeChange?: (vol: number) => void
  onNotificationVolumeChange?: (vol: number) => void
  className?: string
}

export default function VolumeControl({
  onSceneVolumeChange,
  onNotificationVolumeChange,
  className,
}: VolumeControlProps) {
  const [settings, setSettings] = useState<VolumeSettings>(loadVolume)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    onSceneVolumeChange?.(settings.muted ? 0 : settings.scene)
    onNotificationVolumeChange?.(settings.muted ? 0 : settings.notification)
  }, [settings, onSceneVolumeChange, onNotificationVolumeChange])

  const updateSetting = <K extends keyof VolumeSettings>(key: K, value: VolumeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleMute = () => {
    updateSetting('muted', !settings.muted)
  }

  const SliderControl = ({
    icon: Icon,
    label,
    value,
    onChange,
    color,
  }: {
    icon: typeof Music
    label: string
    value: number
    onChange: (v: number) => void
    color: string
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <span className="text-sm text-text-secondary">{label}</span>
        </div>
        <span className="text-xs font-mono text-text-muted">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-blue h-1.5"
        style={{ accentColor: color === 'text-accent-blue' ? 'var(--color-accent-blue)' : 'var(--color-accent-amber)' }}
      />
    </div>
  )

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="heading-md text-text-primary">音量控制</h3>
        <button
          onClick={toggleMute}
          className={cn(
            'btn-icon-sm rounded-lg transition-colors',
            settings.muted ? 'text-accent-danger' : 'text-text-muted hover:text-text-primary'
          )}
          aria-label={settings.muted ? '取消静音' : '静音'}
        >
          {settings.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className={cn('space-y-4 transition-opacity', settings.muted && 'opacity-40 pointer-events-none')}>
        <SliderControl
          icon={Music}
          label="场景音量"
          value={settings.scene}
          onChange={(v) => updateSetting('scene', v)}
          color="text-accent-blue"
        />
        <SliderControl
          icon={Bell}
          label="提示音量"
          value={settings.notification}
          onChange={(v) => updateSetting('notification', v)}
          color="text-accent-amber"
        />
      </div>

      {settings.muted && (
        <p className="caption text-text-muted text-center">已静音</p>
      )}
    </div>
  )
}
