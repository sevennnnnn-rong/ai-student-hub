'use client'

import { useCallback, useRef } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RippleButton({ className, children, onClick, ...props }: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`

      button.appendChild(ripple)

      setTimeout(() => ripple.remove(), 600)

      onClick?.(e)
    },
    [onClick]
  )

  return (
    <Button
      ref={buttonRef}
      className={cn('ripple-container', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  )
}
