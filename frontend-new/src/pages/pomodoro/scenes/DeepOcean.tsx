import { memo } from 'react'

/** DeepOcean - Rising bubbles and water ripple effects */
function DeepOceanInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Bubbles rising */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${4 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${4 + Math.random() * 12}px`,
            height: `${4 + Math.random() * 12}px`,
          }}
        />
      ))}
      {/* Water ripple rings */}
      <div className="water-ripple ripple-1" />
      <div className="water-ripple ripple-2" />
      <div className="water-ripple ripple-3" />
      {/* Light rays from surface */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`ray-${i}`}
          className="light-ray"
          style={{
            left: `${15 + i * 20}%`,
            animationDelay: `${i * 1.2}s`,
            opacity: 0.03 + Math.random() * 0.03,
          }}
        />
      ))}
      {/* Floating kelp silhouettes */}
      <div className="kelp kelp-1" />
      <div className="kelp kelp-2" />
    </div>
  )
}

export const DeepOcean = memo(DeepOceanInner)
