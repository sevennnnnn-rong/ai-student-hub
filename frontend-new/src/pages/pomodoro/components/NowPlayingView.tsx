import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Play, Pause, SkipBack, SkipForward,
  Heart, Repeat, Shuffle, Repeat1,
  Volume2, VolumeX, ChevronDown, Timer,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { type Song, type LyricLine, type PlayMode } from '../lib/netease-api'

// ============================================================
// Utility
// ============================================================

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function artistNames(song: Song): string {
  if (!song.artists || song.artists.length === 0) return '未知歌手'
  return song.artists.map((a) => a.name).join(' / ')
}

// ============================================================
// Props
// ============================================================

interface NowPlayingViewProps {
  currentSong: Song
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playMode: PlayMode
  lyrics: LyricLine[]
  isLiked: boolean
  sleepTimerMinutes: number | null
  sleepTimerRemaining: number | null
  onClose: () => void
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  onSeek: (time: number) => void
  onVolumeChange: (v: number) => void
  onPlayModeChange: () => void
  onToggleLike: () => void
  onStartSleepTimer: (minutes: number) => void
  onCancelSleepTimer: () => void
}

// ============================================================
// Audio Visualizer
// ============================================================

function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const barCount = 32
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="relative"
        style={{ width: 'min(320px, 65vw)', height: 'min(320px, 65vw)' }}
      >
        {Array.from({ length: barCount }).map((_, i) => {
          const angle = (i / barCount) * 360
          return (
            <div
              key={i}
              className="absolute bottom-1/2 origin-bottom"
              style={{
                left: '50%',
                width: '3px',
                height: isPlaying ? `${12 + Math.random() * 20}px` : '4px',
                background: 'linear-gradient(to top, rgba(0, 212, 255, 0.6), rgba(0, 212, 255, 0.1))',
                transform: `translateX(-50%) rotate(${angle}deg)`,
                transformOrigin: '50% 100%',
                transition: 'height 0.15s ease',
                animation: isPlaying ? `visualizer-pulse 0.${3 + (i % 4)}s ease-in-out infinite alternate` : 'none',
                animationDelay: `${(i * 0.05) % 0.5}s`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Component
// ============================================================

export default function NowPlayingView({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  playMode,
  lyrics,
  isLiked,
  sleepTimerMinutes,
  sleepTimerRemaining,
  onClose,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onPlayModeChange,
  onToggleLike,
  onStartSleepTimer,
  onCancelSleepTimer,
}: NowPlayingViewProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [visible, setVisible] = useState(false)
  const [showSleepMenu, setShowSleepMenu] = useState(false)
  const touchStartY = useRef(0)

  // Mount animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Current lyric line
  const activeLyricIdx = useMemo(() => {
    if (lyrics.length === 0) return -1
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) return i
    }
    return 0
  }, [lyrics, currentTime])

  // Auto-scroll lyrics
  useEffect(() => {
    if (activeLyricIdx < 0 || !lyricsRef.current) return
    const container = lyricsRef.current
    const activeLine = container.children[activeLyricIdx] as HTMLElement | undefined
    if (activeLine) {
      const containerHeight = container.clientHeight
      const lineTop = activeLine.offsetTop
      const lineHeight = activeLine.offsetHeight
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2
      container.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' })
    }
  }, [activeLyricIdx])

  // Progress
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // Play mode icon
  const PlayModeIcon = playMode === 'shuffle' ? Shuffle : playMode === 'repeat' ? Repeat1 : Repeat

  // Progress drag
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }, [duration, onSeek])

  const handleProgressDragStart = useCallback(() => { isDragging.current = true }, [])

  const handleProgressDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const bar = progressRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }, [duration, onSeek])

  const handleProgressDragEnd = useCallback(() => { isDragging.current = false }, [])

  // Mobile swipe down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    if (deltaY > 100) onClose()
  }, [onClose])

  // Click lyric line to seek
  const handleLyricClick = useCallback((time: number) => {
    onSeek(time)
  }, [onSeek])

  // Close with animation
  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  const coverUrl = currentSong.album?.picUrl

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[60] flex flex-col',
        'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ---- Blurred Background ---- */}
      <div className="absolute inset-0 z-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'blur(80px) brightness(0.35) saturate(1.5)' }}
          />
        ) : (
          <div className="w-full h-full bg-bg-primary" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* ---- Content ---- */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <button
            onClick={handleClose}
            className="btn-icon-sm rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20"
            aria-label="关闭"
          >
            <ChevronDown size={20} />
          </button>
          <div className="text-center flex-1 min-w-0 mx-4">
            <p className="text-xs text-white/50 truncate">正在播放</p>
          </div>
          <button
            onClick={onToggleLike}
            className={cn(
              'btn-icon-sm rounded-xl',
              isLiked ? 'text-accent-pink' : 'text-white/50 hover:text-white/80',
            )}
            aria-label={isLiked ? '取消喜欢' : '喜欢'}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Main area: Vinyl + Lyrics */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center gap-6 px-6 py-4">
          {/* Vinyl + Visualizer */}
          <div className="shrink-0 flex flex-col items-center relative">
            {/* Audio Visualizer */}
            <AudioVisualizer isPlaying={isPlaying} />

            {/* Vinyl Disc */}
            <div
              className={cn(
                'w-[min(260px,50vw)] h-[min(260px,50vw)] rounded-full overflow-hidden',
                'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
                'transition-transform duration-1000',
              )}
              style={{
                animation: isPlaying ? 'vinyl-spin 8s linear infinite' : 'none',
              }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={currentSong.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 text-text-muted">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
            </div>

            {/* Song info */}
            <div className="text-center mt-5 max-w-[min(280px,55vw)]">
              <h2 className="text-lg font-semibold text-white truncate">{currentSong.name}</h2>
              <p className="text-sm text-white/60 truncate mt-0.5">{artistNames(currentSong)}</p>
            </div>
          </div>

          {/* Lyrics */}
          <div className="flex-1 min-w-0 max-w-md hidden md:block">
            <div
              ref={lyricsRef}
              className="max-h-[300px] overflow-y-auto scrollbar-thin mask-gradient"
            >
              {lyrics.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-8">暂无歌词</p>
              ) : (
                lyrics.map((line, i) => (
                  <p
                    key={`${line.time}-${i}`}
                    onClick={() => handleLyricClick(line.time)}
                    className={cn(
                      'text-sm text-center transition-all duration-300 leading-loose cursor-pointer py-1',
                      i === activeLyricIdx
                        ? 'text-white font-medium scale-[1.05]'
                        : 'text-white/25 hover:text-white/40',
                    )}
                  >
                    {line.text}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ---- Controls Area ---- */}
        <div className="shrink-0 px-6 pb-6 pt-2">
          {/* Progress bar */}
          <div className="mb-2">
            <div
              ref={progressRef}
              className="h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
              onClick={handleProgressClick}
              onMouseDown={handleProgressDragStart}
              onMouseMove={handleProgressDragMove}
              onMouseUp={handleProgressDragEnd}
              onMouseLeave={handleProgressDragEnd}
            >
              <div
                className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full relative transition-none"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-white/40 tabular-nums mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={onPlayModeChange}
              className={cn(
                'btn-icon-sm rounded-xl',
                playMode !== 'sequence' ? 'text-accent-blue' : 'text-white/40 hover:text-white/70',
              )}
              aria-label="播放模式"
            >
              <PlayModeIcon size={18} />
            </button>

            <button onClick={onPrev} className="btn-icon-sm rounded-xl text-white/70 hover:text-white" aria-label="上一首">
              <SkipBack size={22} fill="currentColor" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause size={26} fill="#0d0d12" className="text-[#0d0d12]" />
              ) : (
                <Play size={26} fill="#0d0d12" className="text-[#0d0d12] ml-1" />
              )}
            </button>

            <button onClick={onNext} className="btn-icon-sm rounded-xl text-white/70 hover:text-white" aria-label="下一首">
              <SkipForward size={22} fill="currentColor" />
            </button>

            {/* Volume (desktop only) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => onVolumeChange(volume > 0 ? 0 : 0.6)}
                className="btn-icon-sm rounded-xl text-white/40 hover:text-white/70"
                aria-label={volume > 0 ? '静音' : '取消静音'}
              >
                {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <div className="w-20 relative h-5 flex items-center">
                <div className="w-full h-1 bg-white/10 rounded-full">
                  <div className="h-full bg-white/60 rounded-full" style={{ width: `${volume * 100}%` }} />
                </div>
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  aria-label="音量"
                />
              </div>
            </div>

            {/* Sleep timer */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSleepMenu(v => !v)}
                className={cn(
                  'btn-icon-sm rounded-xl',
                  sleepTimerRemaining !== null ? 'text-accent-blue' : 'text-white/40 hover:text-white/70',
                )}
                aria-label="睡眠定时器"
              >
                <Timer size={18} />
              </button>
              {sleepTimerRemaining !== null && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] text-accent-blue font-medium tabular-nums bg-bg-panel/80 rounded-full px-1">
                  {formatTime(sleepTimerRemaining)}
                </span>
              )}
              {showSleepMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSleepMenu(false)} />
                  <div className="absolute right-0 bottom-full mb-2 w-36 bg-bg-panel border border-border rounded-xl shadow-xl z-50 py-1">
                    <p className="px-3 py-1.5 text-[10px] text-text-muted">睡眠定时</p>
                    {[30, 60, 90].map(min => (
                      <button
                        key={min}
                        onClick={() => { onStartSleepTimer(min); setShowSleepMenu(false) }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
                          sleepTimerMinutes === min
                            ? 'text-accent-blue bg-accent-blue/10'
                            : 'text-text-secondary hover:bg-bg-panel-hover',
                        )}
                      >
                        {min} 分钟
                      </button>
                    ))}
                    {sleepTimerRemaining !== null && (
                      <button
                        onClick={() => { onCancelSleepTimer(); setShowSleepMenu(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-danger hover:bg-accent-danger/10 transition-colors"
                      >
                        取消定时
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile lyrics toggle (shows lyrics below controls on mobile) */}
          <div className="md:hidden mt-4 max-h-[120px] overflow-y-auto">
            {lyrics.length > 0 ? (
              lyrics.map((line, i) => (
                <p
                  key={`${line.time}-${i}-mob`}
                  onClick={() => handleLyricClick(line.time)}
                  className={cn(
                    'text-xs text-center transition-all duration-300 leading-relaxed cursor-pointer py-0.5',
                    i === activeLyricIdx
                      ? 'text-white font-medium'
                      : 'text-white/25',
                  )}
                >
                  {line.text}
                </p>
              ))
            ) : (
              <p className="text-center text-white/20 text-xs py-2">暂无歌词</p>
            )}
          </div>
        </div>
      </div>

      {/* CSS for vinyl spin and visualizer */}
      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes visualizer-pulse {
          0% { height: 6px; opacity: 0.3; }
          100% { height: 24px; opacity: 0.8; }
        }
      `}</style>
    </div>,
    document.body,
  )
}
