import { percent } from '../../lib/format'

export type KpiItem = { id: string; label: string; value: string; delta: number; hint: string; unit?: string }

export function KpiStat({ item }: { item: KpiItem; compact?: boolean }) {
  const up = item.delta >= 0
  return (
    <div className="steve-card p-4">
      <div className="text-[11px] tracking-wide text-[var(--color-gold)]">{item.label}</div>
      <div className="mt-2 text-[22px] font-light tracking-tight text-[var(--color-ink)]">{item.value}</div>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        <span className={up ? 'text-[var(--color-green-bright)]' : 'text-[var(--color-danger)]'}>{percent(item.delta)}</span>
        <span className="text-[var(--color-ink-faint)]">{item.hint}</span>
      </div>
    </div>
  )
}
