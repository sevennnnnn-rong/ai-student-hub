'use client'

import { usePathname } from 'next/navigation'
import { CheckSquare, Timer, Calendar, FileText, MessageSquare, Bell } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useState, useEffect } from 'react'

const pageTitles: Record<string, { title: string; icon: React.ElementType }> = {
  '/tasks': { title: '任务管理', icon: CheckSquare },
  '/pomodoro': { title: '番茄钟', icon: Timer },
  '/schedule': { title: '课程表', icon: Calendar },
  '/notes': { title: '笔记', icon: FileText },
  '/ai-chat': { title: 'AI 助手', icon: MessageSquare },
}

export function Header() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(new Date())
  const pageInfo = pageTitles[pathname] || { title: 'AI Student Hub', icon: CheckSquare }
  const Icon = pageInfo.icon

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return date.toLocaleDateString('zh-CN', options)
  }

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Icon size={24} className="text-blue-600" />
        <h1 className="text-xl font-bold">{pageInfo.title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{formatDate(currentTime)}</span>
        <div className="p-2 text-gray-400" aria-hidden="true">
          <Bell size={20} />
        </div>
      </div>
    </header>
  )
}
