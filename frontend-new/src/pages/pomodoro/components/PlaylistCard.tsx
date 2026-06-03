import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { type Playlist, formatCount } from '../lib/netease-api'

interface PlaylistCardProps {
  playlist: Playlist
  onClick: () => void
}

export default function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
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
