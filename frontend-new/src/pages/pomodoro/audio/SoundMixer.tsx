/**
 * SoundMixer - Multi-track audio mixer UI for the Pomodoro sound system.
 *
 * Features:
 * - Per-track volume sliders with mute toggle
 * - Master volume control
 * - Preset combinations (rainy, forest, beach, etc.)
 * - Responsive: side panel on PC, bottom drawer on mobile
 * - Uses the AudioEngine singleton for all audio operations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, VolumeX, RotateCcw, Music, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../../lib/utils'
import {
  getAudioEngine,
  DEFAULT_PRESETS,
  type AudioTrack,
  type TrackPreset,
} from './AudioEngine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SoundMixerProps {
  /** Whether the mixer panel is visible */
  isOpen: boolean
  /** Callback to toggle the mixer panel */
  onToggle: () => void
  /** Optional: compact mode for mobile bottom sheet */
  compact?: boolean
}

// ---------------------------------------------------------------------------
// Custom hook: useAudioEngine
// ---------------------------------------------------------------------------

function useAudioEngine() {
  const engine = useRef(getAudioEngine())
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [masterVolume, setMasterVolumeState] = useState(0.8)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const e = engine.current
    setTracks(e.getTracks())
    setMasterVolumeState(e.getMasterVolume())

    const unsub = e.subscribe(() => {
      setTracks(e.getTracks())
      setMasterVolumeState(e.getMasterVolume())
    })

    return () => {
      unsub()
      // Don't dispose on unmount - engine is a singleton used across the app
    }
  }, [])

  const initEngine = useCallback(() => {
    if (!initialized) {
      engine.current.init()
      setInitialized(true)
    }
  }, [initialized])

  const play = useCallback((id: string) => {
    initEngine()
    engine.current.play(id)
  }, [initEngine])

  const pause = useCallback((id: string) => {
    engine.current.pause(id)
  }, [])

  const setVolume = useCallback((id: string, vol: number) => {
    engine.current.setVolume(id, vol)
  }, [])

  const toggleMute = useCallback((id: string) => {
    engine.current.toggleMute(id)
  }, [])

  const setMasterVolume = useCallback((vol: number) => {
    engine.current.setMasterVolume(vol)
  }, [])

  const applyPreset = useCallback((preset: TrackPreset) => {
    initEngine()
    engine.current.applyPreset(preset)
  }, [initEngine])

  const stopAll = useCallback(() => {
    engine.current.stopAll()
  }, [])

  const reset = useCallback(() => {
    engine.current.reset()
  }, [])

  return {
    tracks,
    masterVolume,
    play,
    pause,
    setVolume,
    toggleMute,
    setMasterVolume,
    applyPreset,
    stopAll,
    reset,
  }
}

// ---------------------------------------------------------------------------
// Volume Slider Component
// ---------------------------------------------------------------------------

interface VolumeSliderProps {
  value: number
  onChange: (value: number) => void
  color?: string
  disabled?: boolean
}

