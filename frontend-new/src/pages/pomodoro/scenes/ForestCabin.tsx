import { memo } from 'react'

/** ForestCabin - Swaying leaves and tree shadows */
function ForestCabinInner() {
  return (
    <div className="scene-particles" aria-hidden="true">
      {/* Swaying leaves */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="leaf-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.1 + Math.random() * 0.2,
            fontSize: `${6 + Math.random() * 10}px`,
          }}
        >
          {Math.random() > 0.5 ? '☘' : '☙'}
        </div>
      ))}
      {/* Tree silhouette decorations */}
      <div className="tree-silhouette tree-left">
        <div className="tree-trunk" />
        <div className="tree-canopy tree-canopy-1" />
        <div className="tree-canopy tree-canopy-2" />
        <div className="tree-canopy tree-canopy-3" />
      </div>
      <div className="tree-silhouette tree-right">
        <div className="tree-trunk" />
        <div className="tree-canopy tree-canopy-1" />
        <div className="tree-canopy tree-canopy-2" />
      </div>
      {/* Floating particles (pollen/light) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`p-${i}`}
          className="forest-pollen"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}

export const ForestCabin = memo(ForestCabinInner)
