'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  taskApi, pomodoroApi, scheduleApi,
  type Task, type DailyStats, type HourlyStats, type PomodoroStats, type Course,
} from '@/lib/api'
import {
  CheckSquare, CheckCircle, Timer, Calendar,
  BarChart3, Clock, BookOpen,
} from 'lucide-react'

// ---------- 颜色常量 ----------
const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

const HEATMAP_COLORS = [
  '#e2e8f0', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
]

// ---------- 工具函数 ----------
function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

// ---------- 骨架屏 ----------
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

// ---------- 统计卡片 ----------
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: string
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}

// ---------- 主页面 ----------
export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([])
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      try {
        const [t, ds, hs, ps, c] = await Promise.all([
          taskApi.getAll(),
          pomodoroApi.getDailyStats(7),
          pomodoroApi.getHourlyStats(),
          pomodoroApi.getStats('today'),
          scheduleApi.getAll(),
        ])
        setTasks(Array.isArray(t) ? t : [])
        setDailyStats(Array.isArray(ds) ? ds : [])
        setHourlyStats(Array.isArray(hs) ? hs : [])
        setPomodoroStats(ps)
        setCourses(Array.isArray(c) ? c : [])
      } catch (err) {
        console.error('加载仪表盘数据失败', err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  // ---------- 派生数据 ----------
  const todayPending = useMemo(() => tasks.filter(
    (t) => t.status === 'pending' && t.due_date && isToday(t.due_date)
  ).length, [tasks])

  const todayDone = useMemo(() => tasks.filter(
    (t) => t.status === 'done' && t.updated_at && isToday(t.updated_at)
  ).length, [tasks])

  const focusMinutes = pomodoroStats?.total_minutes ?? 0

  const weekCourses = courses.length

  // 折线图：最近 7 天每天的番茄数据
  const lineData = useMemo(() => dailyStats.map((d) => ({
    date: d.date.slice(5), // MM-DD
    '专注分钟': d.minutes,
  })), [dailyStats])

  // 饼图：每小时专注次数
  const pieData = useMemo(() => hourlyStats
    .filter((h) => h.count > 0)
    .map((h) => ({
      name: formatHour(h.hour),
      value: h.count,
    })), [hourlyStats])

  // 热力图：day_of_week x 时间段（8-22 点）
  const timeSlots = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 8), []) // 8 ~ 22
  const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

  // 预计算热力图数据
  const heatmapGrid = useMemo(() => {
    const grid = new Map<string, { courses: Course[]; color: string }>()
    for (const course of courses) {
      const startH = parseInt(course.start_time.split(':')[0], 10)
      const endH = parseInt(course.end_time.split(':')[0], 10)
      const endM = parseInt(course.end_time.split(':')[1] || '0', 10)
      const adjustedEnd = endM > 0 ? endH + 1 : endH
      for (let hour = startH; hour < adjustedEnd; hour++) {
        const key = `${course.day_of_week}-${hour}`
        const existing = grid.get(key)
        if (existing) {
          existing.courses.push(course)
        } else {
          grid.set(key, { courses: [course], color: '' })
        }
      }
    }
    // Compute colors
    for (const [key, cell] of grid) {
      const count = cell.courses.length
      cell.color = count === 0 ? HEATMAP_COLORS[0] : HEATMAP_COLORS[Math.min(count, HEATMAP_COLORS.length - 1)]
    }
    return grid
  }, [courses])

  function getCoursesAt(day: number, hour: number): Course[] {
    return heatmapGrid.get(`${day}-${hour}`)?.courses || []
  }

  function getHeatColor(day: number, hour: number): string {
    return heatmapGrid.get(`${day}-${hour}`)?.color || HEATMAP_COLORS[0]
  }

  // ---------- 骨架屏 ----------
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">数据看板</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent>
          </Card>
          <Card>
            <CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    )
  }

  // ---------- 渲染 ----------
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">数据看板</h1>

      {/* ---- 顶部统计卡片 ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckSquare size={20} className="text-white" />}
          label="今日待办"
          value={todayPending}
          sub="个任务等待完成"
          color="bg-blue-500"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-white" />}
          label="今日已完成"
          value={todayDone}
          sub="个任务已完成"
          color="bg-green-500"
        />
        <StatCard
          icon={<Timer size={20} className="text-white" />}
          label="今日专注"
          value={`${focusMinutes}`}
          sub="分钟"
          color="bg-amber-500"
        />
        <StatCard
          icon={<BookOpen size={20} className="text-white" />}
          label="本周课程"
          value={weekCourses}
          sub="门课程"
          color="bg-purple-500"
        />
      </div>

      {/* ---- 图表区域 ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务完成趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 size={20} />
              专注时间趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="专注分钟"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 专注时间分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock size={20} />
              专注时间分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                    formatter={(value) => [`${value} 次`, '专注次数']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- 课程热力图 ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar size={20} />
            课程时间分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-500">
              暂无课程数据
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* 表头：时间段 */}
                <div className="flex items-center mb-2">
                  <div className="w-10 shrink-0" />
                  {timeSlots.map((h) => (
                    <div
                      key={h}
                      className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                {/* 每天一行 */}
                {dayLabels.map((label, dayIdx) => {
                  const day = dayIdx + 1
                  return (
                    <div key={day} className="flex items-center mb-1">
                      <div className="w-10 shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                        周{label}
                      </div>
                      {timeSlots.map((h) => {
                        const coursesAtSlot = getCoursesAt(day, h)
                        const bg = getHeatColor(day, h)
                        return (
                          <div
                            key={`${day}-${h}`}
                            className="flex-1 aspect-square mx-0.5 rounded-sm relative group cursor-default transition-colors"
                            style={{ backgroundColor: bg }}
                          >
                            {coursesAtSlot.length > 0 && (
                              <>
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-sm truncate px-0.5">
                                  {coursesAtSlot[0].name.slice(0, 2)}
                                </span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                    {coursesAtSlot.map((c) => (
                                      <div key={c.id}>
                                        {c.name} {c.start_time}-{c.end_time}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* 图例 */}
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">少</span>
                  {HEATMAP_COLORS.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">多</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
