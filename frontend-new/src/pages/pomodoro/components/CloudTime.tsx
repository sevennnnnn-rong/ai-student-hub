import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, X, ChevronLeft, Loader2, AlertCircle, Cloud,
  LogIn, LogOut, User, ChevronDown,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/Toast'
import { sendNotification } from '../../../lib/notify'
import MiniPlayer from './MiniPlayer'
import PlaylistDrawer from './PlaylistDrawer'
import LoginModal from './LoginModal'
import NowPlayingView from './NowPlayingView'
import HomeView from './HomeView'
import SearchView from './SearchView'
import PlaylistDetailView from './PlaylistDetailView'
import {
  searchSongs, searchPlaylists, getRecommendedPlaylists, getPlaylistDetail,
  getSongUrls, getSongDetail, getLyrics,
  checkLoginStatus,
  logout as apiLogout,
  getUserPlaylists, getUserLikes,
  getDailyRecommend, getToplists,
  type Song, type Playlist, type LyricLine, type PlayMode,
  type LoginProfile, type Toplist,
} from '../lib/netease-api'
import {
  loadLikedIds, saveLikedIds, loadVolume, loadPlayMode,
  savePlayerState, loadPlayerState, clearPlayerState,
  loadRecentlyPlayed, saveRecentlyPlayed,
  loadSearchHistory, addSearchKeyword, removeSearchKeyword,
} from '../lib/player-storage'
import ErrorBoundary from './ErrorBoundary'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

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
// Utility
// ============================================================

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
  const [playlistSearchResults, setPlaylistSearchResults] = useState<Playlist[]>([])
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
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => loadRecentlyPlayed())

  // --- Login State ---
  const [isLogin, setIsLogin] = useState(false)
  const [userProfile, setUserProfile] = useState<LoginProfile | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loadingUserPlaylists, setLoadingUserPlaylists] = useState(false)
  const [loadingUserLikes, setLoadingUserLikes] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([])
  const [userLikes, setUserLikes] = useState<Song[]>([])

  // --- Daily Recommend ---
  const [dailyRecommend, setDailyRecommend] = useState<Song[]>([])
  const [loadingDailyRecommend, setLoadingDailyRecommend] = useState(false)

  // --- Toplists ---
  const [toplists, setToplists] = useState<Toplist[]>([])
  const [loadingToplists, setLoadingToplists] = useState(false)

  // --- UI State ---
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showQueueDrawer, setShowQueueDrawer] = useState(false)
  const [showNowPlaying, setShowNowPlaying] = useState(false)

  // --- Search History ---
  const [searchHistory, setSearchHistory] = useState<string[]>(() => loadSearchHistory())

  // --- Sleep Timer ---
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null)
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null)
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentIndexRef = useRef(currentIndex)
  const handleSongEndRef = useRef<() => void>(() => {})
  const handleNextRef = useRef<() => void>(() => {})

  // --- Debounced search ---
  const debouncedQuery = useDebounce(searchQuery, 400)

  // --- Keyboard shortcuts ---
  useKeyboardShortcuts({
    togglePlay: handleTogglePlay,
    next: handleNext,
    prev: handlePrev,
    seekForward: (sec) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + sec, duration)
      }
    },
    seekBackward: (sec) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - sec, 0)
      }
    },
    volumeUp: () => setVolume(v => Math.min(1, v + 0.05)),
    volumeDown: () => setVolume(v => Math.max(0, v - 0.05)),
    closeNowPlaying: () => setShowNowPlaying(false),
    toggleMute: () => setVolume(v => v > 0 ? 0 : 0.6),
    toggleLike: () => { if (currentSong) handleToggleLike(currentSong) },
    focusSearch: () => {
      const input = containerRef.current?.querySelector('input[type="text"]') as HTMLInputElement
      input?.focus()
    },
    cyclePlayMode: cyclePlayMode,
  })

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    localStorage.setItem('cloudtime_volume', String(volume))
  }, [volume])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    localStorage.setItem('cloudtime_play_mode', playMode)
  }, [playMode])

  useEffect(() => {
    if (currentSong) {
      savePlayerState({
        currentSongId: currentSong.id,
        currentTime,
        playlist: playlist.map(s => s.id),
        currentIndex,
      })
    }
  }, [currentSong, currentTime, currentIndex])

  // Audio element
  useEffect(() => {
    let audio = audioRef.current
    if (!audio) {
      audio = new Audio()
      audio.preload = 'auto'
      audioRef.current = audio
    }

    const onTimeUpdate = () => setCurrentTime(audio!.currentTime)
    const onDurationChange = () => setDuration(audio!.duration || 0)
    const onEnded = () => handleSongEndRef.current()
    const onError = () => {
      const err = audio!.error
      console.error('[CloudTime] Audio error:', err?.code, err?.message, 'src:', audio!.src?.slice(0, 80))
      toast('歌曲无法播放，自动跳过', 'error')
      setTimeout(() => handleNextRef.current(), 500)
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
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => { checkLogin() }, [])

  // Restore last playing song and queue on mount
  useEffect(() => {
    const saved = loadPlayerState()
    const sid = saved.currentSongId
    if (sid == null) return
    ;(async () => {
      try {
        const allIds = saved.playlist.length > 0 ? saved.playlist : [sid]
        const songs = await getSongDetail(allIds)
        if (songs.length > 0) {
          const idsToFetch = songs.map(s => s.id)
          const urlMap = await getSongUrls(idsToFetch)
          const restoredPlaylist = songs.map(s => ({
            ...s,
            url: urlMap.get(s.id),
          })).filter(s => s.url)
          if (restoredPlaylist.length === 0) return
          const restoredIdx = Math.min(saved.currentIndex, restoredPlaylist.length - 1)
          const current = restoredPlaylist[restoredIdx]
          setCurrentSong(current)
          setPlaylist(restoredPlaylist)
          setCurrentIndex(restoredIdx)
          setIsPlaying(true)
          const audio = audioRef.current
          if (audio && current.url) {
            audio.src = current.url
            try {
              await audio.play()
              if (saved.currentTime > 0) audio.currentTime = saved.currentTime
            } catch { /* autoplay blocked */ }
          }
        }
      } catch { /* silent fail */ }
    })()
  }, [])

  useEffect(() => {
    if (isLogin) { loadUserPlaylists(); loadUserLikes(); loadDailyRecommend() }
  }, [isLogin])

  useEffect(() => { loadRecommendedPlaylists(); loadToplists() }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery.trim())
    } else if (view === 'search') {
      setView('home')
    }
  }, [debouncedQuery])

  useEffect(() => {
    if (currentSong) loadLyrics(currentSong.id)
    else setLyrics([])
  }, [currentSong?.id])

  // ============================================================
  // Sleep Timer
  // ============================================================

  function startSleepTimer(minutes: number) {
    cancelSleepTimer()
    const totalSeconds = minutes * 60
    setSleepTimerMinutes(minutes)
    setSleepTimerRemaining(totalSeconds)
    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          cancelSleepTimer()
          const audio = audioRef.current
          if (audio) { audio.pause() }
          setIsPlaying(false)
          toast('睡眠定时器到期，已暂停播放', 'info')
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function cancelSleepTimer() {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current)
      sleepTimerRef.current = null
    }
    setSleepTimerMinutes(null)
    setSleepTimerRemaining(null)
  }

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current)
    }
  }, [])

  // ============================================================
  // Data Fetching
  // ============================================================

  async function checkLogin() {
    try {
      const status = await checkLoginStatus()
      setIsLogin(status.isLogin)
      if (status.profile) setUserProfile(status.profile)
    } catch { /* optional */ }
  }

  async function loadUserPlaylists() {
    setLoadingUserPlaylists(true)
    try { setUserPlaylists(await getUserPlaylists(30)) }
    catch (err) { console.error('Failed to load user playlists:', err) }
    finally { setLoadingUserPlaylists(false) }
  }

  async function loadUserLikes() {
    setLoadingUserLikes(true)
    try { setUserLikes(await getUserLikes()) }
    catch (err) { console.error('Failed to load user likes:', err) }
    finally { setLoadingUserLikes(false) }
  }

  async function loadDailyRecommend() {
    setLoadingDailyRecommend(true)
    try { setDailyRecommend(await getDailyRecommend()) }
    catch (err) { console.error('Failed to load daily recommend:', err) }
    finally { setLoadingDailyRecommend(false) }
  }

  async function loadToplists() {
    setLoadingToplists(true)
    try { setToplists(await getToplists()) }
    catch (err) { console.error('Failed to load toplists:', err) }
    finally { setLoadingToplists(false) }
  }

  async function handleLogout() {
    try {
      await apiLogout()
      setIsLogin(false)
      setUserProfile(null)
      setUserPlaylists([])
      setUserLikes([])
      setShowUserMenu(false)
      toast('已登出', 'info')
    } catch { toast('登出失败', 'error') }
  }

  function handleLoginSuccess(profile: LoginProfile) {
    setIsLogin(true)
    setUserProfile(profile)
    setShowLoginModal(false)
  }

  async function loadRecommendedPlaylists() {
    setLoadingPlaylists(true)
    setError(null)
    try { setPlaylists(await getRecommendedPlaylists(12)) }
    catch { setError('加载推荐歌单失败，请检查网络连接') }
    finally { setLoadingPlaylists(false) }
  }

  async function performSearch(keywords: string) {
    setLoadingSearch(true)
    setError(null)
    setView('search')
    setSearchHistory(addSearchKeyword(keywords))
    try {
      const [songResult, playlistResult] = await Promise.all([
        searchSongs(keywords, 30),
        searchPlaylists(keywords, 20),
      ])
      setSearchResults(songResult.songs)
      setPlaylistSearchResults(playlistResult.playlists)
      if (songResult.songs.length === 0 && playlistResult.playlists.length === 0) {
        toast('未找到相关结果', 'info')
      }
    } catch { setError('搜索失败，请稍后重试') }
    finally { setLoadingSearch(false) }
  }

  async function loadPlaylistDetail(id: number) {
    setLoadingPlaylistDetail(true)
    setError(null)
    try {
      const detail = await getPlaylistDetail(id)
      setSelectedPlaylist(detail)
      setView('playlist')
    } catch (err: any) {
      const msg = err?.message || '未知错误'
      if (msg.includes('502')) setError('歌单数据过大，加载超时，请稍后重试')
      else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) setError('网络连接失败，请检查后端服务是否运行')
      else setError('加载歌单详情失败')
    } finally { setLoadingPlaylistDetail(false) }
  }

  async function loadLyrics(id: number) {
    try { setLyrics(await getLyrics(id)) }
    catch { setLyrics([]) }
  }

  // ============================================================
  // Playback Logic
  // ============================================================

  function recordRecentlyPlayed(song: Song) {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.id !== song.id)
      const next = [song, ...filtered].slice(0, 20)
      saveRecentlyPlayed(next)
      return next
    })
  }

  async function playSong(song: Song, source: Song[], idx: number) {
    setPlaylist(source)
    setCurrentIndex(idx)

    if (!song.url) {
      try {
        const urlMap = await getSongUrls(song.id)
        const url = urlMap.get(song.id)
        if (!url) {
          toast(`${song.name} 暂无版权，跳过`, 'error')
          if (source.length > 1) {
            const nextIdx = nextIndex(idx, source.length, playMode)
            setTimeout(() => playSong(source[nextIdx], source, nextIdx), 300)
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
    recordRecentlyPlayed(song)
    sendNotification('正在播放', `${song.name} - ${artistNames(song)}`)

    const audio = audioRef.current
    if (audio && song.url) {
      audio.src = song.url
      audio.play().catch((err) => {
        console.error('[CloudTime] Audio play failed:', err)
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
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play().catch(() => toast('播放失败', 'error')); setIsPlaying(true) }
  }

  function handleNext() {
    if (playlist.length === 0) return
    const idx = nextIndex(currentIndex, playlist.length, playMode)
    playSong(playlist[idx], playlist, idx)
  }
  handleNextRef.current = handleNext

  function handlePrev() {
    if (playlist.length === 0) return
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; setCurrentTime(0); return }
    const idx = prevIndex(currentIndex, playlist.length, playMode)
    playSong(playlist[idx], playlist, idx)
  }

  function handleSongEnd() {
    if (playMode === 'repeat') {
      const audio = audioRef.current
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}) }
      return
    }
    handleNext()
  }
  handleSongEndRef.current = handleSongEnd

  function handleToggleLike(song: Song) {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(song.id)) { next.delete(song.id); toast('已取消喜欢', 'info') }
      else { next.add(song.id); toast('已添加到喜欢列表', 'success') }
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
  // Queue Management
  // ============================================================

  function handleReorderQueue(fromIndex: number, toIndex: number) {
    setPlaylist(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      const cur = currentIndexRef.current
      if (cur === fromIndex) setCurrentIndex(toIndex)
      else if (fromIndex < cur && toIndex >= cur) setCurrentIndex(cur - 1)
      else if (fromIndex > cur && toIndex <= cur) setCurrentIndex(cur + 1)
      return next
    })
  }

  function handleRemoveSongFromQueue(index: number) {
    setPlaylist(prev => {
      const next = prev.filter((_, i) => i !== index)
      const cur = currentIndexRef.current
      if (index < cur) setCurrentIndex(cur - 1)
      else if (index === cur) {
        if (next.length > 0) {
          const newIdx = Math.min(index, next.length - 1)
          setCurrentIndex(newIdx)
          setTimeout(() => playSong(next[newIdx], next, newIdx), 0)
        } else {
          setCurrentIndex(-1)
          setCurrentSong(null)
          setIsPlaying(false)
        }
      }
      return next
    })
  }

  function handleClearQueue() {
    setPlaylist([])
    setCurrentIndex(-1)
    setCurrentSong(null)
    setIsPlaying(false)
    clearPlayerState()
    toast('播放队列已清空', 'info')
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <ErrorBoundary fallbackTitle="云Time 出错了">
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
            <h2 className='heading-md'>云Time</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className='caption text-text-muted hidden sm:inline'>网易云音乐</span>

          {isLogin && userProfile ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-bg-panel-hover transition-colors"
              >
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.nickname} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center">
                    <User size={12} className="text-accent-blue" />
                  </div>
                )}
                <span className="text-xs text-text-primary max-w-[80px] truncate hidden md:inline">{userProfile.nickname}</span>
                <ChevronDown size={12} className="text-text-muted" />
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-bg-panel border border-border rounded-xl shadow-xl z-50 py-1">
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-xs text-text-primary font-medium truncate">{userProfile.nickname}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-panel-hover transition-colors"
                    >
                      <LogOut size={12} />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs hover:bg-accent-blue/20 transition-colors"
            >
              <LogIn size={13} />
              <span className='hidden sm:inline'>登录</span>
            </button>
          )}
        </div>
      </div>

      {/* ---- Search Bar ---- */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='搜索歌曲、歌手...'
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
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-danger/10 text-accent-danger text-sm mb-3">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 hover:opacity-70"><X size={14} /></button>
          </div>
        )}

        {view === 'home' && (
          <HomeView
            isLogin={isLogin}
            playlists={playlists}
            loadingPlaylists={loadingPlaylists}
            userPlaylists={userPlaylists}
            loadingUserPlaylists={loadingUserPlaylists}
            userLikes={userLikes}
            loadingUserLikes={loadingUserLikes}
            likedIds={likedIds}
            currentSong={currentSong}
            isPlaying={isPlaying}
            recentlyPlayed={recentlyPlayed}
            dailyRecommend={dailyRecommend}
            loadingDailyRecommend={loadingDailyRecommend}
            toplists={toplists}
            loadingToplists={loadingToplists}
            onSelectPlaylist={loadPlaylistDetail}
            onPlaySong={handlePlaySong}
            onToggleLike={handleToggleLike}
            onRefreshPlaylists={loadRecommendedPlaylists}
            onOpenLogin={() => setShowLoginModal(true)}
          />
        )}

        {view === 'search' && (
          <SearchView
            results={searchResults}
            playlistResults={playlistSearchResults}
            loading={loadingSearch}
            currentSong={currentSong}
            isPlaying={isPlaying}
            likedIds={likedIds}
            searchHistory={searchHistory}
            onPlaySong={handlePlaySong}
            onToggleLike={handleToggleLike}
            onSelectPlaylist={loadPlaylistDetail}
            onSelectHistory={(keyword) => { setSearchQuery(keyword) }}
            onRemoveHistory={(keyword) => { setSearchHistory(removeSearchKeyword(keyword)) }}
          />
        )}

        {view === 'playlist' && selectedPlaylist && (
          <PlaylistDetailView
            playlist={selectedPlaylist}
            loading={loadingPlaylistDetail}
            currentSong={currentSong}
            isPlaying={isPlaying}
            likedIds={likedIds}
            onPlaySong={handlePlaySong}
            onToggleLike={handleToggleLike}
            onPlayAll={() => {
              if (selectedPlaylist.tracks.length > 0) {
                playSong(selectedPlaylist.tracks[0], selectedPlaylist.tracks, 0)
              }
            }}
            onShufflePlay={() => {
              if (selectedPlaylist.tracks.length > 0) {
                const idx = Math.floor(Math.random() * selectedPlaylist.tracks.length)
                playSong(selectedPlaylist.tracks[idx], selectedPlaylist.tracks, idx)
              }
            }}
          />
        )}
      </div>

      {/* ---- MiniPlayer ---- */}
      <MiniPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        playMode={playMode}
        lyrics={lyrics}
        sleepTimerMinutes={sleepTimerMinutes}
        sleepTimerRemaining={sleepTimerRemaining}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={(time) => {
          if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time) }
        }}
        onVolumeChange={setVolume}
        onPlayModeChange={cyclePlayMode}
        onOpenQueue={() => setShowQueueDrawer(true)}
        onOpenNowPlaying={() => setShowNowPlaying(true)}
        onStartSleepTimer={startSleepTimer}
        onCancelSleepTimer={cancelSleepTimer}
      />

      {/* ---- Playlist Drawer ---- */}
      <PlaylistDrawer
        isOpen={showQueueDrawer}
        playlist={playlist}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        onClose={() => setShowQueueDrawer(false)}
        onPlaySong={(idx) => playSong(playlist[idx], playlist, idx)}
        onRemoveSong={handleRemoveSongFromQueue}
        onClearPlaylist={handleClearQueue}
        onReorder={handleReorderQueue}
      />

      {/* ---- Login Modal ---- */}
      {showLoginModal && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* ---- Now Playing Full Screen ---- */}
      {showNowPlaying && currentSong && (
        <NowPlayingView
          currentSong={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          playMode={playMode}
          lyrics={lyrics}
          isLiked={likedIds.has(currentSong.id)}
          sleepTimerMinutes={sleepTimerMinutes}
          sleepTimerRemaining={sleepTimerRemaining}
          onClose={() => setShowNowPlaying(false)}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={(time) => {
            if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time) }
          }}
          onVolumeChange={setVolume}
          onPlayModeChange={cyclePlayMode}
          onToggleLike={() => handleToggleLike(currentSong)}
          onStartSleepTimer={startSleepTimer}
          onCancelSleepTimer={cancelSleepTimer}
        />
      )}
    </div>
    </ErrorBoundary>
  )
}

