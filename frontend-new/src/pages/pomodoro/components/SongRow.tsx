import { Play, Pause, Heart } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { type Song } from '../lib/netease-api'

function artistNames(song: Song): string {
  if (!song.artists || song.artists.length === 0) return '未知歌手'
  return song.artists.map((a) => a.name).join(' / ')
}

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

interface SongRowProps {
  song: Song
  index: number
  isActive: boolean
  isLiked: boolean
  isPlaying: boolean
  onPlay: () => void
  onToggleLike: () => void
}

export default function SongRow({ song, index, isActive, isLiked, isPlaying, onPlay, onToggleLike }: SongRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group',
        isActive
          ? 'bg-accent-blue/10 text-accent-blue'
          : 'hover:bg-bg-panel-hover text-text-secondary hover:text-text-primary',
      )}
      onClick={onPlay}
    >
      {/* Index / Playing indicator */}
      <div className="w-7 text-center shrink-0">
        {isActive && isPlaying ? (
          <div className="flex items-center justify-center gap-[2px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[3px] bg-accent-blue rounded-full animate-pulse-soft"
                style={{
                  height: `${8 + Math.sin(i * 1.5) * 4}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        ) : isActive ? (
          <Pause size={14} className="text-accent-blue mx-auto" />
        ) : (
          <>
            <span className="text-xs text-text-muted group-hover:hidden">{index + 1}</span>
            <Play size={12} fill="currentColor" className="text-text-muted mx-auto hidden group-hover:block" />
          </>
        )}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          isActive ? 'text-accent-blue font-medium' : 'text-text-primary',
        )}>
          {song.name}
        </p>
        <p className="text-xs text-text-muted truncate">
          {artistNames(song)}
        </p>
      </div>

      {/* Duration */}
      <span className="text-xs text-text-muted tabular-nums shrink-0 hidden sm:inline">
        {formatTime(song.duration / 1000)}
      </span>

      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLike() }}
        className={cn(
          'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
          isLiked ? 'text-accent-pink' : 'text-text-muted hover:text-accent-pink',
        )}
        aria-label={isLiked ? '取消喜欢' : '喜欢'}
      >
        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
