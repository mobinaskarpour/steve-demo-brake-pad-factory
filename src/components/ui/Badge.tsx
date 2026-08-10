import { cn } from '../../lib/utils'
import type { StatusTone } from '../../domain/types'
import type { ReactNode } from 'react'

const tones: Record<StatusTone, string> = {
  success: 'text-[var(--color-green-bright)]',
  warning: 'text-[var(--color-gold-soft)]',
  danger: 'text-[var(--color-danger)]',
  info: 'text-[var(--color-info)]',
  neutral: 'text-[var(--color-ink-soft)]',
}

const dots: Record<StatusTone, string> = {
  success: 'bg-[var(--color-green-bright)]',
  warning: 'bg-[var(--color-gold-soft)]',
  danger: 'bg-[var(--color-danger)]',
  info: 'bg-[var(--color-info)]',
  neutral: 'bg-[var(--color-ink-faint)]',
}

/**
 * Status mark — colored dot + plain text.
 * Never a capsule/badge/pill.
 */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: StatusTone
  className?: string
}) {
  return (
    <span className={cn('steve-status inline-flex items-center gap-1.5 text-[12px]', tones[tone], className)}>
      <span className={cn('steve-status-dot', dots[tone])} aria-hidden />
      <span>{children}</span>
    </span>
  )
}
