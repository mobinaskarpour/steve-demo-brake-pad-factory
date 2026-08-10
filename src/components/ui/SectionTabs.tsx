import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--steve-radius-md,10px)] border border-dashed border-[var(--color-line)] bg-[var(--color-elevated)] px-6 py-12 text-center">
      <div className="text-[14px] font-medium text-[var(--color-ink)]">{title}</div>
      {description ? <p className="mt-2 max-w-md text-[13px] text-[var(--color-ink-soft)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

/** Underline tabs — never capsule segments. */
export function SectionTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="steve-underline-tabs flex flex-wrap gap-5 border-b border-[var(--color-line-soft,var(--color-steve-border))]" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'steve-underline-tab pb-2 text-[13px] transition',
            value === tab.id
              ? 'is-active border-b-2 border-[var(--color-green-bright,var(--color-steve-green-bright))] text-[var(--color-ink,var(--color-steve-text))]'
              : 'border-b-2 border-transparent text-[var(--color-ink-faint,var(--color-steve-text-faint))] hover:text-[var(--color-ink-soft,var(--color-steve-text-muted))]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
