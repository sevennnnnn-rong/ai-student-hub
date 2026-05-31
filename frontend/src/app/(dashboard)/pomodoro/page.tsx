'use client'

import { useState, useEffect } from 'react'
import { pomodoroApi, taskApi } from '@/lib/api'
import { useToast } from '@/lib/hooks'
import { RippleButton } from '@/components/ripple-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Play, Pause, RotateCcw, Timer, CheckCircle, History, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { ToastContainer } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading'

interface Task {
  id: number
  title: string
  status: string
}

interface PomodoroSession {
  id: number
  task_id: number | null
  task_title?: string
  duration_minutes: number
  completed: boolean
  started_at: string
  ended_at: string | null
}

const STORAGE_KEY = 'pomodoro_state'

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [duration, setDuration] = useState(25)
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [showLongBreak, setShowLongBreak] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const s = JSON.parse(saved)
        setDuration(s.duration || 25)
        setCompletedCount(s.completedCount || 0)
        setSelectedTaskId(s.selectedTaskId || null)
        setSessionId(s.sessionId || null)
        if (s.isRunning && s.startedAt && !s.isPaused) {
          const elapsed = Math.floor((Date.now() - s.startedAt) / 1000)
          const remaining = s.duration * 60 - elapsed
          if (remaining > 0) {
            setTimeLeft(remaining)
            setIsRunning(true)
          } else {
            handleStop(true)
          }
        } else if (s.isRunning && s.isPaused) {
          setTimeLeft(s.timeLeft || s.duration * 60)
          setIsRunning(true)
          setIsPaused(true)
        }
      } catch {}
    }
    loadStats()
    loadTasks()
    loadSessions()
  }, [])

  useEffect(() => {
    if (!showLongBreak) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLongBreak(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showLongBreak])

  useEffect(() => {
    if (isRunning) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isRunning, isPaused, sessionId, duration, completedCount,
        selectedTaskId, timeLeft, startedAt: Date.now(),
      }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [isRunning, isPaused, sessionId, duration, completedCount, selectedTaskId, timeLeft])

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isRunning && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      handleStop(true)
    }

    return () => clearInterval(timer)
  }, [isRunning, isPaused, timeLeft])

  const loadStats = async () => {
    try {
      const data = await pomodoroApi.getStats('today')
      setStats(data.data)
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const data = await taskApi.getAll({ status: 'pending' })
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const data = await pomodoroApi.getSessions({ limit: '10' })
      setSessions(data)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }

  const handleStart = async () => {
    try {
      const session = await pomodoroApi.start({
        task_id: selectedTaskId,
        duration_minutes: duration
      })
      setSessionId(session.id)
      setIsRunning(true)
      setIsPaused(false)
      setTimeLeft(duration * 60)
      toast.success('番茄钟已开始')
    } catch (error) {
      toast.error('开始番茄钟失败')
    }
  }

  const sendDesktopNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' })
        }
      })
    }
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      // 静默失败，某些浏览器可能限制自动播放
    }
  }

  const handleStop = async (completed: boolean) => {
    if (!sessionId) return

    try {
      await pomodoroApi.stop(sessionId, { completed })
      setIsRunning(false)
      setSessionId(null)
      setTimeLeft(duration * 60)
      loadStats()
      loadSessions()
      if (completed) {
        playNotificationSound()
        sendDesktopNotification('番茄钟完成！', `已完成 ${duration} 分钟专注，休息一下吧`)
        const newCount = completedCount + 1
        setCompletedCount(newCount)
        if (newCount % 4 === 0) {
          setShowLongBreak(true)
        }
      }
      toast.success(completed ? '番茄钟完成！' : '番茄钟已停止')
    } catch (error) {
      toast.error('停止番茄钟失败')
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(duration * 60)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  return (
    <div className="max-w-md mx-auto px-4 animate-fade-in-up">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* 计时器 */}
      <Card className="glass mb-6">
        <CardContent className="pt-6 text-center">
          {/* 当前任务 */}
          {isRunning && selectedTask && (
            <div className="mb-4 p-3 glass rounded-lg">
              <p className="text-sm text-gray-500">当前任务</p>
              <p className="font-medium text-blue-700">{selectedTask.title}</p>
            </div>
          )}

          <div className="text-5xl sm:text-6xl font-mono mb-4 gradient-text">
            {formatTime(timeLeft)}
          </div>

          {/* 番茄进度指示器 */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-colors ${
                  i < (completedCount % 4)
                    ? 'bg-red-500'
                    : 'bg-white/10'
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 self-center ml-2">
              {completedCount % 4}/4 休息
            </span>
          </div>

          {/* 时长选择 */}
          {!isRunning && (
            <div className="flex justify-center gap-2 mb-6">
              {[15, 25, 30, 45].map(min => (
                <RippleButton
                  key={min}
                  variant={duration === min ? 'default' : 'outline'}
                  size="sm"
                  className={duration === min ? 'glass' : ''}
                  onClick={() => {
                    setDuration(min)
                    setTimeLeft(min * 60)
                  }}
                >
                  {min}分钟
                </RippleButton>
              ))}
            </div>
          )}

          {/* 任务选择 */}
          {!isRunning && (
            <div className="mb-6">
              <Select
                options={[
                  { value: '', label: '选择任务（可选）' },
                  ...tasks.map(task => ({ value: String(task.id), label: task.title }))
                ]}
                value={selectedTaskId ? String(selectedTaskId) : ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          )}

          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <RippleButton onClick={handleStart} size="lg">
                <Play className="mr-2" size={20} />
                开始
              </RippleButton>
            ) : (
              <>
                <RippleButton
                  onClick={() => setIsPaused(!isPaused)}
                  size="lg"
                  variant={isPaused ? 'default' : 'outline'}
                >
                  {isPaused ? <Play className="mr-2" size={20} /> : <Pause className="mr-2" size={20} />}
                  {isPaused ? '继续' : '暂停'}
                </RippleButton>
                <RippleButton onClick={() => handleStop(false)} size="lg" variant="destructive">
                  停止
                </RippleButton>
              </>
            )}
            <RippleButton onClick={handleReset} size="lg" variant="outline" disabled={isRunning}>
              <RotateCcw className="mr-2" size={20} />
              重置
            </RippleButton>
          </div>
        </CardContent>
      </Card>

      {/* 今日统计 */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer size={20} />
            今日统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 glass rounded-lg">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                <p className="text-2xl font-bold">{stats.completed_sessions}</p>
                <p className="text-sm text-gray-500">完成番茄</p>
              </div>
              <div className="text-center p-4 glass rounded-lg">
                <Timer className="mx-auto mb-2 text-blue-500" size={24} />
                <p className="text-2xl font-bold">{stats.total_hours}</p>
                <p className="text-sm text-gray-500">专注小时</p>
              </div>
              <div className="col-span-2 text-center p-3 glass rounded-lg">
                <p className="text-sm text-gray-500">完成率</p>
                <p className="text-lg font-bold text-blue-600">{stats.completion_rate}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 历史记录 */}
      <Card className="glass card-hover mt-6">
        <CardHeader className="cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={20} />
              最近记录
            </div>
            <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
              {showHistory ? '收起' : '展开'}
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">暂无记录</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 glass rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {session.completed ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Clock size={16} className="text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {session.task_title || '自由专注'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.started_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.duration_minutes} 分钟</p>
                      <p className={`text-xs ${session.completed ? 'text-green-600' : 'text-gray-500'}`}>
                        {session.completed ? '完成' : '中断'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 长休息提醒 */}
      {showLongBreak && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-label="长休息提醒">
          <Card className="glass-strong animate-scale-in w-full max-w-sm mx-4 relative">
            <RippleButton
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 h-8 w-8 p-0"
              onClick={() => setShowLongBreak(false)}
            >
              <X size={16} />
            </RippleButton>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">已完成 {completedCount} 个番茄钟！</h3>
              <p className="text-gray-500 mb-6">建议休息 15-20 分钟，让大脑恢复活力</p>
              <div className="flex justify-center gap-3">
                <RippleButton variant="outline" onClick={() => setShowLongBreak(false)}>
                  继续工作
                </RippleButton>
                <RippleButton onClick={() => {
                  setShowLongBreak(false)
                  setDuration(15)
                  setTimeLeft(15 * 60)
                }}>
                  休息 15 分钟
                </RippleButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
