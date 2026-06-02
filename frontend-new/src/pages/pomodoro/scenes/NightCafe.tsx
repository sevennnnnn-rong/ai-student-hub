import { memo } from 'react'

/** NightCafe - Warm flickering lights and coffee cup silhouette */
function NightCafeInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Warm light orbs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="cafe-light"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${5 + Math.random() * 40}%`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`,
            width: `${30 + Math.random() * 60}px`,
            height: `${30 + Math.random() * 60}px`,
          }}
        />
      ))}
      {/* Coffee cup silhouette */}
      <div className="coffee-cup-decoration">
        <div className="cup-body" />
        <div className="cup-handle" />
        <div className="cup-steam">
          <div className="steam-line steam-1" />
          <div className="steam-line steam-2" />
          <div className="steam-line steam-3" />
        </div>
      </div>
      {/* Floating dust motes in warm light */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={`dust-${i}`}
          className="cafe-dust"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 80}%`,
            animationDuration: `${4 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

export const NightCafe = memo(NightCafeInner)
