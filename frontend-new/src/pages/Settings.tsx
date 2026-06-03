import { useState } from 'react'
import { Save, Wifi, WifiOff, Check, AlertCircle, Info, Download, Upload, Sun, Moon, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'
import { API_BASE } from '../lib/api'
import { GlassCard } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'
import { useTheme } from '../hooks/useTheme'
import { agents } from '../lib/agent-config'

const agentConfigs = agents.map((a) => ({
  ...a,
  fields: a.id === 'claude'
    ? [
        { key: 'cli_path', label: 'CLI 路径', placeholder: 'claude', type: 'text', hint: 'Claude Code CLI 的可执行文件路径' },
        { key: 'model', label: '模型', placeholder: 'claude-sonnet-4-20250514', type: 'text', hint: '使用的 Claude 模型版本' },
      ]
    : a.id === 'codex'
    ? [
        { key: 'cli_path', label: 'CLI 路径', placeholder: 'codex', type: 'text', hint: 'Codex CLI 的可执行文件路径' },
        { key: 'model', label: '模型', placeholder: 'codex-latest', type: 'text', hint: '使用的 Codex 模型版本' },
      ]
    : [
        { key: 'api_key', label: 'API Key', placeholder: 'ark-...', type: 'password', hint: '火山引擎 API Key' },
        { key: 'model', label: '模型', placeholder: 'doubao-1.5-pro-256k', type: 'text', hint: '豆包模型 ID' },
        { key: 'endpoint', label: 'API 地址', placeholder: 'https://ark.cn-beijing.volces.com/api/v3', type: 'text', hint: 'API 端点地址' },
      ],
}))

type AgentStatus = 'unknown' | 'checking' | 'connected' | 'error'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <GlassCard padding="md" rounded="rounded-2xl" className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {theme === 'dark' ? <Moon size={20} className="text-accent-blue" /> : <Sun size={20} className="text-accent-amber" />}
          <div>
            <h3 className="font-medium text-sm">外观主题</h3>
            <p className="text-xs text-text-muted">{theme === 'dark' ? '深色模式' : '浅色模式'}</p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={cn(
            'w-12 h-6 rounded-full transition-all duration-300 relative',
            theme === 'dark' ? 'bg-accent-blue/30' : 'bg-accent-amber/30'
          )}
        >
          <div className={cn(
            'w-5 h-5 rounded-full transition-all duration-300 absolute top-0.5',
            theme === 'dark'
              ? 'left-[26px] bg-accent-blue'
              : 'left-0.5 bg-accent-amber'
          )} />
        </button>
      </div>
      {/* Theme Preview */}
      <div className={cn(
        'rounded-2xl p-4 border transition-all',
        theme === 'dark'
          ? 'glass border-white/5'
          : 'bg-[#f8f9fc] border-black/5'
      )}>
        <div className="flex gap-3">
          <div className={cn(
            'w-20 h-14 rounded-xl border',
            theme === 'dark' ? 'glass border-white/5' : 'bg-white border-black/5'
          )}>
            <div className="p-2">
              <div className={cn('w-10 h-1.5 rounded mb-1.5', theme === 'dark' ? 'bg-accent-blue/30' : 'bg-blue-500/20')} />
              <div className={cn('w-7 h-1 rounded', theme === 'dark' ? 'bg-white/10' : 'bg-black/10')} />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className={cn('w-full h-1.5 rounded-lg', theme === 'dark' ? 'bg-white/5' : 'bg-black/5')} />
            <div className={cn('w-3/4 h-1.5 rounded-lg', theme === 'dark' ? 'bg-white/5' : 'bg-black/5')} />
            <div className="flex gap-1.5">
              <div className={cn('w-5 h-1.5 rounded-lg', theme === 'dark' ? 'bg-accent-blue/20' : 'bg-blue-500/15')} />
              <div className={cn('w-5 h-1.5 rounded-lg', theme === 'dark' ? 'bg-accent-purple/20' : 'bg-purple-500/15')} />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export default function Settings() {
  usePageTitle('设置')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() =>
    (localStorage.getItem('app_font_size') as 'small' | 'medium' | 'large') || 'medium'
  )
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {}
    for (const agent of agentConfigs) {
      initial[agent.id] = {}
      for (const field of agent.fields) {
        initial[agent.id][field.key] = localStorage.getItem(`agent_${agent.id}_${field.key}`) || ''
      }
    }
    return initial
  })
  const [saved, setSaved] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({
    claude: 'unknown',
    codex: 'unknown',
    doubao: 'unknown',
  })
  const { toast } = useToast()

  const handleSave = () => {
    for (const agent of agentConfigs) {
      for (const field of agent.fields) {
        localStorage.setItem(`agent_${agent.id}_${field.key}`, configs[agent.id][field.key] || '')
      }
    }
    setSaved(true)
    toast('配置已保存', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  const checkAgent = async (agentId: string) => {
    setStatuses((prev) => ({ ...prev, [agentId]: 'checking' }))
    try {
      const res = await fetch(`${API_BASE}/api/ai/agents`)
      if (res.ok) {
        setStatuses((prev) => ({ ...prev, [agentId]: 'connected' }))
      } else {
        setStatuses((prev) => ({ ...prev, [agentId]: 'error' }))
      }
    } catch {
      setStatuses((prev) => ({ ...prev, [agentId]: 'error' }))
    }
  }

  const checkAllAgents = async () => {
    setStatuses({ claude: 'checking', codex: 'checking', doubao: 'checking' })
    try {
      const res = await fetch(`${API_BASE}/api/ai/agents`)
      if (res.ok) {
        setStatuses({ claude: 'connected', codex: 'connected', doubao: 'connected' })
        toast('所有 Agent 连接正常', 'success')
      } else {
        setStatuses({ claude: 'error', codex: 'error', doubao: 'error' })
      }
    } catch {
      setStatuses({ claude: 'error', codex: 'error', doubao: 'error' })
      toast('无法连接到后端服务', 'error')
    }
  }

  const statusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'connected': return <Check size={14} className="text-accent-success" />
      case 'error': return <AlertCircle size={14} className="text-accent-danger" />
      case 'checking': return <div className="w-3.5 h-3.5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      default: return <WifiOff size={14} className="text-text-muted" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">设置</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={checkAllAgents}
            className="glass px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-white/[0.05] transition-all flex items-center gap-2"
          >
            <Wifi size={15} />
            检测连接
          </button>
          <button onClick={handleSave}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2',
              saved ? 'glass bg-accent-success/20 text-accent-success border border-accent-success/30' : 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30'
            )}>
            <Save size={15} />
            {saved ? '已保存' : '保存配置'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <GlassCard padding="md" rounded="rounded-2xl" className="mb-6 border-accent-blue/20">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-accent-blue shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="mb-1">配置保存在浏览器本地存储中。确保后端服务已启动（默认端口 8000）。</p>
            <p className="text-text-muted text-xs">Claude 和 Codex 通过本地 CLI 调用，Doubao 通过 HTTP API 调用。</p>
          </div>
        </div>
      </GlassCard>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Personalization */}
      <GlassCard padding="md" rounded="rounded-2xl" className="mb-6">
        <h3 className="text-lg font-semibold mb-5">个性化</h3>
        <div className="space-y-5">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">字体大小</p>
              <p className="text-xs text-text-muted">调整界面文字大小</p>
            </div>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    const root = document.documentElement
                    if (size === 'small') root.style.fontSize = '14px'
                    else if (size === 'large') root.style.fontSize = '18px'
                    else root.style.fontSize = '16px'
                    localStorage.setItem('app_font_size', size)
                    setFontSize(size)
                  }}
                  className={cn(
                    'glass px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                    fontSize === size
                      ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                      : 'text-text-muted hover:bg-white/[0.05]'
                  )}
                >
                  {size === 'small' ? '小' : size === 'large' ? '大' : '中'}
                </button>
              ))}
            </div>
          </div>
          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">紧凑模式</p>
              <p className="text-xs text-text-muted">减小间距，显示更多内容</p>
            </div>
            <button
              onClick={() => {
                const compact = localStorage.getItem('app_compact') !== 'true'
                localStorage.setItem('app_compact', String(compact))
                document.documentElement.classList.toggle('compact-mode', compact)
              }}
              className={cn(
                'w-12 h-6 rounded-full transition-all duration-300 relative',
                localStorage.getItem('app_compact') === 'true' ? 'bg-accent-blue/30' : 'glass'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full transition-all duration-300 absolute top-0.5',
                localStorage.getItem('app_compact') === 'true'
                  ? 'left-[26px] bg-accent-blue'
                  : 'left-0.5 bg-text-muted'
              )} />
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-5">
        {agentConfigs.map((agent) => (
          <GlassCard key={agent.id} padding="md" rounded="rounded-2xl" hover>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center', agent.gradient)}>
                  <agent.icon size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{agent.name}</h2>
                  <p className="text-xs text-text-muted">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusIcon(statuses[agent.id])}
                <button
                  onClick={() => checkAgent(agent.id)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  检测
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {agent.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-text-secondary mb-1.5 block">{field.label}</label>
                  <input
                    type={field.type}
                    value={configs[agent.id][field.key] || ''}
                    onChange={(e) => setConfigs({
                      ...configs,
                      [agent.id]: { ...configs[agent.id], [field.key]: e.target.value },
                    })}
                    placeholder={field.placeholder}
                    className="glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 transition-all w-full"
                  />
                  {field.hint && (
                    <p className="text-xs text-text-muted mt-1.5">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Data Management */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">数据管理</h2>
        <GlassCard padding="md" rounded="rounded-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const data = {
                  agentConfigs: configs,
                  exportedAt: new Date().toISOString(),
                  version: '1.0.0',
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `qixiangtai-hub-config-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
                URL.revokeObjectURL(url)
                toast('配置已导出', 'success')
              }}
              className="glass px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-white/[0.05] transition-all flex items-center gap-2"
            >
              <Download size={16} />
              导出配置
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.json'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const data = JSON.parse(text)
                    if (data.agentConfigs) {
                      setConfigs(data.agentConfigs)
                      toast('配置已导入，请点击保存', 'success')
                    } else {
                      toast('无效的配置文件', 'error')
                    }
                  } catch {
                    toast('文件解析失败', 'error')
                  }
                }
                input.click()
              }}
              className="glass px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-white/[0.05] transition-all flex items-center gap-2"
            >
              <Upload size={16} />
              导入配置
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">快捷键</h2>
        <GlassCard padding="md" rounded="rounded-2xl">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { keys: 'Ctrl+K', action: '打开命令面板' },
              { keys: 'Ctrl+1-7', action: '快速导航' },
              { keys: 'Ctrl+Shift+N', action: '快速笔记' },
              { keys: 'Ctrl+/', action: '快捷键帮助' },
              { keys: 'Space', action: '番茄钟 开始/暂停' },
              { keys: 'R', action: '番茄钟 重置' },
              { keys: 'Enter', action: '发送消息' },
              { keys: 'Shift+Enter', action: '消息换行' },
              { keys: 'Esc', action: '关闭弹窗' },
            ].map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between py-1.5">
                <span className="text-text-secondary">{shortcut.action}</span>
                <kbd className="text-xs text-text-muted glass px-2.5 py-1 rounded-lg">{shortcut.keys}</kbd>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Data Clear */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">数据管理</h2>
        <GlassCard padding="md" rounded="rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">清除所有本地数据</p>
              <p className="text-xs text-text-muted mt-1">清除 localStorage 中的所有应用数据，此操作不可撤销</p>
            </div>
            <button
              onClick={() => {
                if (confirm('确定要清除所有本地数据吗？此操作不可撤销。')) {
                  // Only clear app-specific keys, not all localStorage
                  const appPrefixes = ['cloudtime_', 'quick_note', 'theme', 'onboarding_', 'agentConfigs']
                  const keysToRemove: string[] = []
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && appPrefixes.some(p => key.startsWith(p))) {
                      keysToRemove.push(key)
                    }
                  }
                  keysToRemove.forEach(k => localStorage.removeItem(k))
                  toast('数据已清除，页面即将刷新', 'success')
                  setTimeout(() => window.location.reload(), 1000)
                }
              }}
              className="glass px-4 py-2.5 rounded-xl text-sm bg-accent-danger/20 text-accent-danger hover:bg-accent-danger/30 border border-accent-danger/30 transition-all flex items-center gap-2"
            >
              <Trash2 size={15} />
              清除数据
            </button>
          </div>
        </GlassCard>
      </div>

      {/* About */}
      <div className="mt-10 mb-10">
        <h2 className="text-xl font-semibold mb-4">关于</h2>
        <GlassCard padding="md" rounded="rounded-2xl">
          <div className="text-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">应用名称</span>
              <span className="font-medium gradient-text">气象台Hub</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">版本</span>
              <span className="font-mono text-text-muted">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">技术栈</span>
              <span className="text-text-muted">Tauri 2.x + React 19 + Vite 8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">UI 框架</span>
              <span className="text-text-muted">TailwindCSS 4 + Liquid Glass</span>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-text-muted text-center">
                AI 驱动的学生效率工具集 · 让学习更智能
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
