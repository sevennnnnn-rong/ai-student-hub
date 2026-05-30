'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { scheduleApi, Course, CourseCreate } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import { Plus, Trash2, Upload, FileCheck, X, Pencil } from 'lucide-react'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)

function useCourseMap(courses: Course[]) {
  return useMemo(() => {
    const map = new Map<string, Course[]>()
    courses.forEach(course => {
      const startHour = parseInt(course.start_time.split(':')[0])
      const endHour = parseInt(course.end_time.split(':')[0])
      for (let hour = startHour; hour < endHour; hour++) {
        const key = `${course.day_of_week}-${hour}`
        const existing = map.get(key) || []
        existing.push(course)
        map.set(key, existing)
      }
    })
    return map
  }, [courses])
}

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<CourseCreate[]>([])
  const [importing, setImporting] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: '',
    teacher: '',
    location: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:40',
    color: '#3b82f6'
  })
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [editCourseName, setEditCourseName] = useState('')
  const [editCourseTeacher, setEditCourseTeacher] = useState('')
  const [editCourseLocation, setEditCourseLocation] = useState('')
  const [editCourseDay, setEditCourseDay] = useState(1)
  const [editCourseStartTime, setEditCourseStartTime] = useState('08:00')
  const [editCourseEndTime, setEditCourseEndTime] = useState('09:40')
  const [editCourseColor, setEditCourseColor] = useState('#3b82f6')
  const { toast } = useToast()
  const courseMap = useCourseMap(courses)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCourses = useCallback(async () => {
    try {
      const data = await scheduleApi.getAll()
      setCourses(data)
    } catch {
      toast('加载课程失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const handleCreate = async () => {
    if (!newCourse.name.trim()) return
    try {
      const course = await scheduleApi.create(newCourse)
      setCourses(prev => [...prev, course])
      setShowForm(false)
      setNewCourse({
        name: '',
        teacher: '',
        location: '',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:40',
        color: '#3b82f6'
      })
      toast('课程添加成功')
    } catch {
      toast('创建课程失败', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await scheduleApi.delete(deleteId)
      setCourses(prev => prev.filter(c => c.id !== deleteId))
      toast('课程已删除')
    } catch {
      toast('删除课程失败', 'error')
    }
  }

  const openEdit = (course: Course) => {
    setEditCourse(course)
    setEditCourseName(course.name)
    setEditCourseTeacher(course.teacher || '')
    setEditCourseLocation(course.location || '')
    setEditCourseDay(course.day_of_week)
    setEditCourseStartTime(course.start_time)
    setEditCourseEndTime(course.end_time)
    setEditCourseColor(course.color)
  }

  const handleEdit = async () => {
    if (!editCourse || !editCourseName.trim()) return
    try {
      const updated = await scheduleApi.update(editCourse.id, {
        name: editCourseName,
        teacher: editCourseTeacher || undefined,
        location: editCourseLocation || undefined,
        day_of_week: editCourseDay,
        start_time: editCourseStartTime,
        end_time: editCourseEndTime,
        color: editCourseColor,
      })
      setCourses(courses.map(c => c.id === editCourse.id ? updated : c))
      setEditCourse(null)
      toast('课程已更新')
    } catch {
      toast('更新课程失败', 'error')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.ics')) {
      toast('请选择 ICS 格式的文件', 'error')
      return
    }

    try {
      const content = await file.text()
      const result = await scheduleApi.importPreview(content)
      setImportPreview(result.courses)
      setShowImport(true)
      toast(`解析到 ${result.count} 门课程`, 'success')
    } catch (err) {
      toast('解析 ICS 文件失败', 'error')
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) return

    setImporting(true)
    try {
      const result = await scheduleApi.importConfirm(importPreview)
      setCourses(prev => [...prev, ...result.imported])
      setShowImport(false)
      setImportPreview([])
      toast(`成功导入 ${result.count} 门课程`)
    } catch {
      toast('导入课程失败', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleImportCancel = () => {
    setShowImport(false)
    setImportPreview([])
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">课程表</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">课程表</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".ics"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2" size={16} />
            导入 ICS
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2" size={16} />
            添加课程
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="课程名称"
                value={newCourse.name}
                onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Input
                placeholder="教师"
                value={newCourse.teacher}
                onChange={(e) => setNewCourse({...newCourse, teacher: e.target.value})}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Input
                placeholder="地点"
                value={newCourse.location}
                onChange={(e) => setNewCourse({...newCourse, location: e.target.value})}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newCourse.day_of_week}
                onChange={(e) => setNewCourse({...newCourse, day_of_week: parseInt(e.target.value)})}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleCreate}>保存</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 导入预览 */}
      {showImport && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="dark:text-white">
                <FileCheck className="inline mr-2" size={20} />
                导入预览 ({importPreview.length} 门课程)
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleImportCancel}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {importPreview.map((course, index) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: course.color }}
                  />
                  <div className="flex-1">
                    <span className="font-medium dark:text-white">{course.name}</span>
                    {course.teacher && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {course.teacher}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {DAYS[course.day_of_week - 1]} {course.start_time}-{course.end_time}
                  </div>
                  {course.location && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleImportCancel}>
                取消
              </Button>
              <Button onClick={handleImportConfirm} disabled={importing}>
                {importing ? '导入中...' : '确认导入'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 && !showForm && !showImport && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          <p className="text-lg mb-2">暂无课程</p>
          <p className="text-sm">点击"导入 ICS"添加课程，或手动创建</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-[800px]">
          <div className="p-2 font-bold dark:text-white">时间</div>
          {DAYS.map(day => (
            <div key={day} className="p-2 font-bold text-center dark:text-white">{day}</div>
          ))}

          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                {hour}:00
              </div>
              {DAYS.map((_, dayIndex) => {
                const key = `${dayIndex + 1}-${hour}`
                const coursesAt = courseMap.get(key) || []
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="border dark:border-gray-700 rounded p-1 min-h-[60px] relative group"
                  >
                    {coursesAt.map(course => (
                      <div
                        key={course.id}
                        className="text-xs p-1 rounded text-white mb-1 relative"
                        style={{ backgroundColor: course.color }}
                      >
                        <p className="font-bold">{course.name}</p>
                        <p>{course.location}</p>
                        <button
                          className="absolute top-0 left-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); openEdit(course) }}
                          aria-label={`编辑课程 ${course.name}`}
                        >
                          <Pencil size={10} />
                        </button>
                        <button
                          className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(course.id) }}
                          aria-label={`删除课程 ${course.name}`}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="确认删除"
        description="确定要删除这门课程吗？此操作不可撤销。"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={editCourse !== null}
        onOpenChange={(open) => { if (!open) setEditCourse(null) }}
        title="编辑课程"
        description=""
        onConfirm={handleEdit}
        confirmLabel="保存"
        confirmVariant="default"
      >
        <div className="space-y-4 py-2">
          <Input
            placeholder="课程名称"
            value={editCourseName}
            onChange={(e) => setEditCourseName(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Input
            placeholder="教师"
            value={editCourseTeacher}
            onChange={(e) => setEditCourseTeacher(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Input
            placeholder="地点"
            value={editCourseLocation}
            onChange={(e) => setEditCourseLocation(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300 mb-1 block">星期</label>
              <select
                value={editCourseDay}
                onChange={(e) => setEditCourseDay(parseInt(e.target.value))}
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300 mb-1 block">颜色</label>
              <input
                type="color"
                value={editCourseColor}
                onChange={(e) => setEditCourseColor(e.target.value)}
                className="w-full h-10 border rounded p-1 dark:bg-gray-700 dark:border-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300 mb-1 block">开始时间</label>
              <input
                type="time"
                value={editCourseStartTime}
                onChange={(e) => setEditCourseStartTime(e.target.value)}
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300 mb-1 block">结束时间</label>
              <input
                type="time"
                value={editCourseEndTime}
                onChange={(e) => setEditCourseEndTime(e.target.value)}
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
