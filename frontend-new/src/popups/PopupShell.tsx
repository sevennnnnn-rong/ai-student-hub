import { X } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface PopupShellProps {
  title: string
  icon?: string
  children: React.ReactNode
  accentColor?: string
}

// Tauri drag region requires WebkitAppRegion which isn't in React's CSSProperties
const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

export default function PopupShell({ title, icon, children, accentColor = '#C20C0C' }: PopupShellProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'var(--color-bg-primary, #0f1117)',
      color: 'var(--color-text-primary, #e8eaed)',
      fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Draggable Title Bar */}
      <div
        data-tauri-drag-region
        style={{
          ...dragStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          userSelect: 'none', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{title}</span>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accentColor, boxShadow: `0 0 8px ${accentColor}60`,
          }} />
        </div>
        <button
          onClick={() => getCurrentWindow().close()}
          style={{
            ...noDragStyle,
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,80,80,0.2)'
            e.currentTarget.style.color = '#ff5050'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          }}
          aria-label="关闭"
        >
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
