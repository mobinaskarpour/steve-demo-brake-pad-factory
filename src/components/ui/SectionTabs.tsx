import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-elevated)] px-6 py-12 text-center">
      <div className="text-[14px] font-medium text-[var(--color-ink)]">{title}</div>
      {description ? <p className="mt-2 max-w-md text-[13px] text-[var(--color-ink-soft)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

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
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-full px-3.5 py-2 text-[13px] transition',
            value === tab.id
              ? 'bg-[var(--color-green-dim)] text-[var(--color-green-bright)]'
              : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
