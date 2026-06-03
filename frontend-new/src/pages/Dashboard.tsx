import { lazy, Suspense, useState, useEffect, useMemo } from 'react'
import { CheckSquare, CheckCircle, Timer, BookOpen, BarChart3, TrendingUp, Target, Flame, Zap, Clock } from 'lucide-react'
import { taskApi, pomodoroApi, scheduleApi, type Task, type DailyStats, type HourlyStats, type PomodoroStats, type Course } from '../lib/api'
import { GlassCard, StatCard, EmptyState } from '../components/ui'
import { DashboardSkeleton } from '../components/ui/LoadingStates'
import { usePageTitle } from '../hooks/usePageTitle'
import { cn } from '../lib/utils'

const StudyTrendChart = lazy(() => import('../components/charts/StudyTrendChart'))
const FocusDistributionChart = lazy(() => import('../components/charts/FocusDistributionChart'))
const TaskCompletionChart = lazy(() => import('../components/charts/TaskCompletionChart'))

// Helper: compute trend between two values
function getTrend(curr: number, prev: number): { trend: 'up' | 'down' | 'flat'; trendValue: string } {
  if (prev === 0 && curr === 0) return { trend: 'flat', trendValue: '' }
  if (prev === 0) return { trend: 'up', trendValue: '新增' }
  const diff = curr - prev
  const pct = Math.round(Math.abs(diff) / prev * 100)
  if (diff > 0) return { trend: 'up', trendValue: `+${pct}%` }
  if (diff < 0) return { trend: 'down', trendValue: `-${pct}%` }
  return { trend: 'flat', trendValue: '' }
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([])
  usePageTitle('数据看板')
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      taskApi.getAll(), pomodoroApi.getDailyStats(7),
      pomodoroApi.getHourlyStats(), pomodoroApi.getStats('today'),
      scheduleApi.getAll(),
    ]).then(([t, ds, hs, ps, c]) => {
      setTasks(Array.isArray(t) ? t : [])
      setDailyStats(Array.isArray(ds) ? ds : [])
      setHourlyStats(Array.isArray(hs) ? hs : [])
      setPomodoroStats(ps)
      setCourses(Array.isArray(c) ? c : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const todayPending = useMemo(() => tasks.filter((t) => t.status === 'pending' && t.due_date && isToday(t.due_date)).length, [tasks])
  const todayDone = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks])
  const focusMinutes = pomodoroStats?.total_minutes ?? 0
  const weekCourses = courses.length

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const weekMinutes = useMemo(() => dailyStats.reduce((acc, d) => acc + d.minutes, 0), [dailyStats])
  const avgDailyMinutes = dailyStats.length > 0 ? Math.round(weekMinutes / dailyStats.length) : 0

  // Calculate study streak (consecutive days with study)
  const studyStreak = useMemo(() => {
    if (dailyStats.length === 0) return 0
    const sorted = [...dailyStats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let streak = 0
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    for (let i = 0; i < sorted.length; i++) {
      const statDate = new Date(sorted[i].date)
      statDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(todayDate)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (statDate.getTime() === expectedDate.getTime() && sorted[i].minutes > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [dailyStats])

  const lineData = useMemo(() => dailyStats.map((d) => ({ date: d.date.slice(5), minutes: d.minutes })), [dailyStats])
  const pieData = useMemo(() => hourlyStats.filter((h) => h.count > 0).map((h) => ({ name: `${String(h.hour).padStart(2, '0')}:00`, value: h.count })), [hourlyStats])

  // Today vs yesterday comparison for trend arrows
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return dailyStats.find((d) => d.date === today)
  }, [dailyStats])
  const yesterdayStats = useMemo(() => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    return dailyStats.find((d) => d.date === yesterday)
  }, [dailyStats])
  const todayMinutes = todayStats?.minutes ?? 0
  const yesterdayMinutes = yesterdayStats?.minutes ?? 0

  // Weekly heatmap: last 7 days with activity status
  const weeklyHeatmap = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
      const stat = dailyStats.find((s) => s.date === dateStr)
      const minutes = stat?.minutes ?? 0
      const isToday = i === 0
      days.push({ date: dateStr, dayName, minutes, isToday })
    }
    return days
  }, [dailyStats])

  // Focus goal (e.g., 120 minutes per day)
  const focusGoal = 120
  const focusProgress = Math.min((todayMinutes / focusGoal) * 100, 100)

  // Task completion data by priority
  const taskCompletionData = useMemo(() => {
    const priorities = ['high', 'medium', 'low'] as const
    const labels = { high: '高', medium: '中', low: '低' }
    return priorities.map((p) => ({
      name: `${labels[p]}优先`,
      pending: tasks.filter((t) => t.priority === p && t.status !== 'done').length,
      done: tasks.filter((t) => t.priority === p && t.status === 'done').length,
    }))
  }, [tasks])

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <h1 className="text-3xl font-bold">数据看板</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">数据看板</h1>
          <p className="text-sm text-text-secondary">
            {studyStreak > 0 ? `已连续学习 ${studyStreak} 天` : '开始你的学习之旅'}
          </p>
        </div>
        {studyStreak >= 3 && (
          <div className="glass px-4 py-2 rounded-2xl bg-accent-success/10 border border-accent-success/20 text-accent-success text-sm font-medium">
            {studyStreak >= 7 ? '连续 7 天以上' : `连续 ${studyStreak} 天`}
          </div>
        )}
      </div>

      {/* Today's Summary */}
      <GlassCard padding="lg" rounded="rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={18} className="text-accent-amber" />
          <h3 className="text-lg font-semibold">今日概览</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Streak Status */}
          <div className="flex flex-col items-center justify-center text-center p-5 rounded-2xl glass">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              studyStreak >= 7 ? 'bg-accent-success/15' : studyStreak >= 3 ? 'bg-accent-blue/15' : 'bg-white/5'
            )}>
              <Flame size={28} className={cn(
                studyStreak >= 7 ? 'text-accent-success' : studyStreak >= 3 ? 'text-accent-blue' : 'text-text-muted'
              )} />
            </div>
            <div className="text-3xl font-bold tracking-tight">{studyStreak} 天</div>
            <div className="text-xs text-text-muted mt-2">
              {studyStreak === 0 && '开始你的学习之旅'}
              {studyStreak >= 1 && studyStreak < 3 && '坚持就是胜利！'}
              {studyStreak >= 3 && studyStreak < 7 && '势头不错，继续加油！'}
              {studyStreak >= 7 && studyStreak < 14 && '连续一周，太强了！'}
              {studyStreak >= 14 && studyStreak < 30 && '两周不断，学霸本霸！'}
              {studyStreak >= 30 && '一个月了，你就是传奇！'}
            </div>
          </div>

          {/* Mini Weekly Heatmap */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl glass">
            <div className="text-xs text-text-muted mb-4">本周学习日历</div>
            <div className="flex items-center gap-2.5">
              {weeklyHeatmap.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-medium transition-all',
                      day.isToday && 'ring-2 ring-accent-blue ring-offset-2 ring-offset-bg-primary',
                      day.minutes >= 60 ? 'bg-accent-success text-white' :
                      day.minutes >= 30 ? 'bg-accent-success/50 text-white' :
                      day.minutes > 0 ? 'bg-accent-success/20 text-accent-success' :
                      'glass text-text-muted'
                    )}
                  >
                    {day.minutes > 0 ? Math.round(day.minutes / 60 * 10) / 10 || '<1' : '·'}
                  </div>
                  <span className={cn('text-xs', day.isToday ? 'text-accent-blue font-medium' : 'text-text-muted')}>
                    {day.dayName}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm glass" />无</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-success/20" />少量</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-success/50" />适中</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-success" />充足</span>
            </div>
          </div>

          {/* Focus Time vs Goal */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl glass">
            <div className="text-xs text-text-muted mb-4">今日专注进度</div>
            <div className="relative w-28 h-28 mb-4">
              {/* Progress ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-white/5" />
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                  className={cn(
                    'transition-all duration-700',
                    focusProgress >= 100 ? 'stroke-accent-success' : focusProgress >= 50 ? 'stroke-accent-blue' : 'stroke-accent-amber'
                  )}
                  strokeDasharray={`${focusProgress * 2.64} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock size={14} className="text-text-muted mb-0.5" />
                <span className="text-xl font-bold">{todayMinutes}</span>
                <span className="text-xs text-text-muted">分钟</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-muted">目标 {focusGoal} 分钟</div>
              <div className={cn(
                'text-sm font-medium mt-1.5',
                focusProgress >= 100 ? 'text-accent-success' : focusProgress >= 50 ? 'text-accent-blue' : 'text-text-secondary'
              )}>
                {focusProgress >= 100 ? '目标已达成！' : `还差 ${focusGoal - todayMinutes} 分钟`}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<CheckSquare size={18} />}
          label="今日待办"
          value={todayPending}
          sub="个任务"
          color="bg-accent-blue"
          glow="glow-blue"
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="今日完成"
          value={todayDone}
          sub="个任务"
          color="bg-accent-success"
        />
        <StatCard
          icon={<Timer size={18} />}
          label="今日专注"
          value={`${focusMinutes}`}
          sub="分钟"
          color="bg-accent-amber"
          glow="glow-amber"
          {...getTrend(todayMinutes, yesterdayMinutes)}
        />
        <StatCard
          icon={<BookOpen size={18} />}
          label="本周课程"
          value={weekCourses}
          sub="门课程"
          color="bg-accent-purple"
          glow="glow-purple"
        />
      </div>

      {/* Weekly Summary */}
      <GlassCard padding="lg" rounded="rounded-2xl">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-accent-blue" />
          <h3 className="text-lg font-semibold">本周概览</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold tracking-tight text-accent-blue">{completionRate}%</div>
            <div className="text-sm mt-2">任务完成率</div>
            <div className="w-full h-2 glass rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold tracking-tight text-accent-purple">{weekMinutes}</div>
            <div className="text-sm mt-2">本周专注(分钟)</div>
            <div className="text-xs text-text-muted mt-1">日均 {avgDailyMinutes} 分钟</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold tracking-tight text-accent-amber">{dailyStats.filter((d) => d.minutes > 0).length}</div>
            <div className="text-sm mt-2">活跃天数</div>
            <div className="text-xs text-text-muted mt-1">共 {dailyStats.length} 天</div>
          </div>
          <div className="text-center">
            <div className={cn(
              'text-3xl font-bold tracking-tight',
              studyStreak >= 7 ? 'text-accent-success' : studyStreak >= 3 ? 'text-accent-blue' : 'text-text-secondary'
            )}>{studyStreak}</div>
            <div className="text-sm mt-2">连续天数</div>
            <div className="text-xs text-text-muted mt-1">
              {studyStreak >= 7 ? '坚持得真棒！' : studyStreak >= 3 ? '继续保持！' : '加油！'}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <GlassCard padding="lg" rounded="rounded-2xl">
          <h3 className="text-lg font-semibold mb-5">专注时间趋势</h3>
          {lineData.length === 0 ? (
            <EmptyState
              icon={<BarChart3 size={40} />}
              title="暂无数据"
              description="完成一次番茄钟专注后，这里会显示趋势图"
            />
          ) : (
            <Suspense fallback={<div className="h-[260px] glass rounded-xl" />}>
              <StudyTrendChart data={lineData} />
            </Suspense>
          )}
        </GlassCard>

        {/* Pie Chart */}
        <GlassCard padding="lg" rounded="rounded-2xl">
          <h3 className="text-lg font-semibold mb-5">专注时间分布</h3>
          {pieData.length === 0 ? (
            <EmptyState
              icon={<Timer size={40} />}
              title="暂无数据"
              description="开始你的第一次专注，查看时间分布"
            />
          ) : (
            <Suspense fallback={<div className="h-[260px] glass rounded-xl" />}>
              <FocusDistributionChart data={pieData} />
            </Suspense>
          )}
        </GlassCard>
      </div>

      {/* Task Completion Chart */}
      <GlassCard padding="lg" rounded="rounded-2xl">
        <div className="flex items-center gap-2 mb-5">
          <Target size={18} className="text-accent-purple" />
          <h3 className="text-lg font-semibold">任务完成情况</h3>
        </div>
        {taskCompletionData.every((d) => d.pending === 0 && d.done === 0) ? (
          <EmptyState
            icon={<CheckSquare size={40} />}
            title="暂无任务数据"
            description="添加一些任务后，这里会显示完成情况"
          />
        ) : (
          <Suspense fallback={<div className="h-[200px] glass rounded-xl" />}>
            <TaskCompletionChart data={taskCompletionData} />
          </Suspense>
        )}
      </GlassCard>
    </div>
  )
}
