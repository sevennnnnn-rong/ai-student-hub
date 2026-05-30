import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Brain, Code, Zap, Loader2, PanelLeftOpen, PanelLeftClose, Copy, Check, Trash2, Plus, RotateCcw, Download, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { chatApi, conversationApi, type Conversation, type ChatMessage } from '../lib/api'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'

const agentMeta: Record<string, { icon: typeof Brain; color: string; label: string; gradient: string }> = {
  claude: { icon: Brain, color: 'text-blue-400', label: 'Claude · 指挥官', gradient: 'from-blue-500 to-cyan-400' },
  codex: { icon: Code, color: 'text-purple-400', label: 'Codex · 引擎', gradient: 'from-purple-500 to-pink-400' },
  doubao: { icon: Zap, color: 'text-amber-400', label: 'Doubao · 苦力工', gradient: 'from-amber-500 to-orange-400' },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast('已复制到剪贴板', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md hover:bg-white/10 transition-all text-text-muted hover:text-text-primary"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams()
  const agent = searchParams.get('agent') || 'claude'
  const meta = agentMeta[agent] || agentMeta.claude
  usePageTitle(`AI 对话 · ${meta.label.split('·')[0].trim()}`)
  const AgentIcon = meta.icon
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const assistantMsgIdRef = useRef<number>(0)

  // Auto-grow textarea
  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  // Load conversations
  useEffect(() => {
    conversationApi.list().then(setConversations).catch(() => {})
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConvId) {
      conversationApi.messages(activeConvId).then(setMessages).catch(() => {})
    }
  }, [activeConvId])

  // Auto scroll
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    const assistantId = Date.now() + 1
    assistantMsgIdRef.current = assistantId

    try {
      let fullResponse = ''
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      for await (const chunk of chatApi.stream(msg, agent, activeConvId ?? undefined)) {
        fullResponse += chunk
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullResponse } : m
          )
        )
      }

      // Refresh conversations list
      const convs = await conversationApi.list()
      setConversations(convs)
      if (!activeConvId && convs.length > 0) {
        setActiveConvId(convs[0].id)
      }
    } catch (err) {
      // Fix: use the captured assistantId instead of Date.now() + 1
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: '⚠️ 请求失败，请检查 Agent 配置或网络连接' }
            : m
        )
      )
      toast('请求失败，请检查 Agent 配置', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRegenerate = async (assistantMsgId: number) => {
    // Find the last user message before this assistant message
    const msgIndex = messages.findIndex((m) => m.id === assistantMsgId)
    if (msgIndex <= 0) return
    const lastUserMsg = messages.slice(0, msgIndex).reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return

    // Remove the assistant message and send again
    setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId))
    setInput(lastUserMsg.content)
    setLoading(true)

    const newAssistantId = Date.now()
    assistantMsgIdRef.current = newAssistantId

    try {
      let fullResponse = ''
      const assistantMsg: ChatMessage = {
        id: newAssistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      for await (const chunk of chatApi.stream(lastUserMsg.content, agent, activeConvId ?? undefined)) {
        fullResponse += chunk
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newAssistantId ? { ...m, content: fullResponse } : m
          )
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newAssistantId
            ? { ...m, content: '⚠️ 重新生成失败' }
            : m
        )
      )
      toast('重新生成失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const switchAgent = (newAgent: string) => {
    setSearchParams({ agent: newAgent })
    setMessages([])
    setActiveConvId(null)
  }

  const handleNewChat = () => {
    setMessages([])
    setActiveConvId(null)
  }

  const handleDeleteConv = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await conversationApi.delete(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConvId === id) {
        setActiveConvId(null)
        setMessages([])
      }
      toast('对话已删除', 'success')
    } catch {
      toast('删除失败', 'error')
    }
  }

  return (
    <div className="h-full flex gap-4 animate-fade-in">
      {/* Conversation Sidebar */}
      <div className={cn(
        'w-64 shrink-0 glass rounded-2xl flex flex-col overflow-hidden transition-all duration-300',
        sidebarOpen ? 'block' : 'hidden md:block'
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-secondary">对话列表</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
                title="新对话"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-panel-hover transition-all"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>
          </div>
          {/* Agent Switcher */}
          <div className="flex gap-1">
            {Object.entries(agentMeta).map(([key, m]) => (
              <button
                key={key}
                onClick={() => switchAgent(key)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                  agent === key
                    ? 'bg-accent-blue/15 text-accent-blue shadow-sm'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-panel-hover'
                )}
              >
                {m.label.split('·')[0].trim()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <div className="text-center text-text-muted text-xs py-8">暂无对话</div>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group cursor-pointer',
                activeConvId === conv.id
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-panel-hover'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="truncate flex-1">{conv.title}</div>
                <button
                  onClick={(e) => handleDeleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-text-muted hover:text-accent-danger transition-all shrink-0 ml-2"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="text-xs text-text-muted mt-0.5">{conv.message_count} 条消息</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-text-muted hover:text-text-primary transition-colors"
          >
            <PanelLeftOpen size={18} />
          </button>
          <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', meta.gradient)}>
            <AgentIcon size={16} className="text-white" />
          </div>
          <span className="font-medium">{meta.label}</span>
          {messages.length > 0 && (
            <span className="text-[10px] text-text-muted font-mono">{messages.length} 条</span>
          )}
          <div className="flex-1" />
          {messages.length > 0 && (
            <button
              onClick={() => {
                const md = messages.map((m) => `**${m.role === 'user' ? '我' : meta.label.split('·')[0].trim()}**:\n\n${m.content}`).join('\n\n---\n\n')
                const blob = new Blob([md], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `chat-${new Date().toISOString().slice(0, 10)}.md`
                a.click()
                URL.revokeObjectURL(url)
                toast('对话已导出', 'success')
              }}
              className="text-text-muted hover:text-text-primary transition-colors"
              title="导出对话"
            >
              <Download size={16} />
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-accent-blue">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">思考中...</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center animate-scale-in">
                <div className={cn('w-20 h-20 rounded-2xl bg-gradient-to-br mx-auto mb-5 flex items-center justify-center', meta.gradient, meta.color.replace('text-', 'shadow-'))}>
                  <AgentIcon size={36} className="text-white" />
                </div>
                <p className="text-lg font-medium mb-2">开始与 {meta.label.split('·')[0].trim()} 对话</p>
                <p className="text-text-muted text-sm max-w-sm mb-6">
                  {agent === 'claude' && '我可以帮你进行战略规划、复杂推理和多步任务编排'}
                  {agent === 'codex' && '我可以帮你生成代码、解决技术问题和执行工程任务'}
                  {agent === 'doubao' && '我可以帮你批量处理数据、整理信息和执行重复性任务'}
                </p>
                {/* Suggested prompts */}
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {(agent === 'claude'
                    ? ['帮我制定本周学习计划', '分析这个方案的优缺点', '拆解一个复杂项目']
                    : agent === 'codex'
                    ? ['写一个 Python 爬虫', '帮我优化这段代码', '解释这个错误信息']
                    : ['整理这份数据', '批量重命名文件', '生成一份报告']
                  ).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-1.5 rounded-xl text-xs text-text-secondary bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={10} className="text-accent-amber" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-3xl animate-slide-up group',
                msg.role === 'user' ? 'ml-auto' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-accent-blue/15 text-text-primary rounded-br-md'
                    : 'bg-bg-panel text-text-primary rounded-bl-md'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="chat-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          const isInline = !match
                          if (isInline) {
                            return <code className={className} {...props}>{children}</code>
                          }
                          return (
                            <div className="relative">
                              <div className="absolute top-2 right-2">
                                <CopyButton text={String(children).replace(/\n$/, '')} />
                              </div>
                              <pre className={className}>
                                <code className={className} {...props}>{children}</code>
                              </pre>
                            </div>
                          )
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
              {/* Timestamp and copy button */}
              <div className={cn(
                'flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                <span className="text-[10px] text-text-muted">
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <CopyButton text={msg.content} />
                {msg.role === 'assistant' && !loading && (
                  <button
                    onClick={() => handleRegenerate(msg.id)}
                    className="p-1 rounded-md hover:bg-white/10 transition-all text-text-muted hover:text-text-primary"
                    title="重新生成"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {loading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
            <div className="max-w-3xl mr-auto animate-slide-up">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-bg-panel inline-flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              rows={1}
              className="flex-1 input-glass resize-none min-h-[44px] max-h-[160px] py-3"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0',
                input.trim() && !loading
                  ? 'bg-accent-blue text-white hover:bg-accent-blue/80 glow-blue hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-text-muted cursor-not-allowed'
              )}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
