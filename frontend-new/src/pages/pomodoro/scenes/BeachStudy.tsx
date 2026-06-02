import { memo } from 'react'

/** BeachStudy - Gentle ocean waves and sand lines */
function BeachStudyInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Wave layers */}
      <div className="wave wave-1" />
      <div className="wave wave-2" />
      <div className="wave wave-3" />
      {/* Sand lines */}
      <div className="sand-lines">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="sand-line"
            style={{
              bottom: `${5 + i * 4}%`,
              opacity: 0.05 + i * 0.02,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>
      {/* Sparkle on water */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="water-sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${40 + Math.random() * 30}%`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

export const BeachStudy = memo(BeachStudyInner)