function VolumeSlider({ value, onChange, color = '#00d4ff', disabled = false }: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const updateValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      onChange(Math.round(pct * 100) / 100)
    },
    [onChange],
  )

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      updateValue(x)
    }
    const handleUp = () => {
      isDragging.current = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [updateValue])

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative w-full h-6 flex items-center cursor-pointer group',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
      onMouseDown={(e) => {
        if (disabled) return
        isDragging.current = true
        updateValue(e.clientX)
      }}
      onTouchStart={(e) => {
        if (disabled) return
        isDragging.current = true
        updateValue(e.touches[0].clientX)
      }}
    >
      {/* Track background */}
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] relative overflow-hidden">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75"
          style={{
            width: `${value * 100}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
      {/* Thumb */}
      <div
        className="absolute w-4 h-4 rounded-full border-2 bg-bg-secondary transition-all duration-75 group-hover:scale-110"
        style={{
          left: `calc(${value * 100}% - 8px)`,
          borderColor: color,
          boxShadow: `0 0 8px ${color}44`,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Track Row Component
// ---------------------------------------------------------------------------

interface TrackRowProps {
  track: AudioTrack
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onVolumeChange: (id: string, vol: number) => void
  onToggleMute: (id: string) => void
}

function TrackRow({ track, onPlay, onPause, onVolumeChange, onToggleMute }: TrackRowProps) {
  const handleToggle = () => {
    if (track.isPlaying) {
      onPause(track.id)
    } else {
      onPlay(track.id)
    }
  }

  return (
    <div className="flex items-center gap-3 py-2 group">
      {/* Play/Pause button with icon */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all shrink-0',
          track.isPlaying
            ? 'bg-accent-blue/15 text-accent-blue'
            : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-primary',
        )}
        title={track.isPlaying ? `暂停 ${track.name}` : `播放 ${track.name}`}
        aria-label={track.isPlaying ? `暂停 ${track.name}` : `播放 ${track.name}`}
      >
        {track.icon}
      </button>

      {/* Track info + slider */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary truncate">{track.name}</span>
          <span className="text-[10px] font-mono text-text-muted w-8 text-right tabular-nums">
            {track.isPlaying ? `${Math.round(track.volume * 100)}%` : '--'}
          </span>
        </div>
        <VolumeSlider
          value={track.volume}
          onChange={(v) => onVolumeChange(track.id, v)}
          disabled={!track.isPlaying}
          color={track.isPlaying ? '#00d4ff' : '#6b7280'}
        />
      </div>

      {/* Mute button */}
      <button
        onClick={() => onToggleMute(track.id)}
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0',
          track.isMuted
            ? 'text-accent-danger/70'
            : 'text-text-muted/50 hover:text-text-secondary',
        )}
        title={track.isMuted ? '取消静音' : '静音'}
        aria-label={track.isMuted ? `取消静音 ${track.name}` : `静音 ${track.name}`}
      >
        {track.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset Button Component
// ---------------------------------------------------------------------------

interface PresetButtonProps {
  preset: TrackPreset
  onApply: (preset: TrackPreset) => void
  isActive: boolean
}

function PresetButton({ preset, onApply, isActive }: PresetButtonProps) {
  return (
    <button
      onClick={() => onApply(preset)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all',
        isActive
          ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
          : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-secondary border border-transparent',
      )}
    >
      <span>{preset.icon}</span>
      <span>{preset.name}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// SoundMixer Component
// ---------------------------------------------------------------------------

export default function SoundMixer({ isOpen, onToggle, compact = false }: SoundMixerProps) {
  const {
    tracks,
    masterVolume,
    play,
    pause,
    setVolume,
    toggleMute,
    setMasterVolume,
    applyPreset,
    stopAll,
    reset,
  } = useAudioEngine()

  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Detect active preset based on current track volumes
  useEffect(() => {
    const playing = tracks.filter((t) => t.isPlaying)
    if (playing.length === 0) {
      setActivePreset(null)
      return
    }

    for (const preset of DEFAULT_PRESETS) {
      const presetTracks = preset.tracks
      if (presetTracks.length !== playing.length) continue
      const match = presetTracks.every((pt) => {
        const t = tracks.find((tr) => tr.id === pt.id)
        return t?.isPlaying && Math.abs(t.volume - pt.volume) < 0.15
      })
      if (match) {
        setActivePreset(preset.id)
        return
      }
    }
    setActivePreset(null)
  }, [tracks])

  const handleApplyPreset = useCallback(
    (preset: TrackPreset) => {
      if (activePreset === preset.id) {
        // Toggle off - stop all
        stopAll()
        setActivePreset(null)
      } else {
        applyPreset(preset)
        setActivePreset(preset.id)
      }
    },
    [activePreset, applyPreset, stopAll],
  )

  const handleMasterVolumeChange = useCallback(
    (vol: number) => {
      setMasterVolume(vol)
    },
    [setMasterVolume],
  )

  // ---- Compact mode (mobile bottom sheet) ----
  if (compact) {
    return (
      <div
        className={cn(
          'w-full transition-all duration-300 ease-out overflow-hidden',
          isOpen ? 'max-h-[60vh]' : 'max-h-12',
        )}
      >
        {/* Header - always visible */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 glass rounded-2xl mb-2"
        >
          <div className="flex items-center gap-2">
            <Music size={16} className="text-accent-blue" />
            <span className="text-sm font-medium text-text-primary">音效混音器</span>
            {tracks.some((t) => t.isPlaying) && (
              <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse-soft" />
            )}
          </div>
          {isOpen ? (
            <ChevronDown size={16} className="text-text-muted" />
          ) : (
            <ChevronUp size={16} className="text-text-muted" />
          )}
        </button>

        {/* Content */}
        {isOpen && (
          <div className="glass rounded-2xl p-4 animate-slide-up">
            <MixerContent
              tracks={tracks}
              masterVolume={masterVolume}
              activePreset={activePreset}
              onPlay={play}
              onPause={pause}
              onVolumeChange={setVolume}
              onToggleMute={toggleMute}
              onMasterVolumeChange={handleMasterVolumeChange}
              onApplyPreset={handleApplyPreset}
              onReset={reset}
            />
          </div>
        )}
      </div>
    )
  }

  // ---- Full mode (PC side panel) ----
  return (
    <div
      className={cn(
        'w-72 glass rounded-2xl transition-all duration-300 ease-out overflow-hidden',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {isOpen && (
        <div className="p-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music size={16} className="text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">音效混音器</h3>
              {tracks.some((t) => t.isPlaying) && (
                <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse-soft" />
              )}
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-white/[0.06] transition-all"
              title="关闭混音器"
              aria-label="关闭混音器"
            >
              <ChevronUp size={14} />
            </button>
          </div>

          <MixerContent
            tracks={tracks}
            masterVolume={masterVolume}
            activePreset={activePreset}
            onPlay={play}
            onPause={pause}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
            onMasterVolumeChange={handleMasterVolumeChange}
            onApplyPreset={handleApplyPreset}
            onReset={reset}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared content between full and compact modes
// ---------------------------------------------------------------------------

interface MixerContentProps {
  tracks: AudioTrack[]
  masterVolume: number
  activePreset: string | null
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onVolumeChange: (id: string, vol: number) => void
  onToggleMute: (id: string) => void
  onMasterVolumeChange: (vol: number) => void
  onApplyPreset: (preset: TrackPreset) => void
  onReset: () => void
}

function MixerContent({
  tracks,
  masterVolume,
  activePreset,
  onPlay,
  onPause,
  onVolumeChange,
  onToggleMute,
  onMasterVolumeChange,
  onApplyPreset,
  onReset,
}: MixerContentProps) {
  const hasPlaying = tracks.some((t) => t.isPlaying)

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2 font-medium">
          预设
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_PRESETS.map((preset) => (
            <PresetButton
              key={preset.id}
              preset={preset}
              onApply={onApplyPreset}
              isActive={activePreset === preset.id}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Track list */}
      <div className="space-y-0.5">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2 font-medium">
          音轨
        </div>
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            onPlay={onPlay}
            onPause={onPause}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Master volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {masterVolume === 0 ? (
              <VolumeX size={12} className="text-text-muted" />
            ) : (
              <Volume2 size={12} className="text-text-muted" />
            )}
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
              主音量
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted tabular-nums">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
        <VolumeSlider
          value={masterVolume}
          onChange={onMasterVolumeChange}
          color="#f59e0b"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-secondary transition-all border border-transparent"
          title="重置所有音轨"
        >
          <RotateCcw size={12} />
          重置
        </button>
        {hasPlaying && (
          <button
            onClick={() => {
              tracks.forEach((t) => {
                if (t.isPlaying) onPause(t.id)
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/[0.04] text-text-muted hover:bg-white/[0.08] hover:text-text-secondary transition-all border border-transparent"
            title="全部暂停"
          >
            <VolumeX size={12} />
            全部暂停
          </button>
        )}
      </div>
    </div>
  )
}
