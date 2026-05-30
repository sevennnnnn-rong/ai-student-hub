'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, CheckSquare, Timer, Calendar, FileText, MessageSquare, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { href: '/tasks', label: '任务管理', icon: CheckSquare },
  { href: '/pomodoro', label: '番茄钟', icon: Timer },
  { href: '/schedule', label: '课程表', icon: Calendar },
  { href: '/notes', label: '笔记', icon: FileText },
  { href: '/ai-chat', label: 'AI助手', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Escape 键关闭侧边栏
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileOpen])

  // 防止背景滚动
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      {/* 移动端汉堡菜单按钮 */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 遮罩层 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 dark:bg-gray-950 text-white p-4
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        role="navigation"
        aria-label="主导航"
      >
        <h1 className="text-xl font-bold mb-6">AI Student Hub</h1>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 dark:hover:bg-gray-800 text-gray-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
