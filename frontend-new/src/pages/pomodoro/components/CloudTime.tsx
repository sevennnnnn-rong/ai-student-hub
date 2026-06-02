import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Search, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Heart, Repeat, Shuffle, Repeat1,
  Music, X, ChevronLeft, Loader2, AlertCircle, Cloud,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/Toast'
import {
  searchSongs, getRecommendedPlaylists, getPlaylistDetail,
  getSongUrls, getLyrics, formatCount,
  type Song, type Playlist, type LyricLine, type PlayMode,
} from '../lib/netease-api'

// ============================================================
// Hooks
// ============================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ============================================================
// Local Storage Helpers
// ============================================================

const LIKED_KEY = 'cloudtime_liked_songs'
const VOLUME_KEY = 'cloudtime_volume'
const PLAY_MODE_KEY = 'cloudtime_play_mode'

function loadLikedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKED_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set()
}

function saveLikedIds(ids: Set<number>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]))
}

function loadVolume(): number {
  try {
    const v = localStorage.getItem(VOLUME_KEY)
    if (v !== null) return Math.max(0, Math.min(1, Number(v)))
  } catch {}
  return 0.6
}

function loadPlayMode(): PlayMode {
  try {
    const m = localStorage.getItem(PLAY_MODE_KEY)
    if (m === 'sequence' || m === 'shuffle' || m === 'repeat') return m
  } catch {}
  return 'sequence'
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

function nextIndex(current: number, total: number, mode: PlayMode): number {
  if (total === 0) return 0
  if (mode === 'shuffle') {
    if (total <= 1) return 0
    let rand = Math.floor(Math.random() * total)
    if (rand === current) rand = (rand + 1) % total
    return rand
  }
  if (mode === 'repeat') return current
  return (current + 1) % total
}

function prevIndex(current: number, total: number, mode: PlayMode): number {
  if (total === 0) return 0
  if (mode === 'shuffle') {
    if (total <= 1) return 0
    let rand = Math.floor(Math.random() * total)
    if (rand === current) rand = (rand + 1) % total
    return rand
  }
  if (mode === 'repeat') return current
  return (current - 1 + total) % total
}

// ============================================================
// Sub-Components
// ============================================================

interface PlaylistCardProps {
  playlist: Playlist
  onClick: () => void
}

function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[140px] md:w-[160px] group text-left transition-transform hover:scale-[1.03] active:scale-[0.98]"
    >
      <div className="relative rounded-xl overflow-hidden aspect-square mb-2 bg-bg-tertiary">
        {!loaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={playlist.coverImgUrl}
          alt={playlist.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
        {/* Play count overlay */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[10px] text-white/90">
          <Play size={8} fill="currentColor" />
          {formatCount(playlist.playCount)}
        </div>
        {/* Hover play icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="w-10 h-10 rounded-full bg-accent-blue/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-xs text-text-secondary line-clamp-2 leading-snug">
        {playlist.name}
      </p>
    </button>
  )
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

function SongRow({ song, isActive, isLiked, isPlaying, onPlay, onToggleLike }: SongRowProps) {
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
          <span className="text-xs text-text-muted group-hover:hidden">{/* index hidden on mobile via w-7 */}
            <span className="hidden md:inline">{/* will show index */}</span>
          </span>
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

interface LyricsDisplayProps {
  lyrics: LyricLine[]
  currentTime: number
}

function LyricsDisplay({ lyrics, currentTime }: LyricsDisplayProps) {
  const activeIdx = useMemo(() => {
    if (lyrics.length === 0) return -1
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) return i
    }
    return 0
  }, [lyrics, currentTime])

  if (lyrics.length === 0) {
    return (
      <div className="text-center text-text-muted text-sm py-4">
        暂无歌词
      </div>
    )
  }

  return (
    <div className="max-h-[120px] overflow-y-auto space-y-1 py-2 px-1 mask-gradient">
      {lyrics.map((line, i) => (
        <p
          key={`${line.time}-${i}`}
          className={cn(
            'text-sm text-center transition-all duration-300 leading-relaxed',
            i === activeIdx
              ? 'text-text-primary font-medium scale-[1.02]'
              : 'text-text-muted/50 text-xs',
          )}
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function CloudTime() {
  const { toast } = useToast()

  // --- View State ---
  const [view, setView] = useState<'home' | 'playlist' | 'search'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist & { tracks: Song[] } | null>(null)

  // --- Data State ---
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [lyrics, setLyrics] = useState<LyricLine[]>([])

  // --- Loading / Error ---
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingPlaylistDetail, setLoadingPlaylistDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Player State ---
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(loadVolume)
  const [playMode, setPlayMode] = useState<PlayMode>(loadPlayMode)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [likedIds, setLikedIds] = useState<Set<number>>(() => loadLikedIds())

  // --- UI State ---
  const [showLyrics, setShowLyrics] = useState(false)

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // --- Debounced search ---
  const debouncedQuery = useDebounce(searchQuery, 400)

  // ============================================================
  // Effects
  // ============================================================

  // Persist volume
  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, String(volume))
  }, [volume])

  // Persist play mode
  useEffect(() => {
    localStorage.setItem(PLAY_MODE_KEY, playMode)
  }, [playMode])

  // Audio element sync
  useEffect(() => {
    let audio = audioRef.current
    if (!audio) {
      audio = new Audio()
      audio.preload = 'auto'
      audioRef.current = audio
    }

    const onTimeUpdate = () => {
      if (!isDragging.current) {
        setCurrentTime(audio!.currentTime)
      }
    }
    const onDurationChange = () => setDuration(audio!.duration || 0)
    const onEnded = () => handleSongEnd()
    const onError = () => {
      // Auto-skip on playback error
      if (currentSong) {
        toast('歌曲无法播放，自动跳过', 'error')
        setTimeout(() => handleNext(), 500)
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [currentSong, playlist, currentIndex, playMode])

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Fetch recommended playlists on mount
  useEffect(() => {
    loadRecommendedPlaylists()
  }, [])

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery.trim())
    } else if (view === 'search') {
      setView('home')
    }
  }, [debouncedQuery])

  // Fetch lyrics when song changes
  useEffect(() => {
    if (currentSong) {
      loadLyrics(currentSong.id)
    } else {
      setLyrics([])
    }
  }, [currentSong?.id])

  // ============================================================
  // Data Fetching
  // ============================================================

  async function loadRecommendedPlaylists() {
    setLoadingPlaylists(true)
    setError(null)
    try {
      const result = await getRecommendedPlaylists(12)
      setPlaylists(result)
    } catch (err: any) {
      setError('加载推荐歌单失败，请检查网络连接')
      console.error('Failed to load playlists:', err)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  async function performSearch(keywords: string) {
    setLoadingSearch(true)
    setError(null)
    setView('search')
    try {
      const result = await searchSongs(keywords, 30)
      setSearchResults(result.songs)
      if (result.songs.length === 0) {
        toast('未找到相关歌曲', 'info')
      }
    } catch (err: any) {
      setError('搜索失败，请稍后重试')
      console.error('Search failed:', err)
    } finally {
      setLoadingSearch(false)
    }
  }

  async function loadPlaylistDetail(id: number) {
    setLoadingPlaylistDetail(true)
    setError(null)
    try {
      const detail = await getPlaylistDetail(id)
      setSelectedPlaylist(detail)
      setView('playlist')
    } catch (err: any) {
      setError('加载歌单详情失败')
      console.error('Failed to load playlist detail:', err)
    } finally {
      setLoadingPlaylistDetail(false)
    }
  }

  async function loadLyrics(id: number) {
    try {
      const result = await getLyrics(id)
      setLyrics(result)
    } catch {
      setLyrics([])
    }
  }

  // ============================================================
  // Playback Logic
  // ============================================================

  async function playSong(song: Song, source: Song[], idx: number) {
    setPlaylist(source)
    setCurrentIndex(idx)

    // Fetch URL if not cached
    if (!song.url) {
      try {
        const urlMap = await getSongUrls(song.id)
        const url = urlMap.get(song.id)
        if (!url) {
          toast('该歌曲暂无版权，无法播放', 'error')
          // Try next song
          if (source.length > 1) {
            const nextIdx = nextIndex(idx, source.length, playMode)
            playSong(source[nextIdx], source, nextIdx)
          }
          return
        }
        song = { ...song, url }
      } catch {
        toast('获取歌曲地址失败', 'error')
        return
      }
    }

    setCurrentSong(song)
    setIsPlaying(true)

    // Play in audio element
    const audio = audioRef.current
    if (audio && song.url) {
      audio.src = song.url
      audio.play().catch(() => {
        toast('播放失败', 'error')
        setIsPlaying(false)
      })
    }
  }

  const handlePlaySong = useCallback((song: Song, source: Song[], idx: number) => {
    playSong(song, source, idx)
  }, [playMode])

  function handleTogglePlay() {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => {
        toast('播放失败', 'error')
      })
      setIsPlaying(true)
    }
  }

  function handleNext() {
    if (playlist.length === 0) return
    const idx = nextIndex(currentIndex, playlist.length, playMode)
    playSong(playlist[idx], playlist, idx)
  }

  function handlePrev() {
    if (playlist.length === 0) return
    // If past 3 seconds, restart; otherwise go to previous
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      setCurrentTime(0)
      return
    }
    const idx = prevIndex(currentIndex, playlist.length, playMode)
    playSong(playlist[idx], playlist, idx)
  }

  function handleSongEnd() {
    if (playMode === 'repeat') {
      // Single repeat: restart
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
      return
    }
    handleNext()
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressRef.current
    if (!bar || !audioRef.current) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }

  function handleProgressDragStart() {
    isDragging.current = true
  }

  function handleProgressDragMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging.current) return
    const bar = progressRef.current
    if (!bar || !audioRef.current) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }

  function handleProgressDragEnd() {
    isDragging.current = false
  }

  function handleToggleLike(song: Song) {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(song.id)) {
        next.delete(song.id)
        toast('已取消喜欢', 'info')
      } else {
        next.add(song.id)
        toast('已添加到喜欢列表', 'success')
      }
      saveLikedIds(next)
      return next
    })
  }

  function cyclePlayMode() {
    const modes: PlayMode[] = ['sequence', 'shuffle', 'repeat']
    const idx = modes.indexOf(playMode)
    const next = modes[(idx + 1) % modes.length]
    setPlayMode(next)
    const labels = { sequence: '列表循环', shuffle: '随机播放', repeat: '单曲循环' }
    toast(labels[next], 'info')
  }

  // ============================================================
  // Progress
  // ============================================================

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // ============================================================
  // Render
  // ============================================================

  const PlayModeIcon = playMode === 'shuffle' ? Shuffle : playMode === 'repeat' ? Repeat1 : Repeat

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          {view !== 'home' && (
            <button
              onClick={() => { setView('home'); setSelectedPlaylist(null); setSearchResults([]) }}
              className="btn-icon-sm rounded-lg"
              aria-label="返回"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <Cloud size={18} className="text-accent-blue" />
            <h2 className="heading-md">云Time</h2>
          </div>
        </div>
        <span className="caption text-text-muted">网易云音乐</span>
      </div>

      {/* ---- Search Bar ---- */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索歌曲、歌手..."
            className="input-glass pl-9 pr-8 py-2 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setView('home') }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label="清除"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Content Area ---- */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-danger/10 text-accent-danger text-sm mb-3">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 hover:opacity-70">
              <X size={14} />
            </button>
          </div>
        )}

        {/* === HOME VIEW === */}
        {view === 'home' && (
          <>
            {/* Recommended Playlists */}
            <section className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Music size={14} className="text-accent-purple" />
                  推荐歌单
                </h3>
                <button
                  onClick={loadRecommendedPlaylists}
                  className="caption text-text-muted hover:text-accent-blue transition-colors"
                  disabled={loadingPlaylists}
                >
                  {loadingPlaylists ? '加载中...' : '刷新'}
                </button>
              </div>

              {loadingPlaylists ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[140px] md:w-[160px]">
                      <div className="skeleton aspect-square rounded-xl mb-2" />
                      <div className="skeleton h-3 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                  {playlists.map((pl) => (
                    <PlaylistCard
                      key={pl.id}
                      playlist={pl}
                      onClick={() => loadPlaylistDetail(pl.id)}
                    />
                  ))}
                  {playlists.length === 0 && !error && (
                    <p className="text-text-muted text-sm py-4">暂无推荐歌单</p>
                  )}
                </div>
              )}
            </section>

            {/* Quick liked songs hint */}
            {likedIds.size > 0 && (
              <div className="p-3 rounded-xl bg-accent-pink/5 border border-accent-pink/10">
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Heart size={12} className="text-accent-pink" fill="currentColor" />
                  已收藏 {likedIds.size} 首歌曲
                </p>
              </div>
            )}
          </>
        )}

        {/* === SEARCH VIEW === */}
        {view === 'search' && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">
                搜索结果
                {searchResults.length > 0 && (
                  <span className="text-text-muted ml-1">({searchResults.length})</span>
                )}
              </h3>
            </div>

            {loadingSearch ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-accent-blue animate-spin" />
                <span className="text-text-muted text-sm ml-2">搜索中...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-0.5">
                {searchResults.map((song, idx) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={idx}
                    isActive={currentSong?.id === song.id}
                    isLiked={likedIds.has(song.id)}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPlay={() => handlePlaySong(song, searchResults, idx)}
                    onToggleLike={() => handleToggleLike(song)}
                  />
                ))}
              </div>
            ) : !error ? (
              <div className="text-center py-12 text-text-muted text-sm">
                输入关键词开始搜索
              </div>
            ) : null}
          </section>
        )}

        {/* === PLAYLIST VIEW === */}
        {view === 'playlist' && selectedPlaylist && (
          <section>
            {/* Playlist Header */}
            <div className="flex gap-3 mb-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-bg-tertiary">
                <img
                  src={selectedPlaylist.coverImgUrl}
                  alt={selectedPlaylist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {selectedPlaylist.name}
                </h3>
                {selectedPlaylist.description && (
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                    {selectedPlaylist.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {selectedPlaylist.trackCount != null && (
                    <span className="caption text-text-muted">{selectedPlaylist.trackCount} 首</span>
                  )}
                  <span className="caption text-text-muted">{formatCount(selectedPlaylist.playCount)} 次播放</span>
                </div>
                <button
                  onClick={() => {
                    if (selectedPlaylist.tracks.length > 0) {
                      playSong(selectedPlaylist.tracks[0], selectedPlaylist.tracks, 0)
                    }
                  }}
                  className="btn btn-primary btn-sm mt-2"
                  disabled={loadingPlaylistDetail || selectedPlaylist.tracks.length === 0}
                >
                  <Play size={13} fill="white" />
                  播放全部
                </button>
              </div>
            </div>

            {/* Track List */}
            {loadingPlaylistDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-accent-blue animate-spin" />
              </div>
            ) : selectedPlaylist.tracks.length > 0 ? (
              <div className="space-y-0.5">
                {selectedPlaylist.tracks.map((song, idx) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={idx}
                    isActive={currentSong?.id === song.id}
                    isLiked={likedIds.has(song.id)}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPlay={() => handlePlaySong(song, selectedPlaylist.tracks, idx)}
                    onToggleLike={() => handleToggleLike(song)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted text-sm">
                歌单暂无歌曲
              </div>
            )}
          </section>
        )}
      </div>

      {/* ============================================================ */}
      {/* ---- Bottom Player Bar ---- */}
      {/* ============================================================ */}
      {currentSong && (
        <div className="shrink-0 border-t border-border">
          {/* Lyrics Toggle (collapsible) */}
          {showLyrics && (
            <div className="px-4 border-b border-border/50 animate-slide-up">
              <LyricsDisplay lyrics={lyrics} currentTime={currentTime} />
            </div>
          )}

          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="h-1.5 bg-white/5 cursor-pointer group relative"
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
              {/* Scrubber handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Song info */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="flex items-center gap-2 min-w-0 flex-1 group/lyric"
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-bg-tertiary">
                {currentSong.album.picUrl ? (
                  <img
                    src={currentSong.album.picUrl}
                    alt={currentSong.name}
                    className={cn(
                      'w-full h-full object-cover transition-transform',
                      isPlaying && 'animate-spin',
                      // Only spin slowly for album art, not a vinyl
                    )}
                    style={{ animationDuration: '8s' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={16} className="text-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-primary truncate max-w-[140px] md:max-w-[200px]">
                  {currentSong.name}
                </p>
                <p className="text-[10px] text-text-muted truncate max-w-[140px] md:max-w-[200px]">
                  {artistNames(currentSong)}
                </p>
              </div>
            </button>

            {/* Center controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="btn-icon-sm rounded-lg"
                aria-label="上一首"
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
              </button>

              <button
                onClick={handleNext}
                className="btn-icon-sm rounded-lg"
                aria-label="下一首"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-0.5">
              {/* Play mode */}
              <button
                onClick={cyclePlayMode}
                className={cn(
                  'btn-icon-sm rounded-lg hidden sm:flex',
                  playMode !== 'sequence' ? 'text-accent-blue' : '',
                )}
                aria-label="播放模式"
                title={playMode === 'sequence' ? '列表循环' : playMode === 'shuffle' ? '随机播放' : '单曲循环'}
              >
                <PlayModeIcon size={15} />
              </button>

              {/* Like */}
              <button
                onClick={() => handleToggleLike(currentSong)}
                className={cn(
                  'btn-icon-sm rounded-lg',
                  likedIds.has(currentSong.id) ? 'text-accent-pink' : '',
                )}
                aria-label={likedIds.has(currentSong.id) ? '取消喜欢' : '喜欢'}
              >
                <Heart size={15} fill={likedIds.has(currentSong.id) ? 'currentColor' : 'none'} />
              </button>

              {/* Volume */}
              <div className="hidden md:flex items-center gap-1 group/vol">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.6)}
                  className="btn-icon-sm rounded-lg"
                  aria-label={volume > 0 ? '静音' : '取消静音'}
                >
                  {volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
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
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    aria-label="音量"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-[10px] text-text-muted tabular-nums ml-1 hidden sm:inline">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
