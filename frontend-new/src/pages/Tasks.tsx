import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Circle, Clock, Edit2, X, Check, CheckSquare, ChevronDown, ChevronUp, Eraser, Calendar, ArrowUpDown, GripVertical, Search } from 'lucide-react'
import { taskApi, type Task } from '../lib/api'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { EmptyState, GlassCard, Badge } from '../components/ui'
import { ListSkeleton } from '../components/ui/LoadingStates'
import { usePageTitle } from '../hooks/usePageTitle'
import ConfirmDialog from '../components/ConfirmDialog'

const priorityConfig = {
  low: { color: 'bg-accent-success/15 text-accent-success', label: '低' },
  medium: { color: 'bg-accent-amber/15 text-accent-amber', label: '中' },
  high: { color: 'bg-accent-danger/15 text-accent-danger', label: '高' },
}

const statusConfig = {
  pending: { icon: Circle, color: 'text-text-muted' },
  in_progress: { icon: Clock, color: 'text-accent-blue' },
  done: { icon: CheckCircle, color: 'text-accent-success' },
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  usePageTitle('任务管理')
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    taskApi.getAll().then(setTasks).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = tasks
    .filter((t) => {
      if (filter === 'pending') return t.status !== 'done'
      if (filter === 'done') return t.status === 'done'
      return true
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      // Then by due date (overdue first, then by date)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      if (a.due_date) return -1
      if (b.due_date) return 1
      // Finally by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status !== 'done').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    try {
      const task = await taskApi.create({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: 'pending',
        priority: newPriority,
        due_date: newDueDate || undefined,
      })
      setTasks((prev) => [task, ...prev])
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setShowDescription(false)
      toast('任务已添加', 'success')
    } catch {
      toast('添加失败', 'error')
    }
  }

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      const updated = await taskApi.update(task.id, { status: newStatus })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      if (newStatus === 'done') toast('任务完成！', 'success')
    } catch {
      toast('更新失败', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await taskApi.delete(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast('任务已删除', 'success')
    } catch {
      toast('删除失败', 'error')
    }
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditPriority(task.priority)
    setEditDueDate(task.due_date || '')
  }

  const saveEdit = async (id: number) => {
    if (!editTitle.trim()) return
    try {
      const updated = await taskApi.update(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        priority: editPriority,
        due_date: editDueDate || undefined,
      })
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      setEditingId(null)
    } catch {
      toast('更新失败', 'error')
    }
  }

  const handleDragStart = (id: number) => {
    setDragId(id)
  }

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault()
    if (dragId === null || dragId === id) return
    setDragOverId(id)
  }

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) {
      setDragId(null)
      setDragOverId(null)
      return
    }
    setTasks((prev) => {
      const newTasks = [...prev]
      const dragIndex = newTasks.findIndex((t) => t.id === dragId)
      const targetIndex = newTasks.findIndex((t) => t.id === targetId)
      if (dragIndex === -1 || targetIndex === -1) return prev
      const [removed] = newTasks.splice(dragIndex, 1)
      newTasks.splice(targetIndex, 0, removed)
      return newTasks
    })
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">任务管理</h1>

      {/* Add Task */}
      <GlassCard padding="md" rounded="rounded-2xl" className="mb-6">
        <div className="flex gap-4 items-center">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="添加新任务..."
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/30 transition-all"
          />
          {/* Priority selector */}
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className={cn(
                  'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  newPriority === p
                    ? priorityConfig[p].color
                    : 'text-text-muted glass hover:bg-white/[0.05]'
                )}
              >
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="glass p-2.5 rounded-xl text-text-muted hover:text-text-primary transition-all"
            title="添加描述"
          >
            {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              newTitle.trim()
                ? 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30'
                : 'glass text-text-muted cursor-not-allowed'
            )}
          >
            <Plus size={18} />
          </button>
        </div>
        {showDescription && (
          <>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="任务描述（可选）..."
              className="w-full bg-transparent border-none text-sm text-text-secondary placeholder-text-muted focus:outline-none mt-3 pt-3 border-t border-border"
            />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Calendar size={13} className="text-text-muted" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-transparent border-none text-xs text-text-secondary focus:outline-none"
              />
              {newDueDate && (
                <button
                  onClick={() => setNewDueDate('')}
                  className="text-text-muted hover:text-text-primary text-xs"
                >
                  清除
                </button>
              )}
            </div>
          </>
        )}
      </GlassCard>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {(['all', 'pending', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'glass px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f
                ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.05]'
            )}
          >
            {f === 'all' ? '全部' : f === 'pending' ? '待办' : '已完成'}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 focus-within:ring-2 focus:ring-accent-blue/30 transition-all">
            <Search size={13} className="text-text-muted shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="w-32 bg-transparent text-sm focus:outline-none text-text-primary placeholder-text-muted"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <ArrowUpDown size={12} />
            <span>按优先级排序</span>
          </div>
        </div>
        {counts.done > 0 && (
          <button
            onClick={async () => {
              const doneTasks = tasks.filter((t) => t.status === 'done')
              await Promise.all(doneTasks.map((t) => taskApi.delete(t.id).catch(() => {})))
              setTasks((prev) => prev.filter((t) => t.status !== 'done'))
              toast(`已清除 ${doneTasks.length} 个已完成任务`, 'success')
            }}
            className="glass px-3 py-1.5 rounded-xl text-xs text-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
            title="清除所有已完成任务"
          >
            <Eraser size={13} />
            清除已完成
          </button>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={40} />}
          title={filter === 'done' ? '还没有完成的任务' : filter === 'pending' ? '所有任务都完成了！' : '还没有任务'}
          description={filter === 'all' ? '添加你的第一个任务开始吧' : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => {
            const StatusIcon = statusConfig[task.status].icon
            const isEditing = editingId === task.id
            return (
              <GlassCard
                key={task.id}
                rounded="rounded-2xl"
                padding="md"
                draggable={!isEditing}
                onDragStart={() => handleDragStart(task.id)}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDrop={() => handleDrop(task.id)}
                onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                className={cn(
                  'flex items-center gap-3 group transition-all stagger-item',
                  dragId === task.id && 'opacity-40 scale-[0.98]',
                  dragOverId === task.id && dragId !== task.id && 'ring-2 ring-accent-blue/30'
                )}
              >
                {/* Drag Handle */}
                {!isEditing && (
                  <div className="shrink-0 cursor-grab active:cursor-grabbing text-text-muted/30 group-hover:text-text-muted transition-colors">
                    <GripVertical size={14} />
                  </div>
                )}
                <button
                  onClick={() => handleToggle(task)}
                  className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded"
                >
                  <StatusIcon
                    size={22}
                    className={cn(
                      'transition-all',
                      task.status === 'done' ? 'text-accent-success' : 'text-text-muted hover:text-accent-blue'
                    )}
                  />
                </button>

                {isEditing ? (
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) saveEdit(task.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        className="flex-1 glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
                      />
                      <button onClick={() => saveEdit(task.id)} className="text-accent-success hover:text-accent-success/80">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-text-muted hover:text-text-primary">
                        <X size={16} />
                      </button>
                    </div>
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) saveEdit(task.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      placeholder="描述（可选）"
                      className="w-full glass rounded-xl px-3 py-2 text-xs text-text-secondary placeholder-text-muted focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setEditPriority(p)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                              editPriority === p
                                ? priorityConfig[p].color
                                : 'text-text-muted glass hover:bg-white/[0.05]'
                            )}
                          >
                            {priorityConfig[p].label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-text-muted" />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="bg-transparent border-none text-xs text-text-secondary focus:outline-none"
                        />
                        {editDueDate && (
                          <button onClick={() => setEditDueDate('')} className="text-text-muted hover:text-text-primary text-xs">清除</button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-base block font-medium',
                        task.status === 'done' && 'line-through text-text-muted'
                      )}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-sm block mt-1 truncate text-text-secondary">
                        {task.description}
                      </span>
                    )}
                    {task.due_date && task.status !== 'done' && (
                      <span className={cn(
                        'text-xs block mt-1.5',
                        new Date(task.due_date) < new Date() ? 'text-accent-danger' : 'text-text-muted'
                      )}>
                        {new Date(task.due_date) < new Date() ? '已过期' : '截止'} {task.due_date}
                      </span>
                    )}
                  </div>
                )}

                {/* Priority badge */}
                {!isEditing && (
                  <div className="relative">
                    <Badge variant={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'green'} className="rounded-lg">
                      {priorityConfig[task.priority].label}
                    </Badge>
                  </div>
                )}

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(task)}
                      className="glass p-2 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(task.id)}
                      className="glass p-2 rounded-lg text-text-muted hover:text-accent-danger hover:bg-accent-danger/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      )}
      <ConfirmDialog
        open={deleteId !== null}
        title="删除任务"
        message="确定要删除这个任务吗？此操作不可撤销。"
        variant="danger"
        confirmLabel="删除"
        onConfirm={() => { if (deleteId) handleDelete(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
