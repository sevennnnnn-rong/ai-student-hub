import { NavLink } from 'react-router-dom'
import {
  Settings,
  Sun, Moon, Maximize2, Minimize2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'
import { useFocusMode } from '../hooks/useFocusMode'
import { navItems } from '../lib/nav-config'

function NavItem({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <div className="relative group">
      <NavLink
        to={to}
        end={to === '/'}
        aria-label={label}
        className={({ isActive }) =>
          cn(
            'w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-200',
            'hover:bg-bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
            isActive && 'bg-accent-blue/15 text-accent-blue glow-blue'
          )
        }
      >
        <Icon size={19} strokeWidth={1.8} />
      </NavLink>
      {/* Tooltip */}
      <div
        className={cn(
          'absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50',
          'bg-black/85 backdrop-blur-md text-white text-xs font-medium',
          'px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none',
          'border border-white/10 shadow-xl',
          'transition-all duration-200',
          'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
        )}
      >
        {label}
        {/* Arrow */}
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-black/85 rotate-45 border-l border-b border-white/10" />
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { theme, toggle } = useTheme()
  const { focusMode, toggle: toggleFocus } = useFocusMode()

  return (
    <aside className="w-[72px] h-full flex flex-col items-center py-4 glass border-r border-border shrink-0 z-10">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mb-6 glow-blue hover:scale-110 transition-transform duration-300 cursor-pointer">
        <span className="text-white font-bold text-lg">AI</span>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 flex flex-col items-center gap-1"
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
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Divider */}
      <div className="w-6 h-px bg-border my-2" />

      {/* Theme Toggle */}
      <button
        onClick={toggle}
        className="btn-icon-md rounded-xl text-text-muted hover:text-text-primary"
        aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Focus Mode Toggle */}
      <button
        onClick={toggleFocus}
        className="btn-icon-md rounded-xl text-text-muted hover:text-text-primary"
        aria-label={focusMode ? '退出专注模式' : '进入专注模式'}
        title={focusMode ? '退出专注模式' : '进入专注模式'}
      >
        {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {/* Settings */}
      <div className="relative">
        <NavLink
          to="/settings"
          aria-label="设置"
          className={({ isActive }) =>
            cn(
              'w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-200',
              'hover:bg-bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
              isActive && 'bg-accent-purple/15 text-accent-purple glow-purple'
            )
          }
        >
          <Settings size={19} strokeWidth={1.8} />
        </NavLink>
      </div>
    </aside>
  )
}
