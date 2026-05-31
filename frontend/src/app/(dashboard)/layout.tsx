'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { useKeyboardShortcuts } from '@/lib/keyboard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
