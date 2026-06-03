import { useState, useCallback } from 'react'
import { X, Music, Play, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { type Song } from '../lib/netease-api'

// ============================================================
// Helpers
// ============================================================

function artistNames(song: Song): string {
  if (!song.artists || song.artists.length === 0) return '未知歌手'
  return song.artists.map((a) => a.name).join(' / ')
}

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m + ':' + String(s).padStart(2, '0')
}

// ============================================================
// Props
// ============================================================

interface PlaylistDrawerProps {
  isOpen: boolean
  playlist: Song[]
  currentIndex: number
  isPlaying: boolean
  onClose: () => void
  onPlaySong: (index: number) => void
  onRemoveSong: (index: number) => void
  onClearPlaylist: () => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

// ============================================================
// Component
// ============================================================

export default function PlaylistDrawer({
  isOpen,
  playlist,
  currentIndex,
  isPlaying,
  onClose,
  onPlaySong,
  onRemoveSong,
  onClearPlaylist,
  onReorder,
}: PlaylistDrawerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('div')
    ghost.style.opacity = '0'
    ghost.style.position = 'absolute'
    ghost.style.top = '-9999px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== toIndex) {
      onReorder(dragIndex, toIndex)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragIndex, onReorder])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-[320px] max-w-[85vw]',
          'flex flex-col',
          'bg-bg-panel/80 backdrop-blur-2xl',
          'border-l border-white/10',
          'shadow-[-8px_0_32px_rgba(0,0,0,0.3)]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-accent-blue" />
            <h3 className="text-sm font-medium text-text-primary">
              播放队列
            </h3>
            <span className="text-xs text-text-muted">
              ({playlist.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {/* Song List */}
        <div
          className="flex-1 overflow-y-auto min-h-0 py-1 scrollbar-thin"
        >
          {playlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <Music size={32} className="mb-2 opacity-40" />
              <p className="text-sm">播放队列为空</p>
              <p className="text-xs mt-1 opacity-60">添加歌曲开始播放</p>
            </div>
          ) : (
            playlist.map((song, index) => {
              const isActive = index === currentIndex
              const isDragging = dragIndex === index
              const isDragOver = dragOverIndex === index && dragIndex !== null && dragIndex !== index

              return (
                <div
                  key={song.id + '-' + index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 mx-1 rounded-xl cursor-pointer transition-all group',
                    'select-none',
                    isActive
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'hover:bg-white/5 text-text-secondary hover:text-text-primary',
                    isDragging && 'opacity-40 scale-[0.98]',
                    isDragOver && 'border-t-2 border-accent-blue/50',
                  )}
                  onClick={() => onPlaySong(index)}
                >
                  {/* Drag Handle */}
                  <div className="shrink-0 text-text-muted/40 group-hover:text-text-muted transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} />
                  </div>

                  {/* Index / Playing indicator */}
                  <div className="w-6 text-center shrink-0">
                    {isActive && isPlaying ? (
                      <div className="flex items-center justify-center gap-[2px]">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-[3px] bg-accent-blue rounded-full animate-pulse-soft"
                            style={{
                              height: (8 + Math.sin(i * 1.5) * 4) + 'px',
                              animationDelay: (i * 0.15) + 's',
                            }}
                          />
                        ))}
                      </div>
                    ) : isActive ? (
                      <Play size={12} fill="currentColor" className="text-accent-blue mx-auto" />
                    ) : (
                      <span className="text-xs text-text-muted group-hover:hidden">
                        {index + 1}
                      </span>
                    )}
                    {!isActive && (
                      <Play
                        size={12}
                        fill="currentColor"
                        className="text-text-muted mx-auto hidden group-hover:block"
                      />
                    )}
                  </div>

                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs truncate',
                      isActive ? 'text-accent-blue font-medium' : 'text-text-primary',
                    )}>
                      {song.name}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">
                      {artistNames(song)}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="text-[10px] text-text-muted tabular-nums shrink-0">
                    {formatTime(song.duration / 1000)}
                  </span>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSong(index)
                    }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-text-muted/0 group-hover:text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
                    aria-label="移除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {playlist.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            <button
              onClick={onClearPlaylist}
              className="w-full py-2 rounded-xl text-xs text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 border border-white/5 hover:border-accent-danger/20 transition-all"
            >
              清空队列
            </button>
          </div>
        )}
      </div>
    </>
  )
}
