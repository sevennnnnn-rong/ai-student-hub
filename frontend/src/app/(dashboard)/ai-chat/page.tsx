'use client'

import { useState, useRef, useEffect } from 'react'
import { aiApi, taskApi } from '@/lib/api'
import { useToast } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Sparkles, ListTodo, Calendar, FileText, Copy, Check, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ToastContainer } from '@/components/toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const quickActions = [
  { label: '创建任务', icon: ListTodo, prompt: '帮我创建一个任务：' },
  { label: '安排日程', icon: Calendar, prompt: '帮我安排：' },
  { label: '总结笔记', icon: FileText, prompt: '帮我总结以下内容：' },
]

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toasts, toast, dismiss } = useToast()

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(index)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text?: string) => {
    const message = text || input.trim()
    if (!message || loading) return

    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
      const response = await aiApi.chat(message, history)
      const reply = response.data.response
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])

      if (message.includes('创建任务') || message.includes('新建任务') || message.includes('帮我做')) {
        try {
          const parsed = await aiApi.parseTask(message)
          if (parsed.data?.tasks?.length > 0) {
            for (const task of parsed.data.tasks) {
              await taskApi.create(task)
            }
            toast.success(`已自动创建 ${parsed.data.tasks.length} 个任务`)
          }
        } catch {}
      }
    } catch (error) {
      toast.error('AI对话失败，请检查API配置')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了错误。请检查 DeepSeek API Key 是否已配置。'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI 助手</h1>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setMessages([])}>
            <Trash2 className="mr-2" size={14} />
            清空对话
          </Button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-blue-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold mb-2">你好！我是你的 AI 助手</h2>
            <p className="text-gray-500 mb-6">可以帮你创建任务、管理日程、回答问题</p>

            {/* 快捷操作 */}
            <div className="flex justify-center gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setInput(action.prompt)}
                >
                  <action.icon size={16} />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className="relative group max-w-[80%]">
              <div
                className={`p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                  aria-label="复制回复"
                >
                  {copiedId === i ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-gray-400" />
                  )}
                </button>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="sticky bottom-0 bg-white border-t pt-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入消息... (Enter 发送)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
