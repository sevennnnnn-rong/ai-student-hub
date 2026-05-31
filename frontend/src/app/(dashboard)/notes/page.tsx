'use client'

import { useState, useEffect, useRef } from 'react'
import { noteApi, taskApi } from '@/lib/api'
import { useToast } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, FileText, Trash2, Edit2, Search, Bold, Italic, Heading1, List, Link2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { ToastContainer } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading'
import ReactMarkdown from 'react-markdown'

interface Note {
  id: number
  title: string
  content: string | null
  task_id: number | null
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [sortBy, setSortBy] = useState<'updated' | 'created'>('updated')
  const [linkedTaskId, setLinkedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<{ id: number; title: string }[]>([])
  const NOTES_DRAFT_KEY = 'notes_draft'

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newText = content.substring(0, start) + before + selected + after + content.substring(end)
    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    const draft = localStorage.getItem(NOTES_DRAFT_KEY)
    if (draft) {
      try {
        const d = JSON.parse(draft)
        if (d.title || d.content) {
          setTitle(d.title || '')
          setContent(d.content || '')
          setShowForm(true)
        }
      } catch {}
    }
    loadNotes()
    taskApi.getAll().then(data => setTasks(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (showForm && (title || content)) {
      localStorage.setItem(NOTES_DRAFT_KEY, JSON.stringify({ title, content }))
    }
  }, [title, content, showForm])

  const loadNotes = async () => {
    try {
      const data = await noteApi.getAll()
      setNotes(data)
    } catch (error) {
      toast.error('加载笔记失败')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setEditNote(null)
    setLinkedTaskId(null)
    localStorage.removeItem(NOTES_DRAFT_KEY)
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    try {
      const note = await noteApi.create({ title, content, task_id: linkedTaskId })
      setNotes([note, ...notes])
      resetForm()
      setShowForm(false)
      toast.success('笔记创建成功')
    } catch (error) {
      toast.error('创建笔记失败')
    }
  }

  const handleEdit = (note: Note) => {
    setEditNote(note)
    setTitle(note.title)
    setContent(note.content || '')
    setLinkedTaskId(note.task_id)
    setShowForm(true)
  }

  const handleSaveEdit = async () => {
    if (!editNote || !title.trim()) return

    try {
      const updated = await noteApi.update(editNote.id, { title, content, task_id: linkedTaskId })
      setNotes(notes.map(n => n.id === editNote.id ? updated : n))
      resetForm()
      setShowForm(false)
      toast.success('笔记更新成功')
    } catch (error) {
      toast.error('更新笔记失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await noteApi.delete(deleteId)
      setNotes(notes.filter(n => n.id !== deleteId))
      toast.success('笔记删除成功')
    } catch (error) {
      toast.error('删除笔记失败')
    } finally {
      setDeleteId(null)
    }
  }

  const filteredNotes = notes
    .filter(note =>
      note.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchKeyword.toLowerCase()))
    )
    .sort((a, b) => {
      const dateA = sortBy === 'updated' ? a.updated_at : a.created_at
      const dateB = sortBy === 'updated' ? b.updated_at : b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">笔记</h1>
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
        <h1 className="text-2xl font-bold">笔记</h1>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          <Plus className="mr-2" size={16} />
          {showForm ? '取消' : '新建笔记'}
        </Button>
      </div>

      {/* 搜索框 + 排序 */}
      {!showForm && (
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="搜索笔记..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'updated' ? 'created' : 'updated')}
          >
            {sortBy === 'updated' ? '最近编辑' : '创建时间'}
          </Button>
        </div>
      )}

      {/* 创建/编辑表单 */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editNote ? '编辑笔记' : '新建笔记'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="笔记标题 *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4"
            />
            <select
              className="w-full border rounded-md px-3 py-2 text-sm mb-4"
              value={linkedTaskId || ''}
              onChange={(e) => setLinkedTaskId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">关联任务（可选）</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 mb-2">
              <Button
                type="button"
                variant={previewMode ? 'outline' : 'default'}
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                编辑
              </Button>
              <Button
                type="button"
                variant={previewMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode(true)}
              >
                预览
              </Button>
            </div>
            {previewMode ? (
              <div className="w-full min-h-[10rem] border rounded-md p-3 overflow-auto prose prose-sm max-w-none resize-y">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400">暂无内容</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 p-1 bg-gray-50 rounded-md border">
                  <Button type="button" variant="ghost" size="default" onClick={() => insertMarkdown('**', '**')} title="加粗">
                    <Bold size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="default" onClick={() => insertMarkdown('*', '*')} title="斜体">
                    <Italic size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="default" onClick={() => insertMarkdown('## ')} title="标题">
                    <Heading1 size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="default" onClick={() => insertMarkdown('- ')} title="列表">
                    <List size={18} />
                  </Button>
                  <Button type="button" variant="ghost" size="default" onClick={() => insertMarkdown('[', '](url)')} title="链接">
                    <Link2 size={18} />
                  </Button>
                </div>
                <textarea
                  ref={textareaRef}
                  className="w-full min-h-[10rem] border rounded-md p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="支持 Markdown 格式... (Ctrl+B/I/K)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      if (e.key === 'b') { e.preventDefault(); insertMarkdown('**', '**') }
                      else if (e.key === 'i') { e.preventDefault(); insertMarkdown('*', '*') }
                      else if (e.key === 'k') { e.preventDefault(); insertMarkdown('[', '](url)') }
                    }
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{content.length} 字符</span>
                  <span>{content.split(/\s+/).filter(Boolean).length} 词</span>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                取消
              </Button>
              <Button onClick={editNote ? handleSaveEdit : handleCreate}>
                {editNote ? '保存' : '创建'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 笔记列表 */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchKeyword ? '未找到匹配的笔记' : '暂无笔记'}
          description={searchKeyword ? '尝试其他关键词' : '点击上方按钮创建你的第一篇笔记'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(note)} aria-label="编辑笔记">
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(note.id)} aria-label="删除笔记">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 line-clamp-4 prose prose-sm max-w-none">
                  {note.content ? (
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  ) : (
                    <p>无内容</p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleDateString('zh-CN')}
                  </p>
                  {note.updated_at !== note.created_at && (
                    <p className="text-xs text-gray-400">
                      已编辑
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteId && (
        <ConfirmDialog
          title="删除笔记"
          message="确定要删除这篇笔记吗？此操作不可撤销。"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
