import { cn } from '../../lib/utils'

// ===== Spinner =====
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const spinnerSizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

export function Spinner({ size = 'md', color = 'border-accent-blue', className }: SpinnerProps) {
  return (
    <div className={cn('border-2 border-current border-t-transparent rounded-full animate-spin', spinnerSizes[size], color, className)} />
  )
}

// ===== Full Page Loading =====
export function FullPageLoading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in">
      <Spinner size="lg" />
      <p className="text-text-muted text-sm mt-4">{text}</p>
    </div>
  )
}

// ===== Skeleton =====
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  const variantClass = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }

  return (
    <div
      className={cn('skeleton', variantClass[variant], className)}
      style={{ width, height }}
    />
  )
}

// ===== Card Skeleton =====
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-2xl p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton variant="text" width="60%" className="mb-2" />
      <Skeleton variant="text" width="80%" />
    </div>
  )
}

// ===== List Skeleton =====
export function ListSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
          <Skeleton variant="circular" width={20} height={20} />
          <div className="flex-1">
            <Skeleton variant="text" width="70%" className="mb-2" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ===== Dashboard Skeleton =====
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton variant="text" width="120px" height={32} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
