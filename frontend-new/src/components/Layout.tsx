import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ArrowUp } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useFocusMode } from '../hooks/useFocusMode'
import { cn } from '../lib/utils'

export default function Layout() {
  const location = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)
  const { focusMode } = useFocusMode()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 300)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useKeyboardShortcuts()

  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }, [location.pathname])

  return (
    <div className="flex h-full w-full bg-bg-primary relative z-10">
      {/* Desktop Sidebar */}
      <div className={cn('hidden md:block', focusMode && 'sidebar-hidden')}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 h-full overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      {!focusMode && <MobileNav />}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 w-10 h-10 rounded-xl glass glass-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-all animate-scale-in"
          title="回到顶部"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  )
}
