import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function LoadingBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setVisible(true)
    setProgress(30)
    const t1 = setTimeout(() => setProgress(70), 100)
    const t2 = setTimeout(() => setProgress(100), 300)
    const t3 = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [location.pathname])

  if (!visible && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-0.5 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-accent via-accent-hover to-accent rounded-r-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow: '0 0 12px rgba(194, 12, 12, 0.6), 0 0 4px rgba(155, 9, 9, 0.4)',
        }}
      />
      {/* Shimmer overlay */}
      {visible && (
        <div
          className="absolute inset-0 h-full rounded-r-full overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      )}
    </div>
  )
}
