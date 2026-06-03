import { Play, Shuffle, Loader2 } from 'lucide-react'
import SongRow from './SongRow'
import { type Song, type Playlist, formatCount } from '../lib/netease-api'

interface PlaylistDetailViewProps {
  playlist: Playlist & { tracks: Song[] }
  loading: boolean
  currentSong: Song | null
  isPlaying: boolean
  likedIds: Set<number>
  onPlaySong: (song: Song, source: Song[], idx: number) => void
  onToggleLike: (song: Song) => void
  onPlayAll: () => void
  onShufflePlay: () => void
}

export default function PlaylistDetailView({
  playlist,
  loading,
  currentSong,
  isPlaying,
  likedIds,
  onPlaySong,
  onToggleLike,
  onPlayAll,
  onShufflePlay,
}: PlaylistDetailViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-accent-blue animate-spin" />
      </div>
    )
  }

  return (
    <section>
      {/* Playlist Header */}
      <div className="flex gap-3 mb-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-bg-tertiary">
          <img
            src={playlist.coverImgUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {playlist.trackCount != null && (
              <span className="caption text-text-muted">{playlist.trackCount} 首</span>
            )}
            <span className="caption text-text-muted">{formatCount(playlist.playCount)} 次播放</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onPlayAll}
              className="btn btn-primary btn-sm"
              disabled={loading || playlist.tracks.length === 0}
            >
              <Play size={13} fill="white" />
              播放全部
            </button>
            <button
              onClick={onShufflePlay}
              className="btn btn-sm"
              disabled={loading || playlist.tracks.length === 0}
            >
              <Shuffle size={13} />
              随机播放
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      {playlist.tracks.length > 0 ? (
        <div className="space-y-0.5">
          {playlist.tracks.map((song, idx) => (
            <SongRow
              key={song.id}
              song={song}
              index={idx}
              isActive={currentSong?.id === song.id}
              isLiked={likedIds.has(song.id)}
              isPlaying={currentSong?.id === song.id && isPlaying}
              onPlay={() => onPlaySong(song, playlist.tracks, idx)}
              onToggleLike={() => onToggleLike(song)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-muted text-sm">
          歌单暂无歌曲
        </div>
      )}
    </section>
  )
}
