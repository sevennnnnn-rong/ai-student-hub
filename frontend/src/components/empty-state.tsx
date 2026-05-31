'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center glass rounded-xl p-8">
      <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mb-4 glow-sm">
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      {action}
    </div>
  )
}
