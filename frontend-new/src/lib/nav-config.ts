import { Home, MessageSquare, CheckSquare, Timer, Calendar, StickyNote, BarChart3 } from 'lucide-react'

export const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/chat', icon: MessageSquare, label: '对话' },
  { to: '/tasks', icon: CheckSquare, label: '任务' },
  { to: '/pomodoro', icon: Timer, label: '番茄钟' },
  { to: '/schedule', icon: Calendar, label: '课程表' },
  { to: '/notes', icon: StickyNote, label: '笔记' },
  { to: '/dashboard', icon: BarChart3, label: '看板' },
]
