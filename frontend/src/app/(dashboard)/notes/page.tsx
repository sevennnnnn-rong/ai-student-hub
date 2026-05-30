'use client'

import { useState, useEffect } from 'react'
import { noteApi, Note } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import TipTapEditor from '@/components/TipTapEditor'
import { Plus, Trash2 } from 'lucide-react'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await noteApi.getAll()
      setNotes(data)
    } catch (error) {
      toast('加载笔记失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleNew = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEdit = async (note: Note) => {
    try {
      const fresh = await noteApi.get(note.id)
      setTitle(fresh.title)
      setContent(fresh.content ?? '')
      setEditingId(fresh.id)
      setShowForm(true)
    } catch (error) {
      toast('加载笔记失败', 'error')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)

    try {
      if (editingId) {
        const updated = await noteApi.update(editingId, { title, content })
        setNotes(notes.map(n => (n.id === editingId ? updated : n)))
        toast('笔记已更新')
      } else {
        const created = await noteApi.create({ title, content })
        setNotes([created, ...notes])
        toast('笔记创建成功')
      }
      resetForm()
    } catch (error) {
      toast(editingId ? '更新笔记失败' : '创建笔记失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await noteApi.delete(deleteId)
      setNotes(notes.filter(n => n.id !== deleteId))
      toast('笔记已删除')
      if (editingId === deleteId) resetForm()
    } catch (error) {
      toast('删除笔记失败', 'error')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">笔记</h1>
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">笔记</h1>
        <Button onClick={handleNew}>
          <Plus className="mr-2" size={16} />
          新建笔记
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="笔记标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="开始写作..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? '保存中...' : editingId ? '更新' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !showForm && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          <p className="text-lg mb-2">暂无笔记</p>
          <p className="text-sm">点击上方按钮创建第一篇笔记</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <Card
            key={note.id}
            className="cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
            onClick={() => handleEdit(note)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg dark:text-white">{note.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(note.id)
                  }}
                  aria-label="删除笔记"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                {note.content ? stripHtml(note.content) || '无内容' : '无内容'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="确认删除"
        description="确定要删除这条笔记吗？此操作不可撤销。"
        onConfirm={handleDelete}
      />
    </div>
  )
}
