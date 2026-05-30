import { lazy, Suspense, useState, useEffect, useMemo } from 'react'
import { CheckSquare, CheckCircle, Timer, BookOpen, BarChart3, TrendingUp, Target } from 'lucide-react'
import { taskApi, pomodoroApi, scheduleApi, type Task, type DailyStats, type HourlyStats, type PomodoroStats, type Course } from '../lib/api'
import { GlassCard, StatCard, EmptyState } from '../components/ui'
import { DashboardSkeleton } from '../components/ui/LoadingStates'
import { usePageTitle } from '../hooks/usePageTitle'

const StudyTrendChart = lazy(() => import('../components/charts/StudyTrendChart'))
const FocusDistributionChart = lazy(() => import('../components/charts/FocusDistributionChart'))
const TaskCompletionChart = lazy(() => import('../components/charts/TaskCompletionChart'))

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
  const todayDone = useMemo(() => tasks.filter((t) => t.status === 'done' && t.updated_at && isToday(t.updated_at)).length, [tasks])
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sorted.length; i++) {
      const statDate = new Date(sorted[i].date)
      statDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(today)
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
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">数据看板</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据看板</h1>
          <p className="text-sm text-text-muted mt-1">
            {studyStreak > 0 ? `已连续学习 ${studyStreak} 天` : '开始你的学习之旅'}
          </p>
        </div>
        {studyStreak >= 3 && (
          <div className="px-3 py-1.5 rounded-xl bg-accent-success/10 border border-accent-success/20 text-accent-success text-xs font-medium">
            {studyStreak >= 7 ? '连续 7 天以上' : `连续 ${studyStreak} 天`}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <GlassCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent-blue" />
          <h3 className="font-medium">本周概览</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-blue">{completionRate}%</div>
            <div className="text-xs text-text-muted mt-1">任务完成率</div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-purple">{weekMinutes}</div>
            <div className="text-xs text-text-muted mt-1">本周专注(分钟)</div>
            <div className="text-[10px] text-text-muted mt-1">日均 {avgDailyMinutes} 分钟</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-amber">{dailyStats.filter((d) => d.minutes > 0).length}</div>
            <div className="text-xs text-text-muted mt-1">活跃天数</div>
            <div className="text-[10px] text-text-muted mt-1">共 {dailyStats.length} 天</div>
          </div>
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              studyStreak >= 7 ? 'text-accent-success' : studyStreak >= 3 ? 'text-accent-blue' : 'text-text-secondary'
            )}>{studyStreak}</div>
            <div className="text-xs text-text-muted mt-1">连续天数</div>
            <div className="text-[10px] text-text-muted mt-1">
              {studyStreak >= 7 ? '坚持得真棒！' : studyStreak >= 3 ? '继续保持！' : '加油！'}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <GlassCard padding="md">
          <h3 className="font-medium mb-4">专注时间趋势</h3>
          {lineData.length === 0 ? (
            <EmptyState
              icon={<BarChart3 size={40} />}
              title="暂无数据"
              description="完成一次番茄钟专注后，这里会显示趋势图"
            />
          ) : (
            <Suspense fallback={<div className="h-[260px] skeleton" />}>
              <StudyTrendChart data={lineData} />
            </Suspense>
          )}
        </GlassCard>

        {/* Pie Chart */}
        <GlassCard padding="md">
          <h3 className="font-medium mb-4">专注时间分布</h3>
          {pieData.length === 0 ? (
            <EmptyState
              icon={<Timer size={40} />}
              title="暂无数据"
              description="开始你的第一次专注，查看时间分布"
            />
          ) : (
            <Suspense fallback={<div className="h-[260px] skeleton" />}>
              <FocusDistributionChart data={pieData} />
            </Suspense>
          )}
        </GlassCard>
      </div>

      {/* Task Completion Chart */}
      <GlassCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-accent-purple" />
          <h3 className="font-medium">任务完成情况</h3>
        </div>
        {taskCompletionData.every((d) => d.pending === 0 && d.done === 0) ? (
          <EmptyState
            icon={<CheckSquare size={40} />}
            title="暂无任务数据"
            description="添加一些任务后，这里会显示完成情况"
          />
        ) : (
          <Suspense fallback={<div className="h-[200px] skeleton" />}>
            <TaskCompletionChart data={taskCompletionData} />
          </Suspense>
        )}
      </GlassCard>
    </div>
  )
}
