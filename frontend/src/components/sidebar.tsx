'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Timer, Calendar, FileText, MessageSquare, Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useState } from 'react'

const navItems = [
  { href: '/tasks', label: '任务管理', icon: CheckSquare },
  { href: '/pomodoro', label: '番茄钟', icon: Timer },
  { href: '/schedule', label: '课程表', icon: Calendar },
  { href: '/notes', label: '笔记', icon: FileText },
  { href: '/ai-chat', label: 'AI助手', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-900 text-white p-2 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '关闭菜单' : '打开菜单'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside aria-label="导航菜单" className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 text-white p-4
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <h1 className="text-xl font-bold mb-6 pt-12 md:pt-0">AI Student Hub</h1>
        <nav className="flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                  isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 深色模式切换 */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 p-3 rounded-lg w-full hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? '深色模式' : '浅色模式'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
