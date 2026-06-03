import { useState, useCallback } from 'react'
import { Wind, ListTodo, BarChart3, Volume2, Settings, Clock, X, Music } from 'lucide-react'
import { cn } from '../../../lib/utils'
import BreathingGuide from './BreathingGuide'
import QuickTodo from './QuickTodo'
import FocusStats from './FocusStats'
import VolumeControl from './VolumeControl'
import MotivationalQuote from './MotivationalQuote'
import PomodoroSettings from './PomodoroSettings'
import SittingReminder from './SittingReminder'
import SoundMixer from '../audio/SoundMixer'

type PanelId = 'breathing' | 'todo' | 'stats' | 'volume' | 'settings' | 'reminder' | 'quote' | 'sound' | null

interface Session {
  id: number
  type: 'work' | 'break' | 'long_break'
  duration: number
  completedAt: Date
}

interface ToolBarProps {
  sessions: Session[]
  dailyGoal: number
  onConfigChange?: (config: {
    workMinutes: number
    breakMinutes: number
    longBreakMinutes: number
    dailyGoal: number
    autoStartNext: boolean
  }) => void
  onSceneVolumeChange?: (vol: number) => void
  onNotificationVolumeChange?: (vol: number) => void
  className?: string
}

interface ToolItem {
  id: PanelId
  icon: typeof Wind
  label: string
  color: string
}

const TOOLS: ToolItem[] = [
  { id: 'breathing', icon: Wind, label: '呼吸引导', color: 'text-accent-blue' },
  { id: 'todo', icon: ListTodo, label: '快速待办', color: 'text-accent-success' },
  { id: 'stats', icon: BarChart3, label: '专注统计', color: 'text-accent-purple' },
  { id: 'sound', icon: Music, label: '白噪音', color: 'text-accent-cyan' },
  { id: 'volume', icon: Volume2, label: '音量控制', color: 'text-accent-amber' },
  { id: 'quote', icon: null as any, label: '座右铭', color: 'text-accent-pink' },
  { id: 'settings', icon: Settings, label: '设置', color: 'text-text-secondary' },
  { id: 'reminder', icon: Clock, label: '久坐提醒', color: 'text-accent-amber' },
]

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  )
}

export default function ToolBar({
  sessions,
  dailyGoal,
  onConfigChange,
  onSceneVolumeChange,
  onNotificationVolumeChange,
  className,
}: ToolBarProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(null)

  const togglePanel = useCallback((id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id))
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  const renderPanel = () => {
    switch (activePanel) {
      case 'breathing':
        return <BreathingGuide />
      case 'todo':
        return <QuickTodo />
      case 'stats':
        return <FocusStats sessions={sessions} dailyGoal={dailyGoal} />
      case 'sound':
        return <SoundMixer isOpen={true} onToggle={closePanel} />
      case 'volume':
        return (
          <VolumeControl
            onSceneVolumeChange={onSceneVolumeChange}
            onNotificationVolumeChange={onNotificationVolumeChange}
          />
        )
      case 'quote':
        return <MotivationalQuote />
      case 'settings':
        return <PomodoroSettings onConfigChange={onConfigChange} />
      case 'reminder':
        return <SittingReminder />
      default:
        return null
    }
  }

  return (
    <div className={cn('fixed z-40', className)}>
      {/* Desktop: Right side vertical toolbar */}
      <div className="hidden md:flex flex-col items-center gap-0 fixed right-4 top-1/2 -translate-y-1/2">
        {/* Tool icons */}
        <div className="glass rounded-2xl p-1.5 flex flex-col gap-0.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => togglePanel(tool.id)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                'tooltip-wrapper',
                activePanel === tool.id
                  ? 'glass-active ' + tool.color
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.06]'
              )}
              data-tooltip={tool.label}
              aria-label={tool.label}
              aria-expanded={activePanel === tool.id}
            >
              {tool.id === 'quote' ? (
                <QuoteIcon className="w-4 h-4" />
              ) : (
                <tool.icon size={18} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Bottom horizontal toolbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="glass border-t border-white/5 rounded-t-2xl px-2 py-2">
          <div className="flex items-center justify-around">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => togglePanel(tool.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-200 min-w-[44px]',
                  activePanel === tool.id
                    ? tool.color
                    : 'text-text-muted'
                )}
                aria-label={tool.label}
                aria-expanded={activePanel === tool.id}
              >
                {tool.id === 'quote' ? (
                  <QuoteIcon className="w-5 h-5" />
                ) : (
                  <tool.icon size={18} />
                )}
                <span className="text-[10px] leading-none">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel overlay (mobile) */}
      {activePanel && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={closePanel}
        />
      )}

      {/* Panel content */}
      {activePanel && (
        <>
          {/* Desktop: Side panel */}
          <div className="hidden md:block fixed right-20 top-1/2 -translate-y-1/2 z-50 animate-slide-up">
            <div className="glass rounded-2xl p-5 w-72 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-text-primary">
                  {TOOLS.find((t) => t.id === activePanel)?.label}
                </span>
                <button
                  onClick={closePanel}
                  className="btn-icon-sm text-text-muted hover:text-text-primary"
                  aria-label="关闭面板"
                >
                  <X size={16} />
                </button>
              </div>
              {renderPanel()}
            </div>
          </div>

          {/* Mobile: Bottom sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
            <div className="glass rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-text-primary">
                  {TOOLS.find((t) => t.id === activePanel)?.label}
                </span>
                <button
                  onClick={closePanel}
                  className="btn-icon-sm text-text-muted hover:text-text-primary"
                  aria-label="关闭面板"
                >
                  <X size={16} />
                </button>
              </div>
              {renderPanel()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
