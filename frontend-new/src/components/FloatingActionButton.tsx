import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, CheckSquare, StickyNote, X, Timer } from 'lucide-react'
import { cn } from '../lib/utils'

const actions = [
  { icon: MessageSquare, label: 'AI 对话', desc: '与 AI 搭档交流', action: '/chat', color: 'bg-accent-blue' },
  { icon: CheckSquare, label: '新建任务', desc: '添加待办事项', action: '/tasks', color: 'bg-accent-success' },
  { icon: StickyNote, label: '新建笔记', desc: '记录想法灵感', action: '/notes', color: 'bg-accent-amber' },
  { icon: Timer, label: '开始专注', desc: '启动番茄钟', action: '/pomodoro', color: 'bg-accent-purple' },
]

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-36 right-6 z-40 md:bottom-8 md:right-8">
      {/* Action items */}
      {open && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-slide-up">
          {actions.map((action, i) => (
            <button
              key={action.label}
              onClick={() => {
                navigate(action.action)
                setOpen(false)
              }}
              className={cn(
                'flex items-center gap-3 pl-4 pr-5 py-2.5 rounded-xl text-white text-sm font-medium',
                'shadow-lg hover:scale-105 active:scale-95 transition-all duration-200',
                action.color
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <action.icon size={16} />
              <div className="text-left">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="caption opacity-70">{action.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="快速操作"
        aria-expanded={open}
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl',
          'transition-all duration-300 hover:scale-105 active:scale-95',
          open
            ? 'bg-accent-danger rotate-45'
            : 'bg-gradient-to-br from-accent-blue to-blue-600 glow-blue'
        )}
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  )
}
