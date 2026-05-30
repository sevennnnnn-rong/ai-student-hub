'use client'

import { useState, useEffect } from 'react'
import { taskApi, Task } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import { Plus, CheckCircle, Circle, Trash2, Pencil, Inbox } from 'lucide-react'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editPriority, setEditPriority] = useState(0)
  const [editStatus, setEditStatus] = useState<'pending' | 'done'>('pending')
  const { toast } = useToast()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await taskApi.getAll()
      setTasks(data)
    } catch (error) {
      toast('加载任务失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    try {
      const task = await taskApi.create({ title: newTitle })
      setTasks([task, ...tasks])
      setNewTitle('')
      toast('任务创建成功')
    } catch (error) {
      toast('创建任务失败', 'error')
    }
  }

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      const updated = await taskApi.update(task.id, { status: newStatus })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
    } catch (error) {
      toast('更新任务失败', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await taskApi.delete(deleteId)
      setTasks(tasks.filter(t => t.id !== deleteId))
      toast('任务已删除')
    } catch (error) {
      toast('删除任务失败', 'error')
    }
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setEditPriority(task.priority)
    setEditStatus(task.status as 'pending' | 'done')
  }

  const handleEdit = async () => {
    if (!editTask || !editTitle.trim()) return
    try {
      const updated = await taskApi.update(editTask.id, {
        title: editTitle,
        description: editDescription || null,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        priority: editPriority,
        status: editStatus,
      })
      setTasks(tasks.map(t => t.id === editTask.id ? updated : t))
      setEditTask(null)
      toast('任务已更新')
    } catch (error) {
      toast('更新任务失败', 'error')
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 dark:text-white">任务管理</h1>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">任务管理</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="输入任务标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="dark:border-gray-600 dark:text-white"
            />
            <Button onClick={handleCreate}>
              <Plus className="mr-2" size={16} />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {tasks.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          <Inbox size={48} className="mx-auto mb-4" />
          <p>暂无任务</p>
          <p className="text-sm">点击上方按钮创建第一个任务</p>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <Card key={task.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleStatus(task)} aria-label={task.status === 'done' ? '标记为未完成' : '标记为完成'}>
                  {task.status === 'done' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <Circle className="text-gray-400" size={20} />
                  )}
                </button>
                <div>
                  <p className={`font-medium dark:text-white ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      截止: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(task)} aria-label="编辑任务">
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(task.id)} aria-label="删除任务">
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="确认删除"
        description="确定要删除这个任务吗？此操作不可撤销。"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={editTask !== null}
        onOpenChange={(open) => { if (!open) setEditTask(null) }}
        title="编辑任务"
        description=""
        onConfirm={handleEdit}
        confirmLabel="保存"
        confirmVariant="default"
      >
        <div className="space-y-4 py-2">
          <Input
            placeholder="任务标题"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Input
            placeholder="任务描述（可选）"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium dark:text-gray-300 mb-1 block">截止日期</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full border rounded p-2 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300 mb-1 block">优先级</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(parseInt(e.target.value))}
                className="w-full border rounded p-2 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>低</option>
                <option value={1}>中</option>
                <option value={2}>高</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300 mb-1 block">状态</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'pending' | 'done')}
                className="w-full border rounded p-2 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="pending">待完成</option>
                <option value="done">已完成</option>
              </select>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
