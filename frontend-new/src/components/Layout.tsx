import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ArrowUp, ArrowLeft, ArrowRight, Search, User, Maximize2 } from 'lucide-react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import TitleBar from './TitleBar'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useFocusMode } from '../hooks/useFocusMode'
import { cn } from '../lib/utils'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLDivElement>(null)
  const { focusMode, toggle: toggleFocus } = useFocusMode()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 300)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useKeyboardShortcuts()

  // Track navigation history for back/forward buttons
  useEffect(() => {
    setCanGoBack(window.history.length > 1)
    setCanGoForward(false)
  }, [location.pathname])

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
    <div className="app-layout">
      {/* Custom Title Bar (desktop only, no native decorations) */}
      <TitleBar />

      {/* Content row: sidebar + main */}
      <div className="app-body">
        {/* Desktop Sidebar */}
        <div className={cn('app-sidebar-wrapper', focusMode && 'sidebar-hidden')}>
          <Sidebar />
        </div>

        <div className="app-main">
        {/* Desktop Header */}
        <header className="app-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              disabled={!canGoBack}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                'hover:bg-white/[0.06]',
                canGoBack ? 'text-text-secondary hover:text-text-primary' : 'text-text-muted/40 cursor-not-allowed'
              )}
              aria-label="后退"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={!canGoForward}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                'hover:bg-white/[0.06]',
                canGoForward ? 'text-text-secondary hover:text-text-primary' : 'text-text-muted/40 cursor-not-allowed'
              )}
              aria-label="前进"
            >
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
                window.dispatchEvent(event)
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'bg-white/[0.04] hover:bg-white/[0.07]',
                'border border-white/[0.06] hover:border-white/[0.10]',
                'transition-all text-sm text-text-muted'
              )}
            >
              <Search size={14} />
              <span>搜索任务、笔记...</span>
              <kbd className="ml-auto text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all"
              aria-label="用户"
            >
              <User size={17} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          ref={mainRef}
          className="app-content"
        >
          <Outlet />
        </main>
      </div>
      </div>

      {/* Mobile Bottom Nav */}
      {!focusMode && <MobileNav />}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn(
            'fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40',
            'w-10 h-10 rounded-full',
            'bg-bg-secondary/90 backdrop-blur-sm',
            'border border-white/[0.06]',
            'flex items-center justify-center',
            'text-text-muted hover:text-text-primary',
            'transition-all animate-scale-in',
            'hover:bg-bg-tertiary'
          )}
          title="回到顶部"
        >
          <ArrowUp size={16} />
        </button>
      )}

      {/* Exit Focus Mode Button */}
      {focusMode && (
        <button
          onClick={toggleFocus}
          className={cn(
            'fixed top-12 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-2 px-4 py-2 rounded-full',
            'bg-accent/90 backdrop-blur-sm',
            'text-white text-sm font-medium',
            'hover:bg-accent',
            'transition-all animate-scale-in',
            'shadow-lg'
          )}
          title="退出专注模式"
        >
          <Maximize2 size={14} />
          <span>退出专注</span>
        </button>
      )}
    </div>
  )
}
