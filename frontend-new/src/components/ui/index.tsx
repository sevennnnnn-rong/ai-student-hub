import { cn } from '../../lib/utils'
import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

// ===== GlassCard =====
interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  active?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-8', none: '' }

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover, active, padding = 'md', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'glass',
        hover && 'glass-hover',
        active && 'glass-active',
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
GlassCard.displayName = 'GlassCard'

// ===== EmptyState =====
interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
      <div className="text-text-muted mb-4 opacity-40">{icon}</div>
      <p className="text-text-secondary font-medium mb-1">{title}</p>
      {description && <p className="text-text-muted text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ===== Badge =====
interface BadgeProps {
  variant?: 'default' | 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'pink'
  children: ReactNode
  className?: string
}

const badgeColors = {
  default: 'bg-white/8 text-text-secondary',
  blue: 'bg-accent-blue/15 text-accent-blue',
  purple: 'bg-accent-purple/15 text-accent-purple',
  amber: 'bg-accent-amber/15 text-accent-amber',
  green: 'bg-accent-success/15 text-accent-success',
  red: 'bg-accent-danger/15 text-accent-danger',
  pink: 'bg-accent-pink/15 text-accent-pink',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', badgeColors[variant], className)}>
      {children}
    </span>
  )
}

// ===== StatCard =====
interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
  glow?: string
  className?: string
}

export function StatCard({ icon, label, value, sub, color = 'bg-accent-blue', glow, className }: StatCardProps) {
  return (
    <GlassCard hover className={cn('stagger-item', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className={cn('p-2 rounded-xl', color, glow)}>
          <span className="text-white">{icon}</span>
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </GlassCard>
  )
}

// ===== FilterTabs =====
interface FilterTab {
  key: string
  label: string
}

interface FilterTabsProps {
  tabs: FilterTab[]
  active: string
  onChange: (key: string) => void
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            active === tab.key
              ? 'bg-accent-blue/15 text-accent-blue shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
