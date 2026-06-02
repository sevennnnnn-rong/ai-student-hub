import { useMemo } from 'react'
import { Target, Clock, TrendingUp } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface Session {
  id: number
  type: 'work' | 'break' | 'long_break'
  duration: number
  completedAt: Date
}

interface FocusStatsProps {
  sessions: Session[]
  dailyGoal: number
  className?: string
}

function isToday(date: Date) {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isThisWeek(date: Date) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return date >= weekAgo
}

export default function FocusStats({ sessions, dailyGoal, className }: FocusStatsProps) {
  const stats = useMemo(() => {
    const workSessions = sessions.filter((s) => s.type === 'work')
    const todaySessions = workSessions.filter((s) => isToday(s.completedAt))
    const weekSessions = workSessions.filter((s) => isThisWeek(s.completedAt))

    return {
      todayCount: todaySessions.length,
      todayMinutes: todaySessions.reduce((acc, s) => acc + s.duration, 0),
      weekCount: weekSessions.length,
      weekMinutes: weekSessions.reduce((acc, s) => acc + s.duration, 0),
      weekDailyAvg: Math.round((weekSessions.length / 7) * 10) / 10,
    }
  }, [sessions])

  const goalProgress = Math.min((stats.todayCount / dailyGoal) * 100, 100)
  const goalReached = stats.todayCount >= dailyGoal

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="heading-md text-text-primary flex items-center gap-2">
        <TrendingUp size={16} className="text-accent-blue" />
        专注统计
      </h3>

      {/* Today */}
      <div className="bg-white/[0.03] rounded-xl p-3.5">
        <div className="text-xs text-text-muted mb-2.5 uppercase tracking-wider font-medium">今日</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-2xl font-bold tracking-tight text-accent-blue">
              {stats.todayCount}
            </div>
            <div className="caption text-text-muted">专注次数</div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-accent-purple">
              {stats.todayMinutes}
            </div>
            <div className="caption text-text-muted">专注分钟</div>
          </div>
        </div>
      </div>

      {/* Goal progress */}
      <div className="bg-white/[0.03] rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium uppercase tracking-wider">
            <Target size={12} />
            目标进度
          </div>
          <span className={cn(
            'text-sm font-mono font-medium',
            goalReached ? 'text-accent-success' : 'text-accent-blue'
          )}>
            {stats.todayCount}/{dailyGoal}
          </span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              goalReached
                ? 'bg-gradient-to-r from-accent-success to-accent-success/70'
                : 'bg-gradient-to-r from-accent-blue to-accent-purple'
            )}
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        {goalReached && (
          <p className="caption text-accent-success mt-1.5">今日目标已达成</p>
        )}
      </div>

      {/* This week */}
      <div className="bg-white/[0.03] rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2.5 font-medium uppercase tracking-wider">
          <Clock size={12} />
          本周
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-accent-blue">{stats.weekCount}</div>
            <div className="caption text-text-muted">总次数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-accent-purple">{stats.weekMinutes}</div>
            <div className="caption text-text-muted">总分钟</div>
          </div>
          <div>
            <div className="text-lg font-bold text-accent-amber">{stats.weekDailyAvg}</div>
            <div className="caption text-text-muted">日均</div>
          </div>
        </div>
      </div>
    </div>
  )
}
