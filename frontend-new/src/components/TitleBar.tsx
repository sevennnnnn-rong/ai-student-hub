import { Minus, Square, X } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'

function minimize() {
  getCurrentWindow().minimize()
}

async function toggleMaximize() {
  const win = getCurrentWindow()
  const isMaximized = await win.isMaximized()
  if (isMaximized) win.unmaximize()
  else win.maximize()
}

function close() {
  getCurrentWindow().close()
}

export default function TitleBar() {
  return (
    <div className="titlebar" data-tauri-drag-region style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="titlebar-brand">
        <svg viewBox="0 0 100 100" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#1a2332"/>
          <g transform="translate(50,50)">
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(0)"/>
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(22.5)"/>
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(45)"/>
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(67.5)"/>
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(-22.5)"/>
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(-45)"/>
            <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(-67.5)"/>
            <circle cx="0" cy="-22" r="10" fill="#E87C1E"/>
            <polygon points="0,-8 -35,15 -20,15" fill="#E87C1E"/>
            <polygon points="0,-4 -25,15 -10,15" fill="#E87C1E" opacity="0.7"/>
            <polygon points="0,0 -18,15 -5,15" fill="#E87C1E" opacity="0.5"/>
          </g>
        </svg>
        <span>气象台Hub</span>
      </div>

      <div className="titlebar-controls" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button className="titlebar-btn" onClick={minimize} aria-label="最小化" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Minus size={14} />
        </button>
        <button className="titlebar-btn" onClick={toggleMaximize} aria-label="最大化" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Square size={11} />
        </button>
        <button className="titlebar-btn titlebar-close" onClick={close} aria-label="关闭" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
