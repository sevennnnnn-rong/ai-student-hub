// ============================================================
// NetEase Cloud Music API Wrapper
// Routes through backend proxy (localhost:8000/api/music)
// which forwards to local NeteaseCloudMusicApi (localhost:3002)
// ============================================================

const API_BASE = 'http://localhost:8000/api/music'

// ---------- Types ----------

export interface Artist {
  id: number
  name: string
  alias?: string[]
}

export interface Album {
  id: number
  name: string
  picUrl: string
  artist?: Artist
}

export interface Song {
  id: number
  name: string
  artists: Artist[]
  album: Album
  duration: number // milliseconds
  url?: string
  isLiked?: boolean
}

export interface Playlist {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  creator?: { nickname: string; avatarUrl: string }
  description?: string
  trackCount?: number
  tracks?: Song[]
}

export interface LyricLine {
  time: number // seconds
  text: string
}

export interface SearchResult {
  songs: Song[]
  songCount: number
}

export interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playMode: 'sequence' | 'shuffle' | 'repeat'
  playlist: Song[]
  currentIndex: number
}

export type PlayMode = PlayerState['playMode']

export interface LoginProfile {
  userId: number
  nickname: string
  avatarUrl: string
}

export interface LoginStatus {
  isLogin: boolean
  profile?: LoginProfile
}

// ---------- Internal Helpers ----------

interface ApiResponse<T> {
  code: number
  result?: T
  data?: T
  msg?: string
  message?: string
}

async function apiGet<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v))
    })
  }

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  const json: ApiResponse<T> = await res.json()

  if (json.code !== 200 && json.code !== 0) {
    throw new Error(json.msg || json.message || `API error code: ${json.code}`)
  }

  return (json.result ?? json.data) as T
}

/** Like apiGet but returns the full JSON response without checking code.
 *  Used for endpoints where non-200 codes are valid responses (e.g. QR status: 800/801/802/803). */
async function apiGetAny(path: string, params?: Record<string, string | number | boolean>): Promise<any> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v))
    })
  }

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  return await res.json()
}

async function apiPost<T>(path: string, body?: Record<string, any>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  const json: ApiResponse<T> = await res.json()

  if (json.code !== 200 && json.code !== 0) {
    throw new Error(json.msg || json.message || `API error code: ${json.code}`)
  }

  return (json.result ?? json.data) as T
}

// ---------- Mapping Helpers ----------

function mapSong(raw: any): Song {
  return {
    id: raw.id,
    name: raw.name || raw.songName || '未知歌曲',
    artists: (raw.ar || raw.artists || []).map((a: any) => ({
      id: a.id,
      name: a.name || '未知歌手',
    })),
    album: {
      id: raw.al?.id ?? raw.album?.id ?? 0,
      name: raw.al?.name ?? raw.album?.name ?? '未知专辑',
      picUrl: raw.al?.picUrl ?? raw.album?.picUrl ?? '',
    },
    duration: raw.dt || raw.duration || 0,
  }
}

function mapPlaylist(raw: any): Playlist {
  return {
    id: raw.id,
    name: raw.name || '未知歌单',
    coverImgUrl: raw.coverImgUrl || raw.picUrl || '',
    playCount: raw.playCount || 0,
    creator: raw.creator,
    description: raw.description,
    trackCount: raw.trackCount,
  }
}

