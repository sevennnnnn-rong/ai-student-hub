// ============================================================
// NetEase Cloud Music API Wrapper
// Based on NeteaseCloudMusicApi public instances
// ============================================================

const API_BASE = 'https://netease-cloud-music-api-iota.vercel.app'

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

// ---------- Internal Helpers ----------

interface ApiResponse<T> {
  code: number
  result?: T
  data?: T
  msg?: string
}

async function apiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v))
    })
  }

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  const json: ApiResponse<T> = await res.json()

  if (json.code !== 200 && json.code !== 0) {
    throw new Error(json.msg || `API error code: ${json.code}`)
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

// ---------- Public API ----------

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
  const data = await apiGet<any>('/playlist/detail', { id })
  const playlist = data.playlist || data
  return {
    ...mapPlaylist(playlist),
    tracks: (playlist.tracks || []).map(mapSong),
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

  const list = data.data || data || []
  for (const item of list) {
    if (item.url) {
      urlMap.set(item.id, item.url)
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

// ---------- Utility Exports ----------

export { formatCount }
