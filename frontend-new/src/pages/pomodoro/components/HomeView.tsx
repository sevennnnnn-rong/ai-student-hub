import { Music, Heart, User, Cloud, Loader2, Calendar, Trophy } from 'lucide-react'
import PlaylistCard from './PlaylistCard'
import SongRow from './SongRow'
import { type Song, type Playlist, type Toplist } from '../lib/netease-api'

interface HomeViewProps {
  isLogin: boolean
  playlists: Playlist[]
  loadingPlaylists: boolean
  userPlaylists: Playlist[]
  loadingUserPlaylists: boolean
  userLikes: Song[]
  loadingUserLikes: boolean
  likedIds: Set<number>
  currentSong: Song | null
  isPlaying: boolean
  recentlyPlayed: Song[]
  dailyRecommend: Song[]
  loadingDailyRecommend: boolean
  toplists: Toplist[]
  loadingToplists: boolean
  onSelectPlaylist: (id: number) => void
  onPlaySong: (song: Song, source: Song[], idx: number) => void
  onToggleLike: (song: Song) => void
  onRefreshPlaylists: () => void
  onOpenLogin: () => void
}

export default function HomeView({
  isLogin,
  playlists,
  loadingPlaylists,
  userPlaylists,
  loadingUserPlaylists,
  userLikes,
  loadingUserLikes,
  likedIds,
  currentSong,
  isPlaying,
  recentlyPlayed,
  dailyRecommend,
  loadingDailyRecommend,
  toplists,
  loadingToplists,
  onSelectPlaylist,
  onPlaySong,
  onToggleLike,
  onRefreshPlaylists,
  onOpenLogin,
}: HomeViewProps) {
  return (
    <>
      {/* Not logged in hint */}
      {!isLogin && (
        <div className="mb-4 p-3 rounded-xl bg-accent-blue/5 border border-accent-blue/10">
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center gap-2 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-xs text-text-primary font-medium">登录网易云音乐</p>
              <p className="text-[10px] text-text-muted">查看我的歌单、收藏和每日推荐</p>
            </div>
          </button>
        </div>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="mb-5">
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5 mb-3">
            <Cloud size={14} className="text-accent-cyan" />
            最近播放
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {recentlyPlayed.slice(0, 10).map((song, idx) => (
              <button
                key={song.id + '-recent-' + idx}
                onClick={() => onPlaySong(song, recentlyPlayed, idx)}
                className="flex-shrink-0 w-[120px] group text-left"
              >
                <div className="relative rounded-xl overflow-hidden aspect-square mb-1.5 bg-bg-tertiary">
                  {song.album?.picUrl ? (
                    <img
                      src={song.album.picUrl}
                      alt={song.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={20} className="text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-accent-blue/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-text-primary truncate">{song.name}</p>
                <p className="text-[10px] text-text-muted truncate">
                  {song.artists?.map(a => a.name).join(' / ') || '未知歌手'}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Daily Recommend (logged in only) */}
      {isLogin && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
              <Calendar size={14} className="text-accent-orange" />
              每日推荐
            </h3>
            {loadingDailyRecommend && <Loader2 size={14} className="text-accent-blue animate-spin" />}
          </div>
          {dailyRecommend.length > 0 ? (
            <div className="space-y-0.5">
              {dailyRecommend.slice(0, 6).map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={idx}
                  isActive={currentSong?.id === song.id}
                  isLiked={likedIds.has(song.id)}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onPlay={() => onPlaySong(song, dailyRecommend, idx)}
                  onToggleLike={() => onToggleLike(song)}
                />
              ))}
            </div>
          ) : !loadingDailyRecommend ? (
            <p className="text-text-muted text-xs py-2">暂无每日推荐</p>
          ) : null}
        </section>
      )}

      {/* My Playlists (logged in only) */}
      {isLogin && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
              <Music size={14} className="text-accent-green" />
              我的歌单
            </h3>
            {loadingUserPlaylists && (
              <Loader2 size={14} className="text-accent-blue animate-spin" />
            )}
          </div>

          {loadingUserPlaylists ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[140px] md:w-[160px]">
                  <div className="skeleton aspect-square rounded-xl mb-2" />
                  <div className="skeleton h-3 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : userPlaylists.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              {userPlaylists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onClick={() => onSelectPlaylist(pl.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-xs py-2">暂无歌单</p>
          )}
        </section>
      )}

      {/* My Likes (logged in only) */}
      {isLogin && userLikes.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
              <Heart size={14} className="text-accent-pink" fill="currentColor" />
              我的收藏
              <span className="text-text-muted font-normal">({userLikes.length})</span>
            </h3>
            {loadingUserLikes && (
              <Loader2 size={14} className="text-accent-blue animate-spin" />
            )}
          </div>
          <div className="space-y-0.5">
            {userLikes.slice(0, 10).map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentSong?.id === song.id}
                isLiked={likedIds.has(song.id)}
                isPlaying={currentSong?.id === song.id && isPlaying}
                onPlay={() => onPlaySong(song, userLikes, idx)}
                onToggleLike={() => onToggleLike(song)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Playlists */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
            <Music size={14} className="text-accent-purple" />
            推荐歌单
          </h3>
          <button
            onClick={onRefreshPlaylists}
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
                onClick={() => onSelectPlaylist(pl.id)}
              />
            ))}
            {playlists.length === 0 && (
              <p className="text-text-muted text-sm py-4">暂无推荐歌单</p>
            )}
          </div>
        )}
      </section>

      {/* Toplists */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
            <Trophy size={14} className="text-yellow-500" />
            排行榜
          </h3>
        </div>
        {loadingToplists ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[140px]">
                <div className="skeleton aspect-square rounded-xl mb-2" />
                <div className="skeleton h-3 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {toplists.map((top) => (
              <button
                key={top.id}
                onClick={() => onSelectPlaylist(top.id)}
                className="flex-shrink-0 w-[140px] md:w-[160px] group text-left"
              >
                <div className="relative rounded-xl overflow-hidden aspect-square mb-2 bg-bg-tertiary">
                  {top.coverImgUrl ? (
                    <img src={top.coverImgUrl} alt={top.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy size={24} className="text-yellow-500/40" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-text-primary truncate">{top.name}</p>
              </button>
            ))}
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
  )
}
