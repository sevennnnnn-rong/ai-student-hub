import { memo } from 'react'

/** Library - Floating dust motes and bookshelf silhouette */
function LibraryInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Floating dust particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="dust-mote"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 8}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            opacity: 0.15 + Math.random() * 0.25,
          }}
        />
      ))}
      {/* Bookshelf silhouettes */}
      <div className="bookshelf bookshelf-left">
        <div className="shelf-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="book"
              style={{
                height: `${50 + Math.random() * 40}%`,
                width: `${6 + Math.random() * 8}px`,
                opacity: 0.08 + Math.random() * 0.06,
              }}
            />
          ))}
        </div>
        <div className="shelf-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`r2-${i}`}
              className="book"
              style={{
                height: `${45 + Math.random() * 45}%`,
                width: `${7 + Math.random() * 7}px`,
                opacity: 0.06 + Math.random() * 0.06,
              }}
            />
          ))}
        </div>
      </div>
      {/* Warm light beam from above */}
      <div className="library-light-beam" />
    </div>
  )
}

export const Library = memo(LibraryInner)