function formatCount(count: number): string {
  if (count >= 100_000_000) return `${(count / 100_000_000).toFixed(1)}亿`
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}万`
  return String(count)
}

// ---------- Auth API ----------

/**
 * Check current login status
 */
export async function checkLoginStatus(): Promise<LoginStatus> {
  try {
    const data = await apiGet<any>('/login/status')
    return {
      isLogin: data?.isLogin ?? false,
      profile: data?.profile,
    }
  } catch {
    return { isLogin: false }
  }
}

/**
 * Get QR code key for login
 */
export async function getQrKey(): Promise<{ unikey: string; qrimg: string }> {
  const data = await apiGet<any>('/login/qr/key')
  return data
}

/**
 * Create QR code image
 */
export async function createQrCode(key: string): Promise<{ qrimg: string; qrurl: string }> {
  const data = await apiGet<any>('/login/qr/create', { key, qrimg: true })
  return data
}

/**
 * Poll QR code scan status
 * Returns: code 800=expired, 801=waiting, 802=scanned, 803=confirmed
 * NOTE: uses apiGetAny because QR status codes (800-803) are NOT standard API codes.
 */
export async function checkQrStatus(key: string): Promise<{ code: number; message: string }> {
  const json = await apiGetAny('/login/qr/check', { key })
  // Backend wraps as {code: 200, result: {code: 801, message: "..."}}
  return json.result ?? json.data ?? json
}

/**
 * Login with phone number
 */
export async function loginWithPhone(
  phone: string,
  password?: string,
): Promise<{ isLogin: boolean; profile?: LoginProfile; message?: string }> {
  const data = await apiPost<any>('/login/phone', { phone, password })
  return data
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  await apiPost<any>('/logout')
}

// ---------- Music API ----------

/**
 * Search songs by keyword
 */
export async function searchSongs(
  keywords: string,
  limit = 30,
  offset = 0,
): Promise<SearchResult> {
  const data = await apiGet<any>('/search', { keywords, limit, offset })
  return {
    songs: (data.songs || []).map(mapSong),
    songCount: data.songCount || 0,
  }
}

/**
 * Search playlists by keyword
 */
export async function searchPlaylists(
  keywords: string,
  limit = 30,
  offset = 0,
): Promise<{ playlists: Playlist[]; playlistCount: number }> {
  const data = await apiGet<any>('/search', { keywords, limit, offset, type: 1000 })
  return {
    playlists: (data.playlists || []).map(mapPlaylist),
    playlistCount: data.playlistCount || 0,
  }
}

/**
 * Get recommended playlists (personalized)
 */
export async function getRecommendedPlaylists(limit = 12): Promise<Playlist[]> {
  const data = await apiGet<any>('/personalized', { limit })
  return (data.result || data || []).map(mapPlaylist)
}

/**
 * Get playlist detail with tracks
 */
export async function getPlaylistDetail(id: number): Promise<Playlist & { tracks: Song[] }> {
  const data = await apiGet<any>(`/user/playlist/${id}`)
  return {
    ...mapPlaylist(data),
    tracks: (data.tracks || []).map(mapSong),
  }
}

/**
 * Get playable song URL(s)
 * Returns a map of songId -> url
 */
export async function getSongUrls(
  ids: number | number[],
): Promise<Map<number, string>> {
  const idStr = Array.isArray(ids) ? ids.join(',') : String(ids)
  const data = await apiGet<any>('/song/url', { id: idStr })
  const urlMap = new Map<number, string>()

  const list = data?.data || data || []
  if (!Array.isArray(list)) {
    console.warn('[netease-api] getSongUrls: unexpected data shape', data)
    return urlMap
  }
  for (const item of list) {
    if (item.url) {
      urlMap.set(item.id, item.url)
    } else {
      console.warn(`[netease-api] Song ${item.id} has no URL (code=${item.code}, fee=${item.fee})`)
    }
  }
  return urlMap
}

/**
 * Get lyrics for a song
 */
export async function getLyrics(id: number): Promise<LyricLine[]> {
  const data = await apiGet<any>('/lyric', { id })
  const lrc = data.lrc?.lyric || ''
  if (!lrc) return []

  const lines: LyricLine[] = []
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/

  for (const line of lrc.split('\n')) {
    const match = line.match(regex)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const ms = parseInt(match[3].padEnd(3, '0'), 10)
      const time = minutes * 60 + seconds + ms / 1000
      const text = match[4].trim()
      if (text) {
        lines.push({ time, text })
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time)
}

/**
 * Get song detail by IDs
 */
export async function getSongDetail(ids: number[]): Promise<Song[]> {
  const data = await apiGet<any>('/song/detail', { ids: ids.join(',') })
  return (data.songs || []).map(mapSong)
}

// ---------- Daily Recommend API ----------

/**
 * Get daily recommended songs (login required)
 */
export async function getDailyRecommend(): Promise<Song[]> {
  const data = await apiGet<any>('/recommend/songs')
  return (data?.data?.dailySongs || data?.dailySongs || []).map(mapSong)
}

// ---------- Toplist API ----------

export interface Toplist {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  description?: string
  trackCount?: number
}

/**
 * Get all toplists/rankings
 */
export async function getToplists(): Promise<Toplist[]> {
  const data = await apiGet<any>('/toplist')
  return (data?.list || []).map((item: any) => ({
    id: item.id,
    name: item.name || '未知榜单',
    coverImgUrl: item.coverImgUrl || '',
    playCount: item.playCount || 0,
    description: item.description,
    trackCount: item.trackCount,
  }))
}

// ---------- User Music API ----------

/**
 * Get user's playlists
 */
export async function getUserPlaylists(limit = 30, offset = 0): Promise<Playlist[]> {
  const data = await apiGet<any>('/user/playlists', { limit, offset })
  return (data.list || []).map(mapPlaylist)
}

/**
 * Get user's liked songs
 */
export async function getUserLikes(): Promise<Song[]> {
  const data = await apiGet<any>('/user/likes')
  return (data.songs || []).map(mapSong)
}

/**
 * Toggle like on a song
 */
export async function toggleLikeSong(id: number, like: boolean): Promise<void> {
  await apiGet<any>('/like', { id, like })
}

// ---------- Utility Exports ----------

export { formatCount }
