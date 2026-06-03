import { NavLink } from 'react-router-dom'
import {
  Settings,
  Sun, Moon, Maximize2, Minimize2,
  Home, MessageSquare, CheckSquare, Timer,
  Calendar, StickyNote, BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'
import { useFocusMode } from '../hooks/useFocusMode'
import { navItems } from '../lib/nav-config'

/* ── Icon map for sidebar items ── */
const iconMap: Record<string, LucideIcon> = {
  '/': Home,
  '/chat': MessageSquare,
  '/tasks': CheckSquare,
  '/pomodoro': Timer,
  '/schedule': Calendar,
  '/notes': StickyNote,
  '/dashboard': BarChart3,
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
  const { theme, toggle } = useTheme()
  const { focusMode, toggle: toggleFocus } = useFocusMode()

  return (
    <aside
      className={cn(
        'w-60 h-full flex flex-col sidebar-glass shrink-0 z-10',
        'transition-all duration-300'
      )}
    >
      {/* ── App Branding ── */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center glow-blue shrink-0">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="text-sm font-semibold gradient-text truncate">气象台Hub</span>
      </div>

      {/* ── Separator ── */}
      <div className="mx-4 h-px bg-white/[0.06] shrink-0" />

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
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
        <span className="sidebar-group-label">导航</span>
        {navItems.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={iconMap[item.to] ?? item.icon}
            label={item.label}
          />
        ))}
      </nav>

      {/* ── Separator ── */}
      <div className="mx-4 h-px bg-white/[0.06] shrink-0" />

      {/* ── Bottom Actions ── */}
      <div className="px-3 py-3 space-y-0.5 shrink-0">
        <span className="sidebar-group-label">工具</span>

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
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'sidebar-item',
              isActive && 'sidebar-item-active'
            )
          }
        >
          <Settings size={18} strokeWidth={1.8} className="shrink-0" />
          <span>设置</span>
        </NavLink>
      </div>
    </aside>
  )
}
