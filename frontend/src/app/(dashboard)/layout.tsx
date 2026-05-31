'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { ParticleBg } from '@/components/particle-bg'
import { useKeyboardShortcuts } from '@/lib/keyboard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen relative">
      <ParticleBg />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto pt-16 p-4 sm:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
