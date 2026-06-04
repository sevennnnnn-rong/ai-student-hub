import { Home, MessageSquare, CheckSquare, Timer, Calendar, StickyNote, BarChart3, User } from 'lucide-react'

export const navItems = [
  { to: '/', icon: Home, label: '发现', group: '学习' },
  { to: '/tasks', icon: CheckSquare, label: '任务', group: '学习' },
  { to: '/pomodoro', icon: Timer, label: '番茄钟', group: '学习' },
  { to: '/schedule', icon: Calendar, label: '课程表', group: '学习' },
  { to: '/notes', icon: StickyNote, label: '笔记', group: '学习' },
  { to: '/chat', icon: MessageSquare, label: 'AI 对话', group: '工具' },
  { to: '/dashboard', icon: BarChart3, label: '看板', group: '工具' },
]

export const mobileTabItems = [
  { to: '/', icon: Home, label: '发现' },
  { to: '/tasks', icon: CheckSquare, label: '任务' },
  { to: '/pomodoro', icon: Timer, label: '专注' },
  { to: '/notes', icon: StickyNote, label: '笔记' },
  { to: '/settings', icon: User, label: '我的' },
]
