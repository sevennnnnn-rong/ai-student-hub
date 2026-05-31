'use client'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`} />
    </div>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <LoadingSkeleton className="w-5 h-5 rounded-full" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </div>
  )
}
