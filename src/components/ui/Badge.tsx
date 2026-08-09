import { cn } from '../../lib/utils'
import type { StatusTone } from '../../domain/types'
import type { ReactNode } from 'react'

const tones: Record<StatusTone, string> = {
  success: 'border-[var(--color-green-border)] text-[var(--color-green-bright)] bg-[var(--color-green-dim)]',
  warning: 'border-[var(--notice-warning-border)] text-[var(--color-gold-soft)] bg-[var(--notice-warning-bg)]',
  danger: 'border-[var(--notice-danger-border)] text-[var(--color-danger)] bg-[var(--notice-danger-bg)]',
  info: 'border-[var(--notice-info-border)] text-[var(--color-info)] bg-[var(--notice-info-bg)]',
  neutral: 'border-[var(--color-line)] text-[var(--color-ink-soft)] bg-[var(--color-elevated)]',
}

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
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px]', tones[tone], className)}>
      {children}
    </span>
  )
}
