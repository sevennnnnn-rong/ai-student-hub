import { memo } from 'react'

/** RainyWindow - Rain drops falling past a window frame */
function RainyWindowInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Rain drops - staggered CSS animations */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="rain-drop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.6 + Math.random() * 0.8}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.15 + Math.random() * 0.25,
            height: `${12 + Math.random() * 18}px`,
          }}
        />
      ))}
      {/* Window frame decoration */}
      <div className="window-frame">
        <div className="window-pane window-pane-tl" />
        <div className="window-pane window-pane-tr" />
        <div className="window-pane window-pane-bl" />
        <div className="window-pane window-pane-br" />
        <div className="window-cross-h" />
        <div className="window-cross-v" />
      </div>
      {/* Condensation droplets */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`drop-${i}`}
          className="condensation-drop"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 30}%`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
    </div>
  )
}

export const RainyWindow = memo(RainyWindowInner)
