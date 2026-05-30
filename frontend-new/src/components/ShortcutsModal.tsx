import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { cn } from '../lib/utils'

const shortcuts = [
  { category: '导航', items: [
    { keys: ['Ctrl', 'K'], action: '打开命令面板' },
    { keys: ['Ctrl', '1-7'], action: '快速跳转页面' },
    { keys: ['Ctrl', ','], action: '打开设置' },
    { keys: ['Ctrl', '/'], action: '显示快捷键帮助' },
    { keys: ['Ctrl', 'Shift', 'N'], action: '快速笔记' },
  ]},
  { category: '对话', items: [
    { keys: ['Enter'], action: '发送消息' },
    { keys: ['Shift', 'Enter'], action: '消息换行' },
    { keys: ['Esc'], action: '关闭弹窗' },
  ]},
  { category: '任务', items: [
    { keys: ['Enter'], action: '添加任务' },
    { keys: ['Esc'], action: '取消编辑' },
  ]},
  { category: '笔记', items: [
    { keys: ['Tab'], action: '插入缩进' },
    { keys: ['Ctrl', 'Enter'], action: '保存笔记' },
  ]},
  { category: '番茄钟', items: [
    { keys: ['Space'], action: '开始/暂停' },
    { keys: ['R'], action: '重置计时器' },
  ]},
]

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-accent-blue" />
            <h2 className="font-bold">键盘快捷键</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-panel-hover transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">{group.category}</h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.action} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-text-secondary">{item.action}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10 min-w-[24px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border text-[10px] text-text-muted">
          按 <kbd className="bg-white/5 px-1 rounded">Ctrl</kbd> + <kbd className="bg-white/5 px-1 rounded">/</kbd> 随时打开此面板
        </div>
      </div>
    </div>
  )
}
