import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'
import { navItems } from '../lib/nav-config'

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom" aria-label="移动端导航">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 active:scale-90 min-w-[48px]',
                isActive
                  ? 'text-accent-blue bg-accent-blue/10'
                  : 'text-text-muted hover:text-text-secondary'
              )
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span className="caption font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
