'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { pomodoroApi, PomodoroStats, PomodoroSettings, DailyStats } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/toast'
import { Play, Pause, RotateCcw, Settings, Target, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [stats, setStats] = useState<PomodoroStats | null>(null)
  const [settings, setSettings] = useState<PomodoroSettings | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(8)
  const { toast } = useToast()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<number | null>(null)

  // 同步 sessionId 到 ref
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const loadStats = useCallback(async () => {
    try {
      const [statsData, settingsData, dailyData] = await Promise.all([
        pomodoroApi.getStats('today'),
        pomodoroApi.getSettings(),
        pomodoroApi.getDailyStats(30)
      ])
      setStats(statsData)
      setSettings(settingsData)
      setDailyStats(dailyData)
      setDailyGoal(settingsData.daily_goal)
      setTimeLeft(settingsData.work_duration * 60)
    } catch {
      toast('加载统计失败', 'error')
    }
  }, [toast])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const stopPomodoro = useCallback(async (completed: boolean) => {
    const currentSessionId = sessionIdRef.current
    if (!currentSessionId) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRunning(false)
    setSessionId(null)
    setTimeLeft((settings?.work_duration || 25) * 60)

    try {
      await pomodoroApi.stop(currentSessionId, { completed })
      loadStats()
      toast(completed ? '番茄完成！' : '番茄钟已停止')
    } catch {
      toast('停止番茄钟失败', 'error')
    }
  }, [loadStats, toast, settings])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            const currentId = sessionIdRef.current
            if (currentId) {
              setIsRunning(false)
              setSessionId(null)
              pomodoroApi.stop(currentId, { completed: true }).then(() => {
                loadStats()
                toast('番茄完成！')
              }).catch(() => {
                toast('停止番茄钟失败', 'error')
              })
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, timeLeft, loadStats, toast])

  const handleStart = async () => {
    try {
      const session = await pomodoroApi.start({ duration_minutes: settings?.work_duration || 25 })
      setSessionId(session.id)
      setIsRunning(true)
    } catch {
      toast('开始番茄钟失败', 'error')
    }
  }

  const handleStop = async () => {
    await stopPomodoro(false)
  }

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRunning(false)
    setSessionId(null)
    setTimeLeft((settings?.work_duration || 25) * 60)
  }

  const handleSaveSettings = async () => {
    try {
      await pomodoroApi.updateSettings({ daily_goal: dailyGoal })
      loadStats()
      setShowSettings(false)
      toast('设置已保存')
    } catch {
      toast('保存设置失败', 'error')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = stats ? (stats.completed_sessions / dailyGoal) * 100 : 0

  // 准备热力图数据
  const heatmapData = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const stat = dailyStats.find(s => s.date === date)
    return {
      date,
      count: stat?.count || 0,
      day: format(subDays(new Date(), 29 - i), 'MM/dd')
    }
  })

  if (!stats || !settings) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">番茄钟</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="w-48 h-48 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex justify-center gap-4 mt-6">
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">番茄钟</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="mr-2" size={16} />
          设置
        </Button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="dark:text-white">番茄钟设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">每日目标番茄数</label>
                <Input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 8)}
                  min={1}
                  max={20}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">工作时长（分钟）</label>
                <p className="text-lg font-bold mt-1">{settings?.work_duration || 25}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">短休息时长</label>
                <p className="text-lg font-bold mt-1">{settings?.short_break || 5} 分钟</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">长休息时长</label>
                <p className="text-lg font-bold mt-1">{settings?.long_break || 15} 分钟</p>
              </div>
            </div>
            <Button onClick={handleSaveSettings} className="mt-4">
              保存设置
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 计时器 */}
        <Card>
          <CardContent className="pt-6">
            {/* 进度圈 */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  className="text-blue-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-mono dark:text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {isRunning ? '专注中...' : '准备开始'}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {!isRunning ? (
                <Button onClick={handleStart} size="lg">
                  <Play className="mr-2" size={20} />
                  开始
                </Button>
              ) : (
                <Button onClick={handleStop} size="lg" variant="destructive">
                  <Pause className="mr-2" size={20} />
                  停止
                </Button>
              )}
              <Button onClick={handleReset} size="lg" variant="outline">
                <RotateCcw className="mr-2" size={20} />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 今日统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="dark:text-white">今日统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Target className="mx-auto mb-2 text-blue-500" size={24} />
                <p className="text-3xl font-bold dark:text-white">{stats?.completed_sessions || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">/ {dailyGoal} 番茄</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Clock className="mx-auto mb-2 text-green-500" size={24} />
                <p className="text-3xl font-bold dark:text-white">{stats?.total_hours || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">小时专注</p>
              </div>
            </div>
            {(stats?.completed_sessions || 0) === 0 && (
              <div className="text-center text-blue-500 dark:text-blue-400 mb-4 py-2">
                <p className="text-sm">开始你的第一个番茄钟！</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">完成率</p>
              <p className="text-xl font-bold dark:text-white">{stats?.completion_rate || 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热力图 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="dark:text-white">专注热力图（近30天）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
