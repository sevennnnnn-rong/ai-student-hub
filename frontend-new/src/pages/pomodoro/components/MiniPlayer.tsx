import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Shuffle, Repeat1,
  Music, ChevronUp, ChevronDown, ListMusic, Timer,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { type Song, type LyricLine, type PlayMode } from '../lib/netease-api'

// ============================================================
// Types
// ============================================================

export interface MiniPlayerProps {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playMode: PlayMode
  lyrics: LyricLine[]
  sleepTimerMinutes: number | null
  sleepTimerRemaining: number | null
  onTogglePlay: () => void
  onNext: () => void
  onPrev: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onPlayModeChange: () => void
  onOpenQueue: () => void
  onOpenNowPlaying: () => void
  onStartSleepTimer: (minutes: number) => void
  onCancelSleepTimer: () => void
}

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
// Component
// ============================================================

export default function MiniPlayer({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  playMode,
  lyrics,
  sleepTimerMinutes,
  sleepTimerRemaining,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onPlayModeChange,
  onOpenQueue,
  onOpenNowPlaying,
  onStartSleepTimer,
  onCancelSleepTimer,
}: MiniPlayerProps) {
  const [expanded, setExpanded] = useState(false)
  const [showSleepMenu, setShowSleepMenu] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const sleepMenuRef = useRef<HTMLDivElement>(null)

  // Current lyric line
  const activeLyricIdx = useMemo(() => {
    if (lyrics.length === 0) return -1
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) return i
    }
    return 0
  }, [lyrics, currentTime])

  // Progress
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // Auto-scroll lyrics to active line
  useEffect(() => {
    if (!expanded || activeLyricIdx < 0 || !lyricsRef.current) return
    const container = lyricsRef.current
    const activeLine = container.children[activeLyricIdx] as HTMLElement | undefined
    if (activeLine) {
      const containerHeight = container.clientHeight
      const lineTop = activeLine.offsetTop
      const lineHeight = activeLine.offsetHeight
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2
      container.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' })
    }
  }, [activeLyricIdx, expanded])

  // Play mode icon
  const PlayModeIcon = playMode === 'shuffle' ? Shuffle : playMode === 'repeat' ? Repeat1 : Repeat

  // Progress drag handlers
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }, [duration, onSeek])

  const handleProgressDragStart = useCallback(() => {
    isDragging.current = true
  }, [])

  const handleProgressDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const bar = progressRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }, [duration, onSeek])

  const handleProgressDragEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  // Don't render if no song
  if (!currentSong) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        expanded ? 'w-[min(420px,90vw)]' : 'w-[min(360px,85vw)]',
      )}
    >
      {/* ---- Glass Container ---- */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* ==== EXPANDED MODE ==== */}
        {expanded && (
          <div className="px-4 pt-3 pb-1 animate-fade-in">
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="h-1.5 bg-white/5 rounded-full cursor-pointer group relative mb-1"
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
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-[10px] text-text-muted tabular-nums mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Lyrics area */}
            <div ref={lyricsRef} className="max-h-[80px] overflow-y-auto mb-2 mask-gradient">
              {lyrics.length === 0 ? (
                <p className="text-center text-text-muted text-xs py-2">暂无歌词</p>
              ) : (
                lyrics.map((line, i) => (
                  <p
                    key={`${line.time}-${i}`}
                    className={cn(
                      'text-xs text-center transition-all duration-300 leading-relaxed',
                      i === activeLyricIdx
                        ? 'text-text-primary font-medium scale-[1.02]'
                        : 'text-text-muted/40',
                    )}
                  >
                    {line.text}
                  </p>
                ))
              )}
            </div>

            {/* Expanded controls row */}
            <div className="flex items-center gap-2 pb-1">
              {/* Play mode */}
              <button
                onClick={onPlayModeChange}
                className={cn(
                  'btn-icon-sm rounded-lg shrink-0',
                  playMode !== 'sequence' ? 'text-accent-blue' : '',
                )}
                aria-label="播放模式"
                title={
                  playMode === 'sequence' ? '列表循环'
                    : playMode === 'shuffle' ? '随机播放'
                      : '单曲循环'
                }
              >
                <PlayModeIcon size={14} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <button
                  onClick={() => onVolumeChange(volume > 0 ? 0 : 0.6)}
                  className="btn-icon-sm rounded-lg shrink-0"
                  aria-label={volume > 0 ? '静音' : '取消静音'}
                >
                  {volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <div className="w-16 relative h-5 flex items-center">
                  <div className="w-full h-1 bg-white/10 rounded-full">
                    <div
                      className="h-full bg-accent-blue rounded-full"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    aria-label="音量"
                  />
                </div>
              </div>

              {/* Queue button */}
              <button
                onClick={onOpenQueue}
                className="btn-icon-sm rounded-lg shrink-0"
                aria-label="播放队列"
              >
                <ListMusic size={14} />
              </button>

              {/* Sleep timer */}
              <div className="relative shrink-0" ref={sleepMenuRef}>
                <button
                  onClick={() => setShowSleepMenu(v => !v)}
                  className={cn(
                    'btn-icon-sm rounded-lg shrink-0',
                    sleepTimerRemaining !== null ? 'text-accent-blue' : '',
                  )}
                  aria-label="睡眠定时器"
                  title="睡眠定时器"
                >
                  <Timer size={14} />
                </button>
                {sleepTimerRemaining !== null && (
                  <span className="absolute -top-1 -right-1 text-[8px] text-accent-blue font-medium tabular-nums">
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
          </div>
        )}

        {/* ==== MINI MODE / COLLAPSED BAR ==== */}
        <div
          className={cn(
            'flex items-center gap-2.5 cursor-pointer select-none',
            expanded ? 'px-4 pb-3' : 'px-3 py-2.5',
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Cover thumbnail — click to open Now Playing */}
          <div
            className={cn(
              'rounded-lg overflow-hidden shrink-0 bg-bg-tertiary cursor-pointer',
              expanded ? 'w-11 h-11' : 'w-10 h-10',
            )}
            onClick={(e) => { e.stopPropagation(); onOpenNowPlaying() }}
          >
            {currentSong.album.picUrl ? (
              <img
                src={currentSong.album.picUrl}
                alt={currentSong.name}
                className={cn(
                  'w-full h-full object-cover transition-transform',
                  isPlaying && 'animate-spin',
                )}
                style={{ animationDuration: '8s' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={16} className="text-text-muted" />
              </div>
            )}
          </div>

          {/* Song info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate leading-tight">
              {currentSong.name}
            </p>
            <p className="text-[10px] text-text-muted truncate leading-tight">
              {artistNames(currentSong)}
            </p>
          </div>

          {/* Play/Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePlay()
            }}
            className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shrink-0"
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause size={16} fill="white" />
            ) : (
              <Play size={16} fill="white" className="ml-0.5" />
            )}
          </button>

          {/* Prev button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="btn-icon-sm rounded-lg shrink-0 hidden sm:flex"
            aria-label="上一首"
          >
            <SkipBack size={15} />
          </button>

          {/* Next button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="btn-icon-sm rounded-lg shrink-0 hidden sm:flex"
            aria-label="下一首"
          >
            <SkipForward size={15} />
          </button>

          {/* Expand toggle — opens Now Playing */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenNowPlaying()
            }}
            className="btn-icon-sm rounded-lg shrink-0"
            aria-label="展开全屏播放器"
          >
            <ChevronUp size={14} />
          </button>
        </div>

        {/* ==== Inline progress bar (mini mode only) ==== */}
        {!expanded && (
          <div className="h-0.5 bg-white/5 mx-3 mb-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
