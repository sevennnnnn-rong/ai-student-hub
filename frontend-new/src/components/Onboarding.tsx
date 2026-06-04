import { useState } from 'react'
import { Brain, CheckSquare, Timer, StickyNote, ArrowRight, X, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

const steps = [
  {
    icon: Sparkles,
    title: '欢迎使用 气象台Hub',
    description: '你的 AI 驱动学习助手，让学习更智能、更高效。',
    color: 'from-accent to-accent-purple',
  },
  {
    icon: Brain,
    title: 'AI 搭档',
    description: '与 Claude、Codex、Doubao 三个 AI 搭档协作，处理不同类型的 tasks。',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: CheckSquare,
    title: '任务管理',
    description: '创建、跟踪和完成任务，支持优先级排序和截止日期。',
    color: 'from-accent-success to-green-400',
  },
  {
    icon: Timer,
    title: '番茄钟',
    description: '专注工作，智能休息，追踪你的学习时间。',
    color: 'from-accent-amber to-orange-400',
  },
  {
    icon: StickyNote,
    title: '笔记',
    description: '支持 Markdown 的笔记工具，记录你的想法和学习内容。',
    color: 'from-accent-purple to-pink-400',
  },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('onboarding_done') === 'true')

  if (dismissed) return null

  const step = steps[currentStep]
  const Icon = step.icon
  const isLast = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
        localStorage.setItem('onboarding_done', 'true')
        setDismissed(true)
      }} />
      <div className="relative glass rounded-3xl p-8 w-[480px] max-w-[90vw] animate-scale-in shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => {
            localStorage.setItem('onboarding_done', 'true')
            setDismissed(true)
          }}
          className="absolute top-4 right-4 btn-icon-sm text-text-muted hover:text-text-primary"
          aria-label="关闭引导"
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === currentStep ? 'bg-accent flex-[3]' : i < currentStep ? 'bg-accent/50 flex-1' : 'bg-white/10 flex-1'
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className={cn('w-20 h-20 rounded-2xl bg-gradient-to-br mx-auto mb-5 flex items-center justify-center', step.color)}>
            <Icon size={36} className="text-white" />
          </div>
          <h2 className="text-xl font-bold mb-3">{step.title}</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            >
              上一步
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                localStorage.setItem('onboarding_done', 'true')
                setDismissed(true)
              } else {
                setCurrentStep(currentStep + 1)
              }
            }}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2',
              'bg-gradient-to-r from-accent to-accent-hover hover:shadow-lg hover:shadow-accent/20'
            )}
          >
            {isLast ? '开始使用' : '下一步'}
            {!isLast && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
