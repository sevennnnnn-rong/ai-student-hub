import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Calendar, Clock, ChevronRight } from 'lucide-react'
import { scheduleApi, type Course } from '../lib/api'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { EmptyState } from '../components/ui'
import { CardSkeleton } from '../components/ui/LoadingStates'
import { usePageTitle } from '../hooks/usePageTitle'

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const timeSlots = Array.from({ length: 15 }, (_, i) => i + 8)

const defaultColors = ['#00d4ff', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#10b981']

export default function Schedule() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  usePageTitle('课程表')
  const [form, setForm] = useState({
    name: '', teacher: '', location: '',
    day_of_week: 1, start_time: '08:00', end_time: '09:30',
    color: defaultColors[0],
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    scheduleApi.getAll().then(setCourses).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Build grid
  const grid = useMemo(() => {
    const map = new Map<string, Course[]>()
    for (const c of courses) {
      const startH = parseInt(c.start_time.split(':')[0], 10)
      const endH = parseInt(c.end_time.split(':')[0], 10)
      const endM = parseInt(c.end_time.split(':')[1] || '0', 10)
      const adjusted = endM > 0 ? endH + 1 : endH
      for (let h = startH; h < adjusted; h++) {
        const key = `${c.day_of_week}-${h}`
        const existing = map.get(key)
        if (existing) existing.push(c)
        else map.set(key, [c])
      }
    }
    return map
  }, [courses])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    // Conflict detection
    const conflicting = courses.find(
      (c) => c.day_of_week === form.day_of_week &&
        c.start_time < form.end_time && c.end_time > form.start_time
    )
    if (conflicting) {
      toast(`与 "${conflicting.name}" 时间冲突`, 'error')
      return
    }
    try {
      const course = await scheduleApi.create(form as any)
      setCourses((prev) => [...prev, course])
      setShowForm(false)
      setForm({ name: '', teacher: '', location: '', day_of_week: 1, start_time: '08:00', end_time: '09:30', color: defaultColors[0] })
      toast('课程已添加', 'success')
    } catch {
      toast('添加失败', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await scheduleApi.delete(id)
      setCourses((prev) => prev.filter((c) => c.id !== id))
      setSelectedCourse(null)
      toast('课程已删除', 'success')
    } catch {
      toast('删除失败', 'error')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">课程表</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'btn btn-sm rounded-xl font-medium flex items-center gap-1.5 transition-all',
            showForm
              ? 'bg-accent-danger/15 text-accent-danger'
              : 'bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25'
          )}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? '取消' : '添加课程'}
        </button>
      </div>

      {/* Today's Schedule Summary */}
      {!loading && courses.length > 0 && (() => {
        const today = (new Date().getDay() + 6) % 7 + 1
        const todayCourses = courses
          .filter((c) => c.day_of_week === today)
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
        if (todayCourses.length === 0) return null

        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const nextClass = todayCourses.find((c) => c.start_time > currentTime)
        const currentClass = todayCourses.find((c) => c.start_time <= currentTime && c.end_time > currentTime)

        return (
          <div className="glass rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-accent-blue" />
              <span className="text-sm font-medium">今日课程 ({todayCourses.length})</span>
              {currentClass && (
                <span className="caption px-2 py-0.5 rounded-full bg-accent-success/15 text-accent-success font-medium">
                  正在上课
                </span>
              )}
              {!currentClass && nextClass && (
                <span className="caption px-2 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber font-medium flex items-center gap-1">
                  下一节: {nextClass.name} {nextClass.start_time}
                  <ChevronRight size={10} />
                </span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {todayCourses.map((c) => {
                const isCurrent = currentClass?.id === c.id
                const isPast = c.end_time <= currentTime
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'shrink-0 px-3 py-2 rounded-xl text-xs border transition-all',
                      isCurrent ? 'border-accent-success/30 ring-1 ring-accent-success/20' : 'border-white/5',
                      isPast && 'opacity-50'
                    )}
                    style={{ background: `${c.color || defaultColors[0]}15` }}
                  >
                    <div className="font-medium" style={{ color: c.color || defaultColors[0] }}>{c.name}</div>
                    <div className="text-text-muted mt-0.5">{c.start_time} - {c.end_time}</div>
                    {c.location && <div className="text-text-muted">{c.location}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 animate-slide-up">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input placeholder="课程名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-glass" />
            <input placeholder="教师" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              className="input-glass" />
            <input placeholder="教室" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input-glass" />
            <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: +e.target.value })}
              className="input-glass">
              {dayLabels.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="input-glass w-auto" />
            <span className="text-text-muted">—</span>
            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="input-glass w-auto" />
            <div className="flex gap-1.5 ml-2">
              {defaultColors.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={cn('w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                    form.color === c ? 'border-white scale-110' : 'border-transparent'
                  )} style={{ background: c }}
                  aria-label={`选择颜色 ${c}`}
                  aria-pressed={form.color === c} />
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={handleCreate}
              className="btn btn-primary rounded-xl flex items-center gap-2">
              <Plus size={14} />
              保存
            </button>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      {loading ? (
        <CardSkeleton />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} />}
          title="暂无课程数据"
          description="点击上方按钮添加你的第一门课程"
        />
      ) : (
        <div className="glass rounded-2xl p-4 overflow-x-auto">
          <div className="min-w-[700px] relative">
            {/* Header */}
            <div className="flex items-center mb-2">
              <div className="w-16 shrink-0" />
              {timeSlots.map((h) => (
                <div key={h} className="flex-1 text-center caption text-text-muted font-mono">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {/* Current Time Indicator */}
            {(() => {
              const now = new Date()
              const currentHour = now.getHours()
              const currentMin = now.getMinutes()
              const todayIndex = (now.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
              if (currentHour >= 8 && currentHour < 23 && todayIndex < 7) {
                const slotIndex = currentHour - 8
                const leftPercent = ((slotIndex + currentMin / 60) / timeSlots.length) * 100
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-accent-danger z-10 pointer-events-none"
                    style={{ left: `calc(64px + ${leftPercent}% * (100% - 64px) / 100)` }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-accent-danger" />
                  </div>
                )
              }
              return null
            })()}
            {/* Rows */}
            {dayLabels.map((label, idx) => {
              const day = idx + 1
              const isToday = new Date().getDay() === (idx + 1) % 7
              return (
                <div key={day} className={cn('flex items-center mb-1', isToday && 'bg-accent-blue/5 rounded-lg')}>
                  <div className={cn(
                    'w-16 shrink-0 text-xs font-medium',
                    isToday ? 'text-accent-blue' : 'text-text-secondary'
                  )}>
                    {label}
                    {isToday && <span className="ml-1 caption text-accent-blue">(今天)</span>}
                  </div>
                  {timeSlots.map((h) => {
                    const cell = grid.get(`${day}-${h}`)
                    return (
                      <div key={`${day}-${h}`} className="flex-1 h-10 mx-0.5 rounded-md relative group cursor-pointer">
                        {cell && cell.length > 0 ? (
                          <div
                            className="absolute inset-0 rounded-md opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ background: cell[0].color || defaultColors[0] }}
                            onClick={() => setSelectedCourse(cell[0])}
                          >
                            <span className="caption font-bold text-white drop-shadow-sm truncate px-1">
                              {cell[0].name.slice(0, 4)}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 rounded-md bg-white/[0.02] hover:bg-white/[0.05] transition-colors" />
                        )}
                        {/* Tooltip */}
                        {cell && cell.length > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                            <div className="glass px-3 py-2 rounded-xl shadow-xl border border-white/10">
                              <div className="text-xs font-bold text-text-primary">{cell[0].name}</div>
                              <div className="caption text-text-muted mt-0.5">
                                {cell[0].start_time} - {cell[0].end_time}
                              </div>
                              {cell[0].teacher && (
                                <div className="caption text-text-muted">{cell[0].teacher}</div>
                              )}
                              {cell[0].location && (
                                <div className="caption text-text-muted">{cell[0].location}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {[...new Set(courses.map((c) => JSON.stringify({ name: c.name, color: c.color || defaultColors[0] })))].map((item) => {
              const { name, color } = JSON.parse(item)
              return (
                <div key={name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                  {name}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCourse(null)}>
          <div className="glass p-6 rounded-2xl w-80 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: selectedCourse.color || defaultColors[0] }} />
              <h3 className="font-bold text-lg">{selectedCourse.name}</h3>
            </div>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <div className="flex justify-between">
                <span>时间</span>
                <span>{dayLabels[selectedCourse.day_of_week - 1]} {selectedCourse.start_time} - {selectedCourse.end_time}</span>
              </div>
              {selectedCourse.teacher && (
                <div className="flex justify-between">
                  <span>教师</span>
                  <span>{selectedCourse.teacher}</span>
                </div>
              )}
              {selectedCourse.location && (
                <div className="flex justify-between">
                  <span>教室</span>
                  <span>{selectedCourse.location}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedCourse(null)} className="flex-1 btn btn-ghost rounded-xl text-sm">关闭</button>
              <button onClick={() => handleDelete(selectedCourse.id)} className="flex-1 btn btn-primary rounded-xl bg-accent-danger/80 hover:bg-accent-danger text-sm">删除课程</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
