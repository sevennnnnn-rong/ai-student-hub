'use client'

import { useState, useEffect } from 'react'
import { taskApi } from '@/lib/api'
import { useToast } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, CheckCircle, Circle, Trash2, Edit2, Calendar, Tag, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { TaskCardSkeleton } from '@/components/loading'
import { ToastContainer } from '@/components/toast'

interface Task {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: number
  status: string
  category: string | null
  created_at: string
}

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
  const [editCategory, setEditCategory] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'due_date'>('created')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDelete, setBatchDelete] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    if (!editTask) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditTask(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editTask])

  const loadTasks = async () => {
    try {
      const data = await taskApi.getAll()
      setTasks(data)
    } catch (error) {
      toast.error('加载任务失败')
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
      toast.success('任务创建成功')
    } catch (error) {
      toast.error('创建任务失败')
    }
  }

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      const updated = await taskApi.update(task.id, { status: newStatus })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
      toast.success(newStatus === 'done' ? '任务已完成' : '任务已恢复')
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await taskApi.delete(deleteId)
      setTasks(tasks.filter(t => t.id !== deleteId))
      toast.success('任务删除成功')
    } catch (error) {
      toast.error('删除任务失败')
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (task: Task) => {
    setEditTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditDueDate(task.due_date || '')
    setEditPriority(task.priority)
    setEditCategory(task.category || '')
  }

  const handleSaveEdit = async () => {
    if (!editTask || !editTitle.trim()) return

    try {
      const updated = await taskApi.update(editTask.id, {
        title: editTitle,
        description: editDescription || null,
        due_date: editDueDate || null,
        priority: editPriority,
        category: editCategory || null,
      })
      setTasks(tasks.map(t => t.id === editTask.id ? updated : t))
      setEditTask(null)
      toast.success('任务更新成功')
    } catch (error) {
      toast.error('更新任务失败')
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTasks.map(t => t.id)))
    }
  }

  const handleBatchComplete = async () => {
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map(id => taskApi.update(id, { status: 'done' })))
      setTasks(tasks.map(t => ids.includes(t.id) ? { ...t, status: 'done' } : t))
      setSelectedIds(new Set())
      toast.success(`已标记 ${ids.length} 个任务为完成`)
    } catch {
      toast.error('批量操作失败')
    }
  }

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map(id => taskApi.delete(id)))
      setTasks(tasks.filter(t => !ids.includes(t.id)))
      setSelectedIds(new Set())
      toast.success(`已删除 ${ids.length} 个任务`)
    } catch {
      toast.error('批量删除失败')
    } finally {
      setBatchDelete(false)
    }
  }

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'all') return true
      return task.status === filter
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        if (a.priority !== b.priority) return b.priority - a.priority
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

  const priorityColors = ['bg-gray-100', 'bg-yellow-100', 'bg-red-100']
  const priorityLabels = ['普通', '重要', '紧急']

  const isOverdue = (task: Task) => {
    if (task.status === 'done' || !task.due_date) return false
    return new Date(task.due_date) < new Date(new Date().toDateString())
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">任务管理</h1>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <h1 className="text-2xl font-bold mb-6">任务管理</h1>

      {/* 逾期提醒 */}
      {tasks.filter(t => isOverdue(t)).length > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle size={16} />
          你有 {tasks.filter(t => isOverdue(t)).length} 个任务已逾期
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">已选 {selectedIds.size} 项</span>
          <Button size="sm" onClick={handleBatchComplete}>批量完成</Button>
          <Button size="sm" variant="destructive" onClick={() => setBatchDelete(true)}>批量删除</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
        </div>
      )}

      {/* 创建任务 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="输入任务标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate}>
              <Plus className="mr-2" size={16} />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 筛选器 */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'done'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'pending' ? '待完成' : '已完成'}
            <span className="ml-1 text-xs opacity-70">
              ({f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length})
            </span>
          </Button>
        ))}
      </div>

      {/* 排序 + 全选 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={filteredTasks.length > 0 && selectedIds.size === filteredTasks.length}
          onChange={selectAll}
          className="rounded"
        />
        <ArrowUpDown size={14} className="text-gray-400" />
        <span className="text-sm text-gray-500">排序：</span>
        {([['created', '创建时间'], ['priority', '优先级'], ['due_date', '截止日期']] as const).map(([key, label]) => (
          <Button
            key={key}
            variant={sortBy === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 任务列表 */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title={filter === 'all' ? '暂无任务' : filter === 'pending' ? '所有任务已完成' : '暂无已完成任务'}
          description={filter === 'all' ? '点击上方输入框创建第一个任务' : '继续努力！'}
        />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <Card key={task.id} className={`${task.status === 'done' ? 'opacity-60' : ''} ${isOverdue(task) ? 'border-red-300 bg-red-50' : ''}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    className="rounded"
                  />
                  <button onClick={() => toggleStatus(task)} aria-label={task.status === 'done' ? '标记为未完成' : '标记为完成'}>
                    {task.status === 'done' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <Circle className="text-gray-400 hover:text-gray-600" size={20} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {task.due_date && (
                        <span className={`text-xs flex items-center gap-1 ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          <Calendar size={12} />
                          {new Date(task.due_date).toLocaleDateString('zh-CN')}
                          {isOverdue(task) && ' (已逾期)'}
                        </span>
                      )}
                      {task.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded flex items-center gap-1">
                          <Tag size={12} />
                          {task.category}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(task)} aria-label="编辑任务">
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(task.id)} aria-label="删除任务">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteId && (
        <ConfirmDialog
          title="删除任务"
          message="确定要删除这个任务吗？此操作不可撤销。"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* 批量删除确认 */}
      {batchDelete && (
        <ConfirmDialog
          title="批量删除"
          message={`确定要删除选中的 ${selectedIds.size} 个任务吗？此操作不可撤销。`}
          onConfirm={handleBatchDelete}
          onCancel={() => setBatchDelete(false)}
        />
      )}

      {/* 编辑对话框 */}
      {editTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="编辑任务">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">编辑任务</h3>
              <div className="space-y-4">
                <Input
                  placeholder="任务标题"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <Input
                  placeholder="描述（可选）"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editPriority}
                  onChange={(e) => setEditPriority(parseInt(e.target.value))}
                >
                  <option value={0}>普通</option>
                  <option value={1}>重要</option>
                  <option value={2}>紧急</option>
                </select>
                <Input
                  placeholder="分类（可选）"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditTask(null)}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
