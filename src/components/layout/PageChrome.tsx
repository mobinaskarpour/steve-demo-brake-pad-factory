import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function PageHero({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-light tracking-tight text-[var(--color-ink)] md:text-[30px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] leading-snug text-[var(--color-gold)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

/** Underline segment control — replaces capsule segmented UI. */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="steve-underline-tabs flex flex-wrap gap-5 border-b border-[var(--color-line-soft,var(--color-steve-border))]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'pb-2 text-[12.5px] transition',
            value === o.id
              ? 'border-b-2 border-[var(--color-green-bright,var(--color-steve-green-bright))] text-[var(--color-ink,var(--color-steve-text))]'
              : 'border-b-2 border-transparent text-[var(--color-ink-faint,var(--color-steve-text-faint))] hover:text-[var(--color-ink-soft,var(--color-steve-text-muted))]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SoftTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-5 border-b border-[var(--color-line-soft)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={
            value === t.id
              ? 'border-b-2 border-[var(--color-green-bright)] pb-2 text-[12.5px] text-[var(--color-ink)]'
              : 'border-b-2 border-transparent pb-2 text-[12.5px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]'
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
