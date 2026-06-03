import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import SongRow from './SongRow'
import PlaylistCard from './PlaylistCard'
import { type Song, type Playlist } from '../lib/netease-api'

type SearchTab = 'songs' | 'playlists'

interface SearchViewProps {
  results: Song[]
  playlistResults: Playlist[]
  loading: boolean
  currentSong: Song | null
  isPlaying: boolean
  likedIds: Set<number>
  searchHistory: string[]
  onPlaySong: (song: Song, source: Song[], idx: number) => void
  onToggleLike: (song: Song) => void
  onSelectPlaylist: (id: number) => void
  onSelectHistory: (keyword: string) => void
  onRemoveHistory: (keyword: string) => void
}

export default function SearchView({
  results,
  playlistResults,
  loading,
  currentSong,
  isPlaying,
  likedIds,
  searchHistory,
  onPlaySong,
  onToggleLike,
  onSelectPlaylist,
  onSelectHistory,
  onRemoveHistory,
}: SearchViewProps) {
  const [tab, setTab] = useState<SearchTab>('songs')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-accent-blue animate-spin" />
        <span className="text-text-muted text-sm ml-2">搜索中...</span>
      </div>
    )
  }

  if (results.length === 0 && playlistResults.length === 0) {
    return (
      <div className="py-8">
        {searchHistory.length > 0 ? (
          <div>
            <p className="text-xs text-text-muted mb-3">搜索历史</p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-tertiary text-text-secondary text-xs cursor-pointer hover:bg-accent-blue/10 hover:text-accent-blue transition-colors group"
                >
                  <span onClick={() => onSelectHistory(keyword)}>{keyword}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveHistory(keyword) }}
                    className="text-text-muted hover:text-accent-danger transition-colors"
                    aria-label={`删除 ${keyword}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-text-muted text-sm">
            输入关键词开始搜索
          </div>
        )}
      </div>
    )
  }

  return (
    <section>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-tertiary rounded-xl mb-3">
        <button
          onClick={() => setTab('songs')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
            tab === 'songs'
              ? 'bg-accent-blue/15 text-accent-blue'
              : 'text-text-muted hover:text-text-secondary',
          )}
        >
          歌曲 ({results.length})
        </button>
        <button
          onClick={() => setTab('playlists')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
            tab === 'playlists'
              ? 'bg-accent-blue/15 text-accent-blue'
              : 'text-text-muted hover:text-text-secondary',
          )}
        >
          歌单 ({playlistResults.length})
        </button>
      </div>

      {/* Songs Tab */}
      {tab === 'songs' && (
        results.length > 0 ? (
          <div className="space-y-0.5">
            {results.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentSong?.id === song.id}
                isLiked={likedIds.has(song.id)}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onPlay={() => onPlaySong(song, results, idx)}
                onToggleLike={() => onToggleLike(song)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-text-muted text-sm py-8">未找到相关歌曲</p>
        )
      )}

      {/* Playlists Tab */}
      {tab === 'playlists' && (
        playlistResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {playlistResults.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onClick={() => onSelectPlaylist(pl.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-text-muted text-sm py-8">未找到相关歌单</p>
        )
      )}
    </section>
  )
}
