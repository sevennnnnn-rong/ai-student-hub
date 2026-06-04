import { useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Settings, Sun, Moon, Maximize2, Minimize2, Timer, StickyNote, MessageSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'
import { useFocusMode } from '../hooks/useFocusMode'
import { navItems } from '../lib/nav-config'
import { openPopup } from '../lib/window-manager'

/* ── Sun-Mountain Logo SVG ── */
function LogoSvg() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 shrink-0">
      <circle cx="50" cy="50" r="50" fill="#1a2332" />
      <g transform="translate(50,50)">
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(0)" />
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(22.5)" />
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(45)" />
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(67.5)" />
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(-22.5)" />
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(-45)" />
        <rect x="-4" y="-42" width="8" height="20" rx="2" fill="#E87C1E" transform="rotate(-67.5)" />
        <circle cx="0" cy="-22" r="10" fill="#E87C1E" />
        <polygon points="0,-8 -35,15 -20,15" fill="#E87C1E" />
        <polygon points="0,-4 -25,15 -10,15" fill="#E87C1E" opacity="0.7" />
        <polygon points="0,0 -18,15 -5,15" fill="#E87C1E" opacity="0.5" />
      </g>
    </svg>
  )
}

/* ── Sidebar Item ── */
function SidebarItem({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'sidebar-item group',
          isActive && 'sidebar-item-active'
        )
      }
    >
      <Icon size={18} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

/* ── Main Sidebar ── */
export default function Sidebar() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { focusMode, toggle: toggleFocus } = useFocusMode()

  // Group nav items by group
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof navItems> = {}
    for (const item of navItems) {
      const group = item.group || '其他'
      if (!groups[group]) groups[group] = []
      groups[group].push(item)
    }
    return groups
  }, [])

  const groupOrder = ['学习', '工具']

  return (
    <aside
      className={cn(
        'w-[180px] h-full flex flex-col shrink-0 z-10',
        'bg-bg-secondary border-r border-white/[0.06]',
        'transition-all duration-300'
      )}
    >
      {/* ── App Branding ── */}
      <div className="flex items-center gap-3 px-4 py-5 shrink-0">
        <LogoSvg />
        <span className="text-sm font-semibold text-text-primary truncate">气象台Hub</span>
      </div>

      {/* ── Separator ── */}
      <div className="mx-4 h-px bg-white/[0.06] shrink-0" />

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto px-2 py-2"
        aria-label="主导航"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const items = Array.from(e.currentTarget.querySelectorAll('a'))
            const idx = items.indexOf(document.activeElement as HTMLAnchorElement)
            if (idx === -1) {
              items[e.key === 'ArrowDown' ? 0 : items.length - 1]?.focus()
            } else {
              const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1
              items[next % items.length]?.focus()
            }
          }
        }}
      >
        {groupOrder.map((groupName) => {
          const items = groupedItems[groupName]
          if (!items || items.length === 0) return null
          return (
            <div key={groupName} className="mb-1">
              <span className="sidebar-group-label">{groupName}</span>
              {items.map((item) => (
                <SidebarItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </div>
          )
        })}
      </nav>

      {/* ── Separator ── */}
      <div className="mx-4 h-px bg-white/[0.06] shrink-0" />

      {/* ── Bottom Actions ── */}
      <div className="px-2 py-2 space-y-0.5 shrink-0">
        {/* Popup Windows */}
        <div className="sidebar-group-label">浮动窗口</div>
        <button onClick={() => openPopup('pomodoro')} className="sidebar-item w-full">
          <Timer size={18} strokeWidth={1.8} />
          <span>番茄钟弹窗</span>
        </button>
        <button onClick={() => openPopup('notes')} className="sidebar-item w-full">
          <StickyNote size={18} strokeWidth={1.8} />
          <span>笔记弹窗</span>
        </button>
        <button onClick={() => openPopup('chat')} className="sidebar-item w-full">
          <MessageSquare size={18} strokeWidth={1.8} />
          <span>AI 弹窗</span>
        </button>

        <div className="mx-0 my-1 h-px bg-white/[0.06]" />

        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="sidebar-item w-full"
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
        </button>

        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocus}
          className="sidebar-item w-full"
          aria-label={focusMode ? '退出专注模式' : '进入专注模式'}
        >
          {focusMode ? <Minimize2 size={18} strokeWidth={1.8} /> : <Maximize2 size={18} strokeWidth={1.8} />}
          <span>{focusMode ? '退出专注' : '专注模式'}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="sidebar-item w-full"
          aria-label="设置"
        >
          <Settings size={18} strokeWidth={1.8} className="shrink-0" />
          <span>设置</span>
        </button>
      </div>
    </aside>
  )
}
