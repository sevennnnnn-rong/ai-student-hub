import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Home, MessageSquare, CheckSquare, Timer, Calendar, StickyNote, BarChart3, Settings, Brain, Code, Zap, Command } from 'lucide-react'
import { cn } from '../lib/utils'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: typeof Home
  action: () => void
  category: string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const commands: CommandItem[] = useMemo(() => [
    { id: 'home', label: '首页', icon: Home, action: () => navigate('/'), category: '导航' },
    { id: 'chat', label: 'AI 对话', icon: MessageSquare, action: () => navigate('/chat'), category: '导航' },
    { id: 'tasks', label: '任务管理', icon: CheckSquare, action: () => navigate('/tasks'), category: '导航' },
    { id: 'pomodoro', label: '番茄钟', icon: Timer, action: () => navigate('/pomodoro'), category: '导航' },
    { id: 'schedule', label: '课程表', icon: Calendar, action: () => navigate('/schedule'), category: '导航' },
    { id: 'notes', label: '笔记', icon: StickyNote, action: () => navigate('/notes'), category: '导航' },
    { id: 'dashboard', label: '数据看板', icon: BarChart3, action: () => navigate('/dashboard'), category: '导航' },
    { id: 'settings', label: '设置', icon: Settings, action: () => navigate('/settings'), category: '导航' },
    { id: 'chat-claude', label: '与 Claude 对话', description: '指挥官 — 战略规划、复杂推理', icon: Brain, action: () => navigate('/chat?agent=claude'), category: '快速操作' },
    { id: 'chat-codex', label: '与 Codex 对话', description: '引擎 — 代码生成、技术实现', icon: Code, action: () => navigate('/chat?agent=codex'), category: '快速操作' },
    { id: 'chat-doubao', label: '与 Doubao 对话', description: '苦力工 — 批量处理、数据整理', icon: Zap, action: () => navigate('/chat?agent=doubao'), category: '快速操作' },
    { id: 'new-task', label: '新建任务', icon: CheckSquare, action: () => navigate('/tasks'), category: '快速操作' },
    { id: 'new-note', label: '新建笔记', icon: StickyNote, action: () => navigate('/notes'), category: '快速操作' },
    { id: 'theme-toggle', label: '切换主题', description: '在深色和浅色模式之间切换', icon: Settings, action: () => { document.querySelector<HTMLElement>('[title*="切换"]')?.click() }, category: '系统' },
  ], [navigate])

  const filtered = useMemo(() => {
    if (!query) return commands
    const lower = query.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.description?.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
    )
  }, [query, commands])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)} role="dialog" aria-label="命令面板" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入命令或搜索..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder-text-muted"
          />
          <kbd className="text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-8">没有找到匹配的命令</div>
          ) : (
            <>
              {['导航', '快速操作', '系统'].map((category) => {
                const items = filtered.filter((cmd) => cmd.category === category)
                if (items.length === 0) return null
                return (
                  <div key={category}>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider px-3 py-1.5 font-medium">{category}</div>
                    {items.map((cmd) => {
                      const globalIndex = filtered.indexOf(cmd)
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => { cmd.action(); setOpen(false) }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors',
                            globalIndex === selectedIndex
                              ? 'bg-accent-blue/10 text-accent-blue'
                              : 'text-text-secondary hover:bg-bg-panel-hover'
                          )}
                        >
                          <cmd.icon size={16} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-text-muted truncate">{cmd.description}</div>
                            )}
                          </div>
                          <kbd className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100">↵</kbd>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded">↑↓</kbd> 导航</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded">↵</kbd> 选择</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded">esc</kbd> 关闭</span>
          <div className="flex-1" />
          <span className="flex items-center gap-1"><Command size={10} /> <kbd className="bg-white/5 px-1 rounded">K</kbd> 唤醒</span>
        </div>
      </div>
    </div>
  )
}
