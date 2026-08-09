import type { ReactNode } from 'react'

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
        <h1 className="text-[28px] font-light tracking-tight text-[var(--color-ink)] md:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[14px] text-[var(--color-gold)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

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
    <div className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            value === o.id
              ? 'rounded-full bg-[var(--color-green-dim)] px-3.5 py-1.5 text-[12px] text-[var(--color-green-bright)]'
              : 'rounded-full px-3.5 py-1.5 text-[12px] text-[var(--color-ink-soft)]'
          }
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
              ? 'border-b-2 border-[var(--color-green-bright)] pb-2.5 text-[13px] text-[var(--color-ink)]'
              : 'pb-2.5 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]'
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
