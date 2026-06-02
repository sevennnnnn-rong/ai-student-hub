import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

const DEFAULT_QUOTES = [
  '专注当下，成就未来',
  '每一次专注，都是一次成长',
  '保持热爱，奔赴山海',
  '慢慢来，比较快',
  '心无旁骛，万事可成',
  '深度工作，高效产出',
  '不积跬步，无以至千里',
  '坚持就是胜利',
  '把时间用在重要的事上',
  '专注力是最稀缺的资源',
]

const STORAGE_KEY = 'pomodoro_quotes'
const ACTIVE_QUOTE_KEY = 'pomodoro_active_quote'

function loadQuotes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_QUOTES
  } catch {
    return DEFAULT_QUOTES
  }
}

function loadActiveIndex(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_QUOTE_KEY)
    return raw ? parseInt(raw, 10) : 0
  } catch {
    return 0
  }
}

interface MotivationalQuoteProps {
  className?: string
}

export default function MotivationalQuote({ className }: MotivationalQuoteProps) {
  const [quotes, setQuotes] = useState<string[]>(loadQuotes)
  const [activeIndex, setActiveIndex] = useState<number>(loadActiveIndex)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [newQuote, setNewQuote] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
  }, [quotes])

  useEffect(() => {
    localStorage.setItem(ACTIVE_QUOTE_KEY, String(activeIndex))
  }, [activeIndex])

  // Auto-rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % quotes.length)
        setVisible(true)
      }, 400)
    }, 8000)
    return () => clearInterval(interval)
  }, [quotes.length])

  const shuffleQuote = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      const next = (activeIndex + 1) % quotes.length
      setActiveIndex(next)
      setVisible(true)
    }, 400)
  }, [activeIndex, quotes.length])

  const addQuote = () => {
    const text = newQuote.trim()
    if (!text) return
    setQuotes((prev) => [...prev, text])
    setNewQuote('')
    setShowAdd(false)
  }

  const deleteQuote = (index: number) => {
    setQuotes((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) return DEFAULT_QUOTES
      return next
    })
    if (activeIndex >= quotes.length - 1) {
      setActiveIndex(Math.max(0, quotes.length - 2))
    }
  }

  const startEdit = (index: number) => {
    setEditText(quotes[index])
    setIsEditing(true)
  }

  const saveEdit = () => {
    const text = editText.trim()
    if (!text) return
    setQuotes((prev) => prev.map((q, i) => (i === activeIndex ? text : q)))
    setIsEditing(false)
  }

  const currentQuote = quotes[activeIndex] || ''

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="heading-md text-text-primary">座右铭</h3>
        <button
          onClick={shuffleQuote}
          className="btn-icon-sm text-text-muted hover:text-text-primary"
          aria-label="换一条"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quote display */}
      <div
        className={cn(
          'text-center py-6 px-4 transition-all duration-400',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="input-glass text-center text-base"
              autoFocus
            />
            <div className="flex justify-center gap-2">
              <button onClick={saveEdit} className="btn btn-sm btn-primary rounded-lg">
                <Check size={12} />保存
              </button>
              <button onClick={() => setIsEditing(false)} className="btn btn-sm btn-ghost rounded-lg">
                <X size={12} />取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-base font-medium text-text-primary italic leading-relaxed">
              "{currentQuote}"
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                onClick={() => startEdit(activeIndex)}
                className="btn-icon-sm text-text-muted hover:text-accent-blue"
                aria-label="编辑"
              >
                <Edit3 size={12} />
              </button>
              <span className="caption text-text-muted">
                {activeIndex + 1} / {quotes.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Add new quote */}
      <div>
        {showAdd ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuote()}
              placeholder="输入新的座右铭..."
              className="input-glass flex-1 text-sm"
              autoFocus
            />
            <button onClick={addQuote} className="btn btn-icon-md rounded-xl bg-accent-blue/15 text-accent-blue">
              <Check size={14} />
            </button>
            <button onClick={() => setShowAdd(false)} className="btn btn-icon-md rounded-xl text-text-muted">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={12} />添加自定义语录
          </button>
        )}
      </div>

      {/* Quote list */}
      {quotes.length > DEFAULT_QUOTES.length && (
        <div className="space-y-1 max-h-[150px] overflow-y-auto">
          {quotes.filter((_, i) => i >= DEFAULT_QUOTES.length).map((quote, i) => (
            <div key={i + DEFAULT_QUOTES.length} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] group">
              <span className="flex-1 text-xs text-text-secondary truncate">{quote}</span>
              <button
                onClick={() => deleteQuote(i + DEFAULT_QUOTES.length)}
                className="btn-icon-sm opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-danger"
                aria-label="删除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
