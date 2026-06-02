import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, MessageSquare, CheckSquare, Timer, StickyNote, Command, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'
import { agents } from '../lib/agent-config'

const quotes = [
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '温故而知新，可以为师矣。', author: '孔子' },
  { text: '三人行，必有我师焉。', author: '孔子' },
  { text: '天行健，君子以自强不息。', author: '周易' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '警世贤文' },
  { text: '少壮不努力，老大徒伤悲。', author: '长歌行' },
]

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return quotes[dayOfYear % quotes.length]
}

function getDateString() {
  const now = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getMonth() + 1}月${now.getDate()}日 周${weekdays[now.getDay()]}`
}

const quickActions = [
  { icon: MessageSquare, label: 'AI 对话', desc: '与 AI 搭档交流', path: '/chat', color: 'bg-accent-blue/15 text-accent-blue' },
  { icon: CheckSquare, label: '任务管理', desc: '规划今日任务', path: '/tasks', color: 'bg-accent-purple/15 text-accent-purple' },
  { icon: Timer, label: '番茄钟', desc: '开始专注', path: '/pomodoro', color: 'bg-accent-amber/15 text-accent-amber' },
  { icon: StickyNote, label: '笔记', desc: '记录想法', path: '/notes', color: 'bg-accent-success/15 text-accent-success' },
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 9) return '早上好，新的一天开始了'
  if (h < 12) return '上午好，保持专注'
  if (h < 14) return '中午好，记得休息'
  if (h < 18) return '下午好，继续加油'
  if (h < 22) return '晚上好，适当放松'
  return '夜深了，注意休息'
}

export default function Home() {
  const navigate = useNavigate()
  usePageTitle()

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in relative">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-[120px]" />
      </div>

      {/* Title */}
      <div className="text-center mb-10 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Sparkles size={16} className="text-accent-amber" />
          <span className="caption tracking-widest uppercase">AI-Powered 气象台 Hub</span>
          <Sparkles size={16} className="text-accent-amber" />
        </div>
        <h1 className="text-6xl font-bold mb-5 tracking-tight">
          <span className="gradient-text">气象台Hub</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar size={13} className="text-text-muted" />
          <p className="body-sm">{getDateString()}</p>
        </div>
        <p className="body-lg mb-4">{getGreeting()}</p>
        {/* Daily Quote */}
        <div className="glass rounded-xl px-6 py-3.5 inline-block max-w-md mx-auto">
          <p className="text-sm text-text-secondary italic leading-relaxed">"{getDailyQuote().text}"</p>
          <p className="caption mt-1.5">—— {getDailyQuote().author}</p>
        </div>
        <p className="body-sm mt-4">选择你的 AI 搭档，开始高效协作</p>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full px-4 relative z-10 mb-8">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => navigate(`/chat?agent=${agent.id}`)}
            className={cn(
              'glass glass-hover p-6 rounded-2xl text-left transition-all duration-300 group cursor-pointer',
              agent.borderColor,
              'stagger-item'
            )}
          >
            {/* Icon */}
            <div className={cn(
              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4',
              'group-hover:scale-110 group-hover:rotate-3 transition-all duration-300',
              agent.gradient,
              agent.glow
            )}>
              <agent.icon size={24} className="text-white" />
            </div>

            {/* Role tag */}
            <div className="caption font-mono uppercase tracking-widest mb-1.5">
              {agent.role}
            </div>

            {/* Name */}
            <h2 className="heading-lg mb-2">{agent.name}</h2>

            {/* Description */}
            <p className="body-md leading-relaxed mb-4">
              {agent.desc}
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {agent.features.map((f) => (
                <span key={f} className="caption px-2.5 py-1 rounded-full bg-white/5 text-text-muted border border-white/5">
                  {f}
                </span>
              ))}
            </div>

            {/* Hover Arrow */}
            <div className="flex items-center gap-2 text-text-muted group-hover:text-accent-blue transition-colors duration-200">
              <span className="text-sm font-medium">开始对话</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-4xl px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="glass glass-hover p-4 rounded-xl text-left transition-all duration-200 group stagger-item"
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-3', action.color)}>
                <action.icon size={20} />
              </div>
              <div className="body-md font-medium mb-0.5">{action.label}</div>
              <div className="caption">{action.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-8 flex items-center gap-2 relative z-10">
        <Command size={13} className="text-text-muted" />
        <span className="body-sm">按 <kbd className="bg-white/5 px-2 py-0.5 rounded-md border border-white/10 caption font-mono">Ctrl+K</kbd> 打开命令面板</span>
      </div>
    </div>
  )
}
