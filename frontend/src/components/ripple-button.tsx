'use client'

import { useCallback, useRef, useEffect } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RippleButton({ className, children, onClick, disabled, ...props }: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current.clear()
    }
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.setAttribute('aria-hidden', 'true')
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`

      button.appendChild(ripple)

      const timeoutId = setTimeout(() => {
        ripple.remove()
        timeoutsRef.current.delete(timeoutId)
      }, 600)
      timeoutsRef.current.add(timeoutId)

      onClick?.(e)
    },
    [onClick, disabled]
  )

  return (
    <Button
      ref={buttonRef}
      className={cn('ripple-container', className)}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}
