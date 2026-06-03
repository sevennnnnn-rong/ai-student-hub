import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ArrowUp, Search, Settings } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useFocusMode } from '../hooks/useFocusMode'
import { cn } from '../lib/utils'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
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
      <div className={cn('hidden md:block shrink-0', focusMode && 'sidebar-hidden')}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/[0.06] bg-bg-primary/80 backdrop-blur-xl z-30">
          <h1 className="heading-md gradient-text">气象台Hub</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
                window.dispatchEvent(event)
              }}
              className="btn-icon-sm rounded-lg text-text-muted hover:text-text-primary"
              aria-label="搜索"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="btn-icon-sm rounded-lg text-text-muted hover:text-text-primary"
              aria-label="设置"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Area — window-like inner padding */}
        <main
          ref={mainRef}
          className={cn(
            'flex-1 overflow-y-auto',
            'p-4 md:p-6 lg:p-8',
            'pb-24 md:pb-8'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav (floating pill) */}
      {!focusMode && <MobileNav />}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn(
            'fixed bottom-28 right-4 md:bottom-8 md:right-8 z-40',
            'w-10 h-10 rounded-full',
            'glass glass-hover',
            'flex items-center justify-center',
            'text-text-muted hover:text-text-primary',
            'transition-all animate-scale-in'
          )}
          title="回到顶部"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  )
}
