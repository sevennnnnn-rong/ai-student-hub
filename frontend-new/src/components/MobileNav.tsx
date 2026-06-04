import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'
import { mobileTabItems } from '../lib/nav-config'

export default function MobileNav() {
  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'bg-bg-secondary/95 backdrop-blur-lg',
        'border-t border-white/[0.06]',
        'pb-[env(safe-area-inset-bottom,0px)]'
      )}
      aria-label="移动端导航"
    >
      <div className="flex items-center justify-around h-14">
        {mobileTabItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5',
                'w-full h-full',
                'transition-all duration-200 active:scale-90',
                isActive
                  ? 'text-[#C20C0C]'
                  : 'text-[#666] hover:text-text-secondary'
              )
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
