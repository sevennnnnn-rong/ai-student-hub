import { cn } from '../../lib/utils'
import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

// ===== GlassCard =====
interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  active?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
  rounded?: string
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-8', none: '' }

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover, active, padding = 'md', rounded = 'rounded-xl', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'glass',
        hover && 'glass-hover',
        active && 'glass-active',
        paddingMap[padding],
        rounded,
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
    <span className={cn('px-2.5 py-0.5 rounded-full caption font-medium', badgeColors[variant], className)}>
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
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
}

export function StatCard({ icon, label, value, sub, color = 'bg-accent-blue', glow, className, trend, trendValue }: StatCardProps) {
  return (
    <GlassCard hover className={cn('stagger-item', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className={cn('p-2 rounded-xl', color, glow)}>
          <span className="text-white">{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {trend && trend !== 'flat' && (
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded-md',
            trend === 'up' ? 'text-accent-success bg-accent-success/10' : 'text-accent-danger bg-accent-danger/10'
          )}>
            {trend === 'up' ? '↑' : '↓'}{trendValue}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </GlassCard>
  )
}

