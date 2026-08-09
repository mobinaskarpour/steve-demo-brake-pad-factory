import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export function Panel({
  children,
  className,
  padding = true,
  accent = false,
}: {
  children: ReactNode
  className?: string
  padding?: boolean
  accent?: boolean
}) {
  return (
    <section className={cn(accent ? 'steve-card-accent' : 'steve-card', padding && 'p-5', className)}>
      {children}
    </section>
  )
}

export function PanelHeader({
  title,
  subtitle,
  action,
  gold = false,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  gold?: boolean
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className={cn('text-[14px] font-medium tracking-tight', gold ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink)]')}>
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[12px] text-[var(--color-ink-faint)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
