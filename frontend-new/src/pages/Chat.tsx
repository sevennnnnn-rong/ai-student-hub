import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Loader2, PanelLeftOpen, PanelLeftClose, Copy, Check, Trash2, Plus, RotateCcw, Download, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { chatApi, conversationApi, type Conversation, type ChatMessage } from '../lib/api'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { usePageTitle } from '../hooks/usePageTitle'
import { agentMetaMap } from '../lib/agent-config'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast('已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('复制失败', 'error')
    }
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
  const meta = agentMetaMap[agent] || agentMetaMap.claude
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

  const streamChat = async (content: string, assistantId: number, errorMsg: string) => {
    try {
      let fullResponse = ''
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      for await (const chunk of chatApi.stream(content, agent, activeConvId ?? undefined)) {
        fullResponse += chunk
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullResponse } : m
          )
        )
      }
      return true
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: errorMsg }
            : m
        )
      )
      toast(errorMsg.replace('⚠️ ', ''), 'error')
      return false
    } finally {
      setLoading(false)
    }
  }

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

    const ok = await streamChat(msg, assistantId, '⚠️ 请求失败，请检查 Agent 配置或网络连接')
    if (ok) {
      // Refresh conversations list
      const convs = await conversationApi.list()
      setConversations(convs)
      if (!activeConvId && convs.length > 0) {
        setActiveConvId(convs[0].id)
      }
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

    await streamChat(lastUserMsg.content, newAssistantId, '⚠️ 重新生成失败')
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
    <div className="h-full flex gap-5 animate-fade-in">
      {/* Conversation Sidebar */}
      <div className={cn(
        'w-72 shrink-0 glass rounded-3xl flex flex-col overflow-hidden transition-all duration-300',
        sidebarOpen ? 'flex' : 'hidden md:flex'
      )}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-medium">对话列表</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="glass p-2 rounded-xl text-text-muted hover:text-accent transition-all"
                title="新对话"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden glass p-2 rounded-xl text-text-muted hover:text-text-primary transition-all"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>
          </div>
          {/* Agent Switcher */}
          <div className="flex gap-2">
            {Object.entries(agentMetaMap).map(([key, m]) => (
              <button
                key={key}
                onClick={() => switchAgent(key)}
                className={cn(
                  'flex-1 glass px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200',
                  agent === key
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.05]'
                )}
              >
                {m.label.split('·')[0].trim()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 && (
            <div className="text-center text-text-muted caption py-8">暂无对话</div>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-2xl transition-all group cursor-pointer',
                activeConvId === conv.id
                  ? 'glass bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:bg-white/[0.05]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm truncate flex-1 font-medium">{conv.title}</div>
                <button
                  onClick={(e) => handleDeleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-accent-danger shrink-0 ml-2 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="caption mt-1">{conv.message_count} 条消息</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col glass rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-text-muted hover:text-text-primary transition-colors"
          >
            <PanelLeftOpen size={18} />
          </button>
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', meta.gradient)}>
            <AgentIcon size={20} className="text-white" />
          </div>
          <span className="text-lg font-medium">{meta.label}</span>
          {messages.length > 0 && (
            <span className="caption font-mono text-text-muted">{messages.length} 条</span>
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
              className="glass p-2 rounded-xl text-text-muted hover:text-text-primary transition-all"
              title="导出对话"
            >
              <Download size={16} />
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-accent">
              <Loader2 size={14} className="animate-spin" />
              <span className="caption">思考中...</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center animate-scale-in">
                <div className={cn('w-24 h-24 rounded-3xl bg-gradient-to-br mx-auto mb-6 flex items-center justify-center', meta.gradient, meta.color.replace('text-', 'shadow-'))}>
                  <AgentIcon size={40} className="text-white" />
                </div>
                <p className="text-xl font-semibold mb-3">开始与 {meta.label.split('·')[0].trim()} 对话</p>
                <p className="text-sm text-text-secondary max-w-sm mb-8">
                  {agent === 'claude' && '我可以帮你进行战略规划、复杂推理和多步任务编排'}
                  {agent === 'codex' && '我可以帮你生成代码、解决技术问题和执行工程任务'}
                  {agent === 'doubao' && '我可以帮你批量处理数据、整理信息和执行重复性任务'}
                </p>
                {/* Suggested prompts */}
                <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
                  {(agent === 'claude'
                    ? ['帮我制定本周学习计划', '分析这个方案的优缺点', '拆解一个复杂项目']
                    : agent === 'codex'
                    ? ['写一个 Python 爬虫', '帮我优化这段代码', '解释这个错误信息']
                    : ['整理这份数据', '批量重命名文件', '生成一份报告']
                  ).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="glass glass-hover px-4 py-2.5 rounded-2xl text-sm text-text-secondary transition-all flex items-center gap-2"
                    >
                      <Sparkles size={12} className="text-accent-amber" />
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
                  'px-5 py-3.5 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'glass bg-accent/15 text-text-primary rounded-br-lg border border-accent/20'
                    : 'glass text-text-primary rounded-bl-lg'
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
                'flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                <span className="caption font-mono text-text-muted">
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <CopyButton text={msg.content} />
                {msg.role === 'assistant' && !loading && (
                  <button
                    onClick={() => handleRegenerate(msg.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-text-muted hover:text-text-primary"
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
              <div className="glass px-5 py-3.5 rounded-2xl rounded-bl-lg inline-flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-border shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              rows={1}
              className="flex-1 glass rounded-2xl px-4 py-3 resize-none min-h-[48px] max-h-[160px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder-text-muted"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={cn(
                'p-3 rounded-2xl transition-all duration-200 shrink-0',
                input.trim() && !loading
                  ? 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 hover:scale-105 active:scale-95'
                  : 'glass text-text-muted cursor-not-allowed'
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
