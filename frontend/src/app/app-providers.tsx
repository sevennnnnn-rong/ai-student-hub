'use client'

import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { initAppLifecycle, initCapacitorConfig } from '@/lib/capacitor'

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAppLifecycle()
    initCapacitorConfig()
  }, [])

  return <ErrorBoundary>{children}</ErrorBoundary>
}
