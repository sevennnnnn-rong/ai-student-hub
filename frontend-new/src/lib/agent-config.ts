import { Brain, Code, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AgentMeta {
  id: string
  name: string
  role: string
  desc: string
  description: string
  icon: LucideIcon
  gradient: string
  glow: string
  borderColor: string
  color: string
  features: string[]
}

export const agents: AgentMeta[] = [
  {
    id: 'claude',
    name: 'Claude',
    role: '指挥官',
    desc: '战略规划、复杂推理、多步任务编排',
    description: '指挥官 — 战略规划、复杂推理、多步任务编排',
    icon: Brain,
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'glow-blue',
    borderColor: 'hover:border-blue-400/40',
    color: 'text-blue-400',
    features: ['深度思考', '任务拆解', '创意写作'],
  },
  {
    id: 'codex',
    name: 'Codex',
    role: '引擎',
    desc: '代码生成、技术实现、工程执行',
    description: '引擎 — 代码生成、技术实现、工程执行',
    icon: Code,
    gradient: 'from-purple-500 to-pink-400',
    glow: 'glow-purple',
    borderColor: 'hover:border-purple-400/40',
    color: 'text-purple-400',
    features: ['代码生成', 'Bug修复', '架构设计'],
  },
  {
    id: 'doubao',
    name: 'Doubao',
    role: '苦力工',
    desc: '批量处理、数据整理、重复性任务',
    description: '苦力工 — 批量处理、数据整理、重复性任务',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-400',
    glow: 'glow-amber',
    borderColor: 'hover:border-amber-400/40',
    color: 'text-amber-400',
    features: ['数据处理', '文本整理', '批量操作'],
  },
]

export const agentMetaMap: Record<string, { icon: LucideIcon; color: string; label: string; gradient: string }> = Object.fromEntries(
  agents.map((a) => [a.id, { icon: a.icon, color: a.color, label: `${a.name} · ${a.role}`, gradient: a.gradient }])
)
