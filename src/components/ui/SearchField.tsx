import { Search } from 'lucide-react'

export function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="relative block w-full max-w-sm">
      <Search size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-ink-faint)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-elevated)] pr-10 pl-3 text-[13px] outline-none focus:border-[var(--color-green-border)]"
      />
    </label>
  )
}
