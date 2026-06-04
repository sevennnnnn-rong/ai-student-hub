import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Search, Eye, Edit3, FileText, Download, Bold, Italic, Code, List, Link, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { noteApi, type Note } from '../lib/api'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { EmptyState } from '../components/ui'
import { ListSkeleton } from '../components/ui/LoadingStates'
import { usePageTitle } from '../hooks/usePageTitle'
import ConfirmDialog from '../components/ConfirmDialog'

const folders = ['全部', '学习', '工作', '生活', '其他']

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className="bg-accent-amber/30 text-accent-amber rounded px-0.5">{part}</mark>
      : part
  )
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [keyword, setKeyword] = useState('')
  const [activeId, setActiveId] = useState<number | null>(null)
  usePageTitle('笔记')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState('全部')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editTitleRef = useRef('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setKeyword(searchKeyword)
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [searchKeyword])

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [])

  useEffect(() => {
    noteApi.getAll(keyword).then(setNotes).catch(() => {}).finally(() => setLoading(false))
  }, [keyword])

  // Filter notes by folder (local filter based on content tags)
  const filteredNotes = activeFolder === '全部'
    ? notes
    : notes.filter((n) => n.content.includes(`#${activeFolder}`) || n.title.includes(activeFolder))

  const activeNote = notes.find((n) => n.id === activeId)

  const handleCreate = async () => {
    try {
      const note = await noteApi.create({ title: '新笔记', content: '' })
      setNotes((prev) => [note, ...prev])
      setActiveId(note.id)
      setEditTitle(note.title)
      editTitleRef.current = note.title
      setEditContent('')
      setPreview(false)
      toast('笔记已创建', 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      toast(`创建失败: ${msg}`, 'error')
    }
  }

  const handleSave = async () => {
    if (!activeId) return
    // Cancel any pending auto-save to avoid race condition
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaving(true)
    try {
      const updated = await noteApi.update(activeId, { title: editTitleRef.current, content: editContent })
      setNotes((prev) => prev.map((n) => (n.id === activeId ? updated : n)))
    } catch {
      toast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await noteApi.delete(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
      if (activeId === id) {
        setActiveId(null)
        setEditTitle('')
        setEditContent('')
      }
      toast('笔记已删除', 'success')
    } catch {
      toast('删除失败', 'error')
    }
  }

  const selectNote = (note: Note) => {
    // Cancel any pending auto-save to avoid writing stale data
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setActiveId(note.id)
    setEditTitle(note.title)
    editTitleRef.current = note.title
    setEditContent(note.content)
  }

  const handleContentChange = (value: string) => {
    setEditContent(value)
    // Auto-save after 1.5 seconds of inactivity
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (activeId) {
        noteApi.update(activeId, { title: editTitleRef.current, content: value })
          .then((updated) => {
            setNotes((prev) => prev.map((n) => (n.id === activeId ? updated : n)))
          })
          .catch(() => toast('自动保存失败', 'error'))
      }
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (ta) {
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const newValue = editContent.substring(0, start) + '  ' + editContent.substring(end)
        setEditContent(newValue)
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + 2
        }, 0)
      }
    }
  }

  return (
    <div className="h-full flex gap-4 animate-fade-in">
      {/* Note List */}
      <div className={cn(
        'shrink-0 glass rounded-2xl flex flex-col overflow-hidden transition-all duration-300',
        activeNote ? 'hidden md:flex md:w-64' : 'w-full md:w-64'
      )}>
        <div className="p-3 border-b border-border">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/[0.04] rounded-lg px-2 border border-border focus-within:border-accent/30 transition-colors">
              <Search size={14} className="text-text-muted shrink-0" />
              <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索..." className="w-full bg-transparent caption py-2 focus:outline-none text-text-primary placeholder-text-muted" />
            </div>
            <button onClick={handleCreate}
              className="btn-icon-sm bg-accent/15 text-accent hover:bg-accent/25 transition-all shrink-0"
              aria-label="新建笔记">
              <Plus size={14} />
            </button>
          </div>
          {/* Folder tabs */}
          <div className="flex gap-1 mt-2 overflow-x-auto">
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={cn(
                  'px-2 py-1 rounded-lg caption font-medium whitespace-nowrap transition-all',
                  activeFolder === folder
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-panel-hover'
                )}
              >
                {folder}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <ListSkeleton count={3} />
          ) : filteredNotes.length === 0 && (
            <div className="text-center text-text-muted caption py-8">
              {activeFolder === '全部' ? '暂无笔记' : `暂无"${activeFolder}"笔记`}
            </div>
          )}
          {filteredNotes.map((note) => (
            <div key={note.id} onClick={() => selectNote(note)}
              className={cn(
                'px-3 py-2.5 rounded-xl cursor-pointer transition-all group',
                activeId === note.id ? 'bg-accent/10 border border-accent/20' : 'hover:bg-bg-panel-hover border border-transparent'
              )}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate flex-1">
                  {keyword ? highlightText(note.title, keyword) : note.title}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(note.id) }}
                  className="opacity-0 group-hover:opacity-100 btn-icon-sm text-text-muted hover:text-accent-danger"
                  aria-label="删除笔记"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="text-xs text-text-muted mt-0.5 truncate">
                {keyword ? highlightText(note.content.slice(0, 50) || '空白笔记', keyword) : (note.content.slice(0, 50) || '空白笔记')}
              </div>
              {/* Extract tags from content */}
              {(() => {
                const tags = note.content.match(/#(\S+)/g)
                if (!tags || tags.length === 0) return null
                return (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="caption px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                        {tag}
                      </span>
                    ))}
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className={cn(
        'glass rounded-2xl flex flex-col overflow-hidden transition-all duration-300',
        activeNote ? 'flex-1' : 'hidden md:flex md:flex-1'
      )}>
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-3">
              <button
                onClick={() => { setActiveId(null); setEditTitle(''); setEditContent('') }}
                className="md:hidden btn-icon-sm text-text-muted hover:text-text-primary"
                aria-label="返回笔记列表"
              >
                <ArrowLeft size={18} />
              </button>
              <input value={editTitle} onChange={(e) => { setEditTitle(e.target.value); editTitleRef.current = e.target.value }} onBlur={handleSave}
                className="flex-1 bg-transparent heading-lg focus:outline-none text-text-primary" />
              {/* Markdown formatting buttons */}
              {!preview && (
                <div className="flex items-center gap-1.5 mr-2">
                  {[
                    { icon: Bold, action: '**', title: '粗体' },
                    { icon: Italic, action: '_', title: '斜体' },
                    { icon: Code, action: '`', title: '代码' },
                    { icon: List, action: '- ', title: '列表' },
                    { icon: Link, action: '[链接](', title: '链接' },
                  ].map(({ icon: Icon, action, title }) => (
                    <button
                      key={title}
                      onClick={() => {
                        const ta = textareaRef.current
                        if (!ta) return
                        const start = ta.selectionStart
                        const end = ta.selectionEnd
                        const selected = editContent.substring(start, end)
                        const newText = editContent.substring(0, start) + action + selected + (action.length > 1 ? action.split('').reverse().join('') : '') + editContent.substring(end)
                        setEditContent(newText)
                        setTimeout(() => {
                          ta.selectionStart = ta.selectionEnd = start + action.length + selected.length
                          ta.focus()
                        }, 0)
                      }}
                      className="btn-icon-sm text-text-muted hover:text-text-primary"
                      title={title}
                      aria-label={title}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="caption font-mono" title="字数">
                  {editContent.length} 字
                </span>
                <span className="caption font-mono" title="预计阅读时间">
                  ~{Math.max(1, Math.ceil(editContent.length / 500))} 分钟
                </span>
                {saving && <span className="caption text-text-muted">保存中...</span>}
                <button
                  onClick={() => {
                    const blob = new Blob([`# ${editTitle}\n\n${editContent}`], { type: 'text/markdown' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${editTitle || 'note'}.md`
                    a.click()
                    URL.revokeObjectURL(url)
                    toast('笔记已导出', 'success')
                  }}
                  className="btn-icon-sm text-text-muted hover:text-text-primary"
                  title="导出为 Markdown"
                  aria-label="导出为 Markdown"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setPreview(!preview)}
                  className={cn(
                    'btn-icon-sm transition-all',
                    preview
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                  title={preview ? '编辑模式' : '预览模式'}
                  aria-label={preview ? '切换到编辑模式' : '切换到预览模式'}
                >
                  {preview ? <Edit3 size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {/* Content */}
            {preview ? (
              <div className="flex-1 p-4 overflow-y-auto chat-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editContent || '*暂无内容*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="开始写点什么... (支持 Markdown 语法)"
                className="flex-1 bg-transparent p-4 text-sm text-text-primary placeholder-text-muted focus:outline-none resize-none leading-relaxed font-mono"
              />
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={<FileText size={48} />}
              title="选择或创建一个笔记"
              description="支持 Markdown 语法编辑和实时预览"
            />
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        title="删除笔记"
        message="确定要删除这个笔记吗？此操作不可撤销。"
        variant="danger"
        confirmLabel="删除"
        onConfirm={() => { if (deleteId) handleDelete(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
