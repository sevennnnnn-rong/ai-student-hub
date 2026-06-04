import { useState, useEffect, useCallback } from 'react'
import PopupShell from './PopupShell'

const STORAGE_KEY = 'popup-quick-note'

export default function PopupNotes() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const save = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, text) } catch {}
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }, [text])

  // 800ms debounce auto-save
  useEffect(() => {
    setSaveStatus('saving')
    const timer = setTimeout(save, 800)
    return () => clearTimeout(timer)
  }, [text, save])

  // Ctrl+S manual save
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      const timer = setTimeout(save, 0)
      // Cancel the pending debounce to avoid double-save delay
      return () => clearTimeout(timer)
    }
    // Tab inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = text.slice(0, start) + '  ' + text.slice(end)
      setText(next)
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }, [text, save])

  const charCount = text.length
  const lineCount = text ? text.split('\n').length : 1

  const saveIndicatorColor =
    saveStatus === 'saved' ? '#4ade80' :
    saveStatus === 'saving' ? '#facc15' :
    'rgba(255,255,255,0.15)'

  const saveIndicatorShadow =
    saveStatus === 'saved' ? '0 0 8px rgba(74,222,128,0.6)' :
    saveStatus === 'saving' ? '0 0 8px rgba(250,204,21,0.5)' :
    'none'

  return (
    <PopupShell title="快速笔记" icon="📝" accentColor="#C20C0C">
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Save status indicator */}
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: saveIndicatorColor,
            boxShadow: saveIndicatorShadow,
            transition: 'all 0.3s ease',
          }} />
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.35)',
            fontWeight: 500, letterSpacing: 0.3,
          }}>
            {saveStatus === 'saved' ? '已保存' :
             saveStatus === 'saving' ? '保存中' : '就绪'}
          </span>
        </div>
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {charCount} 字
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="记录你的想法..."
        spellCheck={false}
        style={{
          flex: 1, padding: '14px 16px', border: 'none', outline: 'none',
          background: 'transparent', color: 'rgba(255,255,255,0.88)',
          fontSize: 13.5, lineHeight: 1.8, resize: 'none',
          fontFamily: '"PingFang SC", "Microsoft YaHei", ui-monospace, monospace',
          caretColor: '#C20C0C',
          letterSpacing: 0.2,
        }}
      />

      {/* Bottom Status Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10.5, color: 'rgba(255,255,255,0.2)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {charCount} 字 · {lineCount} 行
        </span>
        <span style={{
          fontSize: 10.5, color: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            display: 'inline-block', width: 4, height: 4, borderRadius: '50%',
            background: '#C20C0C', opacity: 0.5,
          }} />
          自动保存 · Ctrl+S
        </span>
      </div>
    </PopupShell>
  )
}
