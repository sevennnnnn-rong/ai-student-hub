import { useState, useRef, useEffect } from 'react'
import PopupShell from './PopupShell'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ACCENT = '#C20C0C'

export default function PopupChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        listRef.current!.scrollTop = listRef.current!.scrollHeight
      })
    }
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response || data.message || '...' },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '请求失败，请稍后重试' },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '无法连接到服务器，请检查网络后重试' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isEmpty = messages.length === 0 && !loading

  return (
    <PopupShell title="AI 助手" icon="🤖" accentColor={ACCENT}>
      {/* Message list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {isEmpty && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.25)',
              fontSize: 14,
              gap: 8,
            }}
          >
            <div style={{ fontSize: 36 }}>💬</div>
            <div>有什么可以帮你的？</div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              {/* Avatar - only for AI messages */}
              {!isUser && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #C20C0C, #ff6b6b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  AI
                </div>
              )}

              {/* Bubble */}
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  borderBottomRightRadius: isUser ? 4 : 12,
                  borderBottomLeftRadius: isUser ? 12 : 4,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#e8e8e8',
                  wordBreak: 'break-word',
                  background: isUser
                    ? 'rgba(194,12,12,0.25)'
                    : 'rgba(255,255,255,0.07)',
                  border: isUser
                    ? '1px solid rgba(194,12,12,0.15)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {msg.content}
              </div>
            </div>
          )
        })}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #C20C0C, #ff6b6b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: '#fff',
                fontWeight: 600,
              }}
            >
              AI
            </div>
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                borderBottomLeftRadius: 4,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(idx => (
                  <div
                    key={idx}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'rgba(194,12,12,0.7)',
                      animation: `chatDot 1.2s ease-in-out ${idx * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Input area */}
      <div
        style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题..."
            rows={1}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '8px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              color: '#e8e8e8',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              minHeight: 36,
              maxHeight: 100,
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              width: 40,
              height: 36,
              borderRadius: 18,
              border: 'none',
              background:
                loading || !input.trim()
                  ? 'rgba(194,12,12,0.3)'
                  : 'linear-gradient(135deg, #C20C0C, #e03030)',
              color: '#fff',
              fontSize: 14,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'chatSpin 0.7s linear infinite',
                }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes chatSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PopupShell>
  )
}
