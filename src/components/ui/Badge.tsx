import { cn } from '../../lib/utils'
import type { StatusTone } from '../../domain/types'
import type { ReactNode } from 'react'

const tones: Record<StatusTone, string> = {
  success: 'border-[var(--color-green-border)] text-[var(--color-green-bright)] bg-[var(--color-green-dim)]',
  warning: 'border-[#5a3d16] text-[var(--color-gold-soft)] bg-[#2a1f10]',
  danger: 'border-[#5a2a24] text-[var(--color-danger)] bg-[#2a1513]',
  info: 'border-[#2f3f52] text-[var(--color-info)] bg-[#151b22]',
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
