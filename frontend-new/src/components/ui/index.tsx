import { cn } from '../../lib/utils'
import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

// ===== GlassCard (Liquid Glass variant) =====
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

// ===== Badge (Liquid Glass pill) =====
interface BadgeProps {
  variant?: 'default' | 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'pink'
  children: ReactNode
  className?: string
}

const badgeColors = {
  default: 'bg-white/8 text-text-secondary border border-white/[0.06]',
  blue: 'bg-accent/12 text-accent border border-accent/20',
  purple: 'bg-accent-purple/12 text-accent-purple border border-accent-purple/20',
  amber: 'bg-accent-amber/12 text-accent-amber border border-accent-amber/20',
  green: 'bg-accent-success/12 text-accent-success border border-accent-success/20',
  red: 'bg-accent-danger/12 text-accent-danger border border-accent-danger/20',
  pink: 'bg-accent-pink/12 text-accent-pink border border-accent-pink/20',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide', badgeColors[variant], className)}>
      {children}
    </span>
  )
}

// ===== StatCard (Liquid Glass) =====
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

export function StatCard({ icon, label, value, sub, color = 'bg-accent', glow, className, trend, trendValue }: StatCardProps) {
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
