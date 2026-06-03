import { useState, useEffect, useRef } from 'react'
import { StickyNote, X, Save } from 'lucide-react'
import { cn } from '../lib/utils'
import { noteApi } from '../lib/api'
import { useToast } from './Toast'

export default function QuickNote() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Load last quick note from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quick_note')
    if (saved) setContent(saved)
  }, [])

  // Auto-save to localStorage (debounced 500ms)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem('quick_note', content)
    }, 500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [content])

  // Keyboard shortcut: Ctrl+Shift+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus textarea when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await noteApi.create({ title: `快速笔记 - ${new Date().toLocaleDateString('zh-CN')}`, content })
      toast('笔记已保存', 'success')
    } catch {
      toast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-24 right-6 z-40 w-12 h-12 rounded-xl flex items-center justify-center',
          'shadow-lg transition-all duration-300 hover:scale-105 active:scale-95',
          'md:bottom-8 md:right-20',
          open
            ? 'bg-accent-amber text-white'
            : 'bg-gradient-to-br from-accent-amber to-orange-500 text-white glow-amber'
        )}
        title="快速笔记 (Ctrl+Shift+N)"
      >
        <StickyNote size={18} />
      </button>

      {/* Quick Note Panel */}
      {open && (
        <div className="fixed bottom-40 right-6 z-50 w-80 md:bottom-20 md:right-20 animate-slide-up">
          <div className="glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote size={14} className="text-accent-amber" />
                <span className="text-sm font-medium">快速笔记</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSave}
                  disabled={!content.trim() || saving}
                  className={cn(
                    'btn-icon-sm transition-all',
                    content.trim() && !saving
                      ? 'text-accent-success hover:bg-accent-success/10'
                      : 'text-text-muted cursor-not-allowed'
                  )}
                  title="保存为笔记"
                  aria-label="保存为笔记"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-icon-sm text-text-muted hover:text-text-primary"
                  aria-label="关闭快速笔记"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="随时记录想法... (Ctrl+Shift+N 打开)"
              className="w-full h-48 bg-transparent p-4 text-sm text-text-primary placeholder-text-muted focus:outline-none resize-none leading-relaxed"
            />

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border flex items-center justify-between">
              <span className="caption text-text-muted">{content.length} 字</span>
              <span className="caption text-text-muted">自动保存到本地</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
