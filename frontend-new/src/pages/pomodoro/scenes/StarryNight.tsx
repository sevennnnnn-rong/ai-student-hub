import { memo } from 'react'

/** StarryNight - Twinkling stars and crescent moon */
function StarryNightInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Stars */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${1.5 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 4}s`,
            width: `${1 + Math.random() * 3}px`,
            height: `${1 + Math.random() * 3}px`,
          }}
        />
      ))}
      {/* Crescent moon */}
      <div className="moon">
        <div className="moon-body" />
        <div className="moon-shadow" />
        <div className="moon-glow" />
      </div>
      {/* Shooting star */}
      <div className="shooting-star" />
      {/* Nebula wisps */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
    </div>
  )
}

export const StarryNight = memo(StarryNightInner)
