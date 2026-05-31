'use client'

import { useState, useEffect, Fragment } from 'react'
import { scheduleApi } from '@/lib/api'
import { useToast } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Clock, MapPin, User, Calendar } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { ToastContainer } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading'

interface Course {
  id: number
  name: string
  teacher: string | null
  location: string | null
  day_of_week: number
  start_time: string
  end_time: string
  color: string
  semester: string | null
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [semester, setSemester] = useState('')
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentDayAndHour = () => {
    const day = currentTime.getDay()
    const hour = currentTime.getHours()
    const adjustedDay = day === 0 ? 7 : day
    return { day: adjustedDay, hour }
  }

  const isCurrentTimeSlot = (day: number, hour: number) => {
    const { day: currentDay, hour: currentHour } = getCurrentDayAndHour()
    return currentDay === day && currentHour === hour
  }

  const isToday = (day: number) => {
    const { day: currentDay } = getCurrentDayAndHour()
    return currentDay === day
  }

  const scrollToToday = () => {
    const { day: currentDay, hour: currentHour } = getCurrentDayAndHour()
    const element = document.getElementById(`day-${currentDay}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    location: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:40',
    color: '#3b82f6',
    semester: ''
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async (sem?: string) => {
    try {
      const data = await scheduleApi.getAll(sem || undefined)
      setCourses(data)
    } catch (error) {
      toast.error('加载课程失败')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      teacher: '',
      location: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:40',
      color: '#3b82f6',
      semester: ''
    })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入课程名称')
      return
    }

    try {
      const course = await scheduleApi.create(formData)
      setCourses([...courses, course])
      setShowForm(false)
      resetForm()
      toast.success('课程添加成功')
    } catch (error) {
      toast.error('添加课程失败')
    }
  }

  const handleEdit = (course: Course) => {
    setEditCourse(course)
    setFormData({
      name: course.name,
      teacher: course.teacher || '',
      location: course.location || '',
      day_of_week: course.day_of_week,
      start_time: course.start_time,
      end_time: course.end_time,
      color: course.color,
      semester: course.semester || ''
    })
    setShowForm(true)
  }

  const handleSaveEdit = async () => {
    if (!editCourse || !formData.name.trim()) return

    try {
      const updated = await scheduleApi.update(editCourse.id, formData)
      setCourses(courses.map(c => c.id === editCourse.id ? updated : c))
      setEditCourse(null)
      setShowForm(false)
      resetForm()
      toast.success('课程更新成功')
    } catch (error) {
      toast.error('更新课程失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await scheduleApi.delete(deleteId)
      setCourses(courses.filter(c => c.id !== deleteId))
      toast.success('课程删除成功')
    } catch (error) {
      toast.error('删除课程失败')
    } finally {
      setDeleteId(null)
    }
  }

  const getCoursesAt = (day: number, hour: number) => {
    return courses.filter(c => {
      const startHour = parseInt(c.start_time.split(':')[0])
      const endHour = parseInt(c.end_time.split(':')[0])
      return c.day_of_week === day && hour >= startHour && hour < endHour
    })
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">课程表</h1>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">课程表</h1>
        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded-md px-3 py-1 text-sm"
            value={semester}
            onChange={(e) => { setSemester(e.target.value); loadCourses(e.target.value) }}
          >
            <option value="">全部学期</option>
            <option value="2025-1">2025 第一学期</option>
            <option value="2025-2">2025 第二学期</option>
            <option value="2026-1">2026 第一学期</option>
          </select>
          <Button variant="outline" onClick={scrollToToday}>
            <Calendar className="mr-2" size={16} />
            今天
          </Button>
          <Button onClick={() => { setShowForm(!showForm); setEditCourse(null); resetForm(); }}>
            <Plus className="mr-2" size={16} />
            {showForm ? '取消' : '添加课程'}
          </Button>
        </div>
      </div>

      {/* 添加/编辑课程表单 */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editCourse ? '编辑课程' : '添加课程'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="课程名称 *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Input
                placeholder="教师"
                value={formData.teacher}
                onChange={(e) => setFormData({...formData, teacher: e.target.value})}
              />
              <Input
                placeholder="地点"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
              <select
                className="border rounded-md px-3 py-2"
                value={formData.day_of_week}
                onChange={(e) => setFormData({...formData, day_of_week: parseInt(e.target.value)})}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
              <Input
                placeholder="学期（如 2026-1）"
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
              />
              <div className="col-span-2">
                <label className="block text-sm text-gray-500 mb-2">颜色</label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({...formData, color})}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditCourse(null); resetForm(); }}>
                取消
              </Button>
              <Button onClick={editCourse ? handleSaveEdit : handleCreate}>
                {editCourse ? '保存' : '添加'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 课程表网格 */}
      {courses.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="暂无课程"
          description="点击上方按钮添加你的第一门课程"
        />
      ) : (
        <>
        <div className="overflow-x-auto relative">
          <div className="grid grid-cols-8 gap-px bg-gray-200 min-w-[800px]">
            {/* 表头 */}
            <div className="bg-gray-100 p-3 font-bold text-sm">时间</div>
            {DAYS.map((day, index) => (
              <div
                key={day}
                id={`day-${index + 1}`}
                className={`p-3 font-bold text-sm text-center ${isToday(index + 1) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                {day}
                {isToday(index + 1) && (
                  <span className="block text-xs font-normal mt-1">今天</span>
                )}
              </div>
            ))}

            {/* 时间网格 */}
            {HOURS.map(hour => (
              <Fragment key={hour}>
                <div className={`bg-white p-2 text-sm border-b ${isCurrentTimeSlot(0, hour) ? 'bg-blue-50 font-bold text-blue-600' : 'text-gray-500'}`}>
                  {hour}:00
                </div>
                {DAYS.map((_, dayIndex) => {
                  const coursesAt = getCoursesAt(dayIndex + 1, hour)
                  const isCurrent = isCurrentTimeSlot(dayIndex + 1, hour)
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`bg-white p-1 min-h-[60px] border-b border-r ${isCurrent ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}`}
                    >
                      {coursesAt.map(course => (
                        <div
                          key={course.id}
                          className="text-xs p-2 rounded text-white mb-1 relative group cursor-pointer"
                          style={{ backgroundColor: course.color }}
                          onClick={() => handleEdit(course)}
                        >
                          <p className="font-bold truncate">{course.name}</p>
                          {course.location && (
                            <p className="truncate opacity-80">{course.location}</p>
                          )}
                          <button
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-white hover:text-red-200"
                            aria-label="删除课程"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(course.id)
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
        {/* 横滑提示 - 仅小屏显示 */}
        <div className="sm:hidden flex items-center justify-center py-2 text-xs text-gray-400">
          <span>← 左右滑动查看完整课表 →</span>
        </div>
        </>
      )}

      {/* 删除确认对话框 */}
      {deleteId && (
        <ConfirmDialog
          title="删除课程"
          message="确定要删除这门课程吗？此操作不可撤销。"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
