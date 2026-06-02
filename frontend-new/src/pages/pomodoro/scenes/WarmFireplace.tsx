import { memo } from 'react'

/** WarmFireplace - Dancing flames and warm ember particles */
function WarmFireplaceInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Fire glow base */}
      <div className="fire-glow" />
      {/* Flame layers */}
      <div className="flame-container">
        <div className="flame flame-1" />
        <div className="flame flame-2" />
        <div className="flame flame-3" />
        <div className="flame flame-4" />
        <div className="flame flame-5" />
      </div>
      {/* Embers floating up */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="ember"
          style={{
            left: `${35 + Math.random() * 30}%`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }}
        />
      ))}
      {/* Fireplace mantel silhouette */}
      <div className="fireplace-mantel" />
      {/* Warm ambient particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`warm-${i}`}
          className="warm-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${30 + Math.random() * 60}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

export const WarmFireplace = memo(WarmFireplaceInner)
