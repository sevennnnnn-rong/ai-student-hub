'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { aiApi, agentApi, conversationApi, Agent, ConversationMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/toast'
import { Send, Bot, User, Plus, Trash2, MessageSquare, Brain, Code, Sparkles, Cpu, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Conversation {
  id: number
  title: string
  message_count: number
  created_at: string
  agent_name?: string
}

const agentIcons: Record<string, React.ReactNode> = {
  Brain: <Brain size={16} />,
  Code: <Code size={16} />,
  Sparkles: <Sparkles size={16} />,
  Cpu: <Cpu size={16} />,
}

export default function AiChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('deepseek')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  const loadAgents = useCallback(async () => {
    try {
      const data = await agentApi.list()
      setAgents(data)
    } catch {
      // 使用默认列表
      setAgents([
        { name: 'deepseek', display_name: 'DeepSeek', description: '通用对话，性价比高', icon: 'Sparkles' },
        { name: 'claude', display_name: 'Claude', description: '代码能力强', icon: 'Brain' },
        { name: 'mimo', display_name: 'MiMo', description: '中文理解能力强', icon: 'Cpu' },
        { name: 'trae', display_name: 'Trae', description: '字节跳动 AI', icon: 'Code' },
      ])
    }
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationApi.getAll()
      setConversations(data)
    } catch {
      toast('加载对话列表失败', 'error')
    }
  }, [toast])

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const data = await conversationApi.getMessages(conversationId)
      setMessages(data)
    } catch {
      toast('加载消息失败', 'error')
    }
  }, [toast])

  useEffect(() => {
    loadAgents()
    loadConversations()
  }, [loadAgents, loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId, loadMessages])

  const handleNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    const tempUserMsg: ConversationMessage = { id: Date.now(), role: 'user', content: userMessage }
    const assistantMsgId = Date.now() + 1
    const assistantMsg: ConversationMessage = { id: assistantMsgId, role: 'assistant', content: '' }
    setMessages(prev => [...prev, tempUserMsg, assistantMsg])
    setLoading(true)

    try {
      let fullContent = ''
      for await (const chunk of aiApi.chatStream(userMessage, activeConversationId ?? undefined, selectedAgent)) {
        fullContent += chunk
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: fullContent } : m
        ))
      }

      // 更新对话列表
      if (!activeConversationId) {
        loadConversations()
      }
    } catch {
      toast('AI对话失败，请稍后再试', 'error')
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: '抱歉，发生了错误，请稍后再试。' }
          : m
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (id: number) => {
    try {
      await conversationApi.delete(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConversationId === id) {
        setActiveConversationId(null)
        setMessages([])
      }
      toast('对话已删除')
    } catch {
      toast('删除对话失败', 'error')
    }
  }

  return (
    <div className="flex h-full gap-4">
      {/* 移动端对话列表切换按钮 */}
      <button
        className="md:hidden fixed bottom-20 left-4 z-30 p-2 rounded-lg bg-blue-500 text-white shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? '关闭对话列表' : '打开对话列表'}
      >
        {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
      </button>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 对话列表 */}
      <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-900 p-4 shadow-xl' : 'hidden'} md:relative md:block md:w-64 md:flex-shrink-0 md:border-r dark:border-gray-700 md:pr-4 overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold dark:text-white">对话列表</h2>
          <Button size="sm" variant="outline" onClick={() => { handleNewConversation(); setSidebarOpen(false) }} aria-label="新建对话">
            <Plus size={14} />
          </Button>
        </div>
        <div className="space-y-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              className={`w-full p-3 rounded-lg flex items-center justify-between group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeConversationId === conv.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'
              }`}
              onClick={() => { setActiveConversationId(conv.id); setSidebarOpen(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveConversationId(conv.id); setSidebarOpen(false) } }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="text-sm truncate">{conv.title}</span>
              </div>
              <span
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id) }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleDeleteConversation(conv.id) } }}
                aria-label="删除对话"
              >
                <Trash2 size={12} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* Agent 选择器 */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {agents.map(agent => (
            <button
              key={agent.name}
              onClick={() => setSelectedAgent(agent.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedAgent === agent.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-label={`选择 ${agent.display_name}`}
              aria-pressed={selectedAgent === agent.name}
            >
              {agentIcons[agent.icon] || <Bot size={16} />}
              <span>{agent.display_name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4" role="log" aria-live="polite" aria-label="聊天消息">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <Bot size={48} className="mx-auto mb-4" />
              <p>你好！我是你的 AI 助手</p>
              <p className="text-sm">可以帮你创建任务、管理日程、回答问题</p>
              <p className="text-xs mt-2">当前选择: {agents.find(a => a.name === selectedAgent)?.display_name || selectedAgent}</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || '...'}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <span className="animate-pulse dark:text-gray-300">思考中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
          <Input
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="dark:text-white"
          />
          <Button type="submit" disabled={loading}>
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  )
}
