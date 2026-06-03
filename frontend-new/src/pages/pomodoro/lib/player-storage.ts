/**
 * Player state persistence for CloudTime music player.
 * Stores playback state to localStorage and restores on app startup.
 */

import type { PlayMode, Song } from './netease-api'

// ============================================================
// Storage Keys
// ============================================================

const LIKED_KEY = 'cloudtime_liked_songs'
const VOLUME_KEY = 'cloudtime_volume'
const PLAY_MODE_KEY = 'cloudtime_play_mode'
const CURRENT_SONG_ID_KEY = 'cloudtime_current_song_id'
const CURRENT_TIME_KEY = 'cloudtime_current_time'
const PLAYLIST_KEY = 'cloudtime_playlist'
const CURRENT_INDEX_KEY = 'cloudtime_current_index'

// ============================================================
// Player State (new keys)
// ============================================================

/** Save playback state: current song, progress, queue, and index. */
export function savePlayerState(state: {
  currentSongId: number | null
  currentTime: number
  playlist: number[]  // song ID array
  currentIndex: number
}): void {
  try {
    localStorage.setItem(CURRENT_SONG_ID_KEY, JSON.stringify(state.currentSongId))
    localStorage.setItem(CURRENT_TIME_KEY, JSON.stringify(state.currentTime))
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(state.playlist))
    localStorage.setItem(CURRENT_INDEX_KEY, JSON.stringify(state.currentIndex))
  } catch {
    // localStorage may be full or unavailable
  }
}

/** Load playback state. Returns safe defaults if nothing stored or data is corrupted. */
export function loadPlayerState(): {
  currentSongId: number | null
  currentTime: number
  playlist: number[]
  currentIndex: number
} {
  const defaults = {
    currentSongId: null as number | null,
    currentTime: 0,
    playlist: [] as number[],
    currentIndex: 0,
  }

  try {
    const songRaw = localStorage.getItem(CURRENT_SONG_ID_KEY)
    const timeRaw = localStorage.getItem(CURRENT_TIME_KEY)
    const listRaw = localStorage.getItem(PLAYLIST_KEY)
    const indexRaw = localStorage.getItem(CURRENT_INDEX_KEY)

    if (songRaw !== null) {
      const id = JSON.parse(songRaw)
      if (typeof id === 'number' || id === null) defaults.currentSongId = id
    }
    if (timeRaw !== null) {
      const t = JSON.parse(timeRaw)
      if (typeof t === 'number' && isFinite(t) && t >= 0) defaults.currentTime = t
    }
    if (listRaw !== null) {
      const arr = JSON.parse(listRaw)
      if (Array.isArray(arr) && arr.every((v: unknown) => typeof v === 'number')) {
        defaults.playlist = arr
      }
    }
    if (indexRaw !== null) {
      const i = JSON.parse(indexRaw)
      if (typeof i === 'number' && Number.isInteger(i) && i >= 0) defaults.currentIndex = i
    }
  } catch {
    // Corrupted data — return defaults
  }

  return defaults
}

/** Clear all player state from localStorage. */
export function clearPlayerState(): void {
  try {
    localStorage.removeItem(CURRENT_SONG_ID_KEY)
    localStorage.removeItem(CURRENT_TIME_KEY)
    localStorage.removeItem(PLAYLIST_KEY)
    localStorage.removeItem(CURRENT_INDEX_KEY)
  } catch {}
}

// ============================================================
// Existing helpers (preserved from CloudTime.tsx)
// ============================================================

export function loadLikedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKED_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set()
}

export function saveLikedIds(ids: Set<number>): void {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]))
  } catch {}
}

export function loadVolume(): number {
  try {
    const v = localStorage.getItem(VOLUME_KEY)
    if (v !== null) return Math.max(0, Math.min(1, Number(v)))
  } catch {}
  return 0.6
}

export function loadPlayMode(): PlayMode {
  try {
    const m = localStorage.getItem(PLAY_MODE_KEY)
    if (m === 'sequence' || m === 'shuffle' || m === 'repeat') return m
  } catch {}
  return 'sequence'
}

// ============================================================
// Recently Played
// ============================================================

const RECENTLY_PLAYED_KEY = 'cloudtime_recently_played'

export function loadRecentlyPlayed(): Song[] {
  try {
    const raw = localStorage.getItem(RECENTLY_PLAYED_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function saveRecentlyPlayed(songs: Song[]): void {
  try {
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(songs.slice(0, 20)))
  } catch {}
}

// ============================================================
// Search History
// ============================================================

const SEARCH_HISTORY_KEY = 'cloudtime_search_history'

export function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function saveSearchHistory(history: string[]): void {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 10)))
  } catch {}
}

export function addSearchKeyword(keyword: string): string[] {
  const history = loadSearchHistory()
  const filtered = history.filter(k => k !== keyword)
  const next = [keyword, ...filtered].slice(0, 10)
  saveSearchHistory(next)
  return next
}

export function removeSearchKeyword(keyword: string): string[] {
  const history = loadSearchHistory().filter(k => k !== keyword)
  saveSearchHistory(history)
  return history
}
