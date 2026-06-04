import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'
import { usePageTitle } from '../hooks/usePageTitle'
import { taskApi, pomodoroApi, type Task, type PomodoroStats } from '../lib/api'

// ===== 格言数据 =====
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

function getGreeting(): { text: string; emoji: string; sub: string } {
  const h = new Date().getHours()
  if (h < 6)  return { text: '夜深了', emoji: '🌙', sub: '注意休息，早点睡' }
  if (h < 9)  return { text: '早上好', emoji: '🌅', sub: '新的一天开始了' }
  if (h < 12) return { text: '上午好', emoji: '☀️', sub: '保持专注，高效学习' }
  if (h < 14) return { text: '中午好', emoji: '🍜', sub: '记得休息，补充能量' }
  if (h < 18) return { text: '下午好', emoji: '🌤️', sub: '今天也要加油学习哦' }
  if (h < 22) return { text: '晚上好', emoji: '🌙', sub: '适当放松，劳逸结合' }
  return { text: '夜深了', emoji: '🌙', sub: '注意休息，早点睡' }
}

// ===== 快捷入口配置 =====
const quickEntries = [
  { emoji: '🤖', label: 'AI 对话', path: '/chat' },
  { emoji: '🍅', label: '番茄钟', path: '/pomodoro' },
  { emoji: '📝', label: '快速笔记', path: '/notes' },
  { emoji: '📊', label: '学习看板', path: '/dashboard' },
]

// ===== Mock 数据（API 未连接时使用） =====
const mockTasks: Task[] = [
  { id: 1, title: '完成数学作业第三章', status: 'in_progress', priority: 'high', due_date: new Date().toISOString(), created_at: '', updated_at: '' },
  { id: 2, title: '复习英语单词 Unit 5', status: 'pending', priority: 'medium', due_date: new Date().toISOString(), created_at: '', updated_at: '' },
  { id: 3, title: '整理物理实验报告', status: 'pending', priority: 'low', due_date: new Date(Date.now() + 86400000).toISOString(), created_at: '', updated_at: '' },
  { id: 4, title: '预习下一节化学课', status: 'pending', priority: 'medium', due_date: new Date(Date.now() + 86400000 * 2).toISOString(), created_at: '', updated_at: '' },
]

const mockStats: PomodoroStats = { total_minutes: 180, total_sessions: 6, today_minutes: 45 }

// ===== 辅助函数 =====
function formatFocusTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays < 0) return '已过期'
  if (diffDays === 0) return '今天截止'
  if (diffDays === 1) return '明天截止'
  if (diffDays <= 7) return `${diffDays}天后截止`
  return `${date.getMonth() + 1}/${date.getDate()} 截止`
}

function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high': return 'var(--color-accent-danger, #ef4444)'
    case 'medium': return 'var(--color-accent-amber, #f59e0b)'
    case 'low': return 'var(--color-text-muted, #6b7280)'
  }
}

function getStatusLabel(status: Task['status']): string {
  switch (status) {
    case 'in_progress': return '进行中'
    case 'pending': return '待开始'
    case 'done': return '已完成'
  }
}

// ===== 主组件 =====
export default function Home() {
  const navigate = useNavigate()
  usePageTitle()

  const dailyQuote = getDailyQuote()
  const greeting = getGreeting()

  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<PomodoroStats>(mockStats)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksResult, statsResult] = await Promise.allSettled([
        taskApi.getAll(),
        pomodoroApi.getStats('today'),
      ])

      setTasks(
        tasksResult.status === 'fulfilled'
          ? tasksResult.value.filter(t => t.status !== 'done')
          : mockTasks
      )
      setStats(
        statsResult.status === 'fulfilled' ? statsResult.value : mockStats
      )
    } catch {
      setTasks(mockTasks)
      setStats(mockStats)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="home-page animate-fade-in">
      {/* ===== 问候区 ===== */}
      <section className="home-greeting">
        <div className="greeting-main">
          <span className="greeting-emoji">{greeting.emoji}</span>
          <h1 className="greeting-title">{greeting.text}，同学 👋</h1>
        </div>
        <p className="greeting-sub">{greeting.sub}</p>
        <div className="greeting-meta">
          <Calendar size={13} style={{ opacity: 0.5 }} />
          <span>{getDateString()}</span>
        </div>
        <p className="greeting-quote">"{dailyQuote.text}" — {dailyQuote.author}</p>
      </section>

      {/* ===== 统计卡片行 ===== */}
      <section className="home-stats">
        <div className="stat-card">
          <span className="stat-label">今日专注</span>
          <span className="stat-value stat-value-accent">
            {loading ? '--' : formatFocusTime(stats.today_minutes)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">待办任务</span>
          <span className="stat-value">
            {loading ? '--' : `${tasks.length} 个`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">连续打卡</span>
          <span className="stat-value">
            {loading ? '--' : '1 天'}
          </span>
        </div>
      </section>

      {/* ===== 快捷入口 ===== */}
      <section className="home-shortcuts">
        {quickEntries.map((entry) => (
          <button
            key={entry.path}
            onClick={() => navigate(entry.path)}
            className="mini-card"
          >
            <span className="mini-card-emoji">{entry.emoji}</span>
            <span className="mini-card-label">{entry.label}</span>
          </button>
        ))}
      </section>

      {/* ===== 今日任务列表 ===== */}
      <section className="home-tasks">
        <div className="tasks-header">
          <h2 className="tasks-title">今日任务</h2>
          <button
            className="tasks-view-all"
            onClick={() => navigate('/tasks')}
          >
            查看全部 <ArrowRight size={12} />
          </button>
        </div>

        <div className="tasks-list">
          {loading ? (
            <div className="tasks-empty">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="tasks-empty">今天没有待办任务，享受自由时光吧 🎉</div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="task-item"
                onClick={() => navigate('/tasks')}
              >
                <span
                  className="task-dot"
                  style={{ background: getPriorityColor(task.priority) }}
                />
                <span className="task-name">{task.title}</span>
                <span className="task-due">{formatDueDate(task.due_date ?? task.created_at)}</span>
                <span className={cn(
                  'task-tag',
                  task.status === 'in_progress' ? 'active' : 'pending'
                )}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
