import type { Priority, StatusTone } from '../domain/types'

export const priorityLabel: Record<Priority, string> = {
  critical: 'بحرانی',
  high: 'بالا',
  medium: 'متوسط',
  low: 'پایین',
}

export const toneClass: Record<StatusTone, string> = {
  success: 'bg-[var(--color-green-dim)] text-[var(--color-green-bright)]',
  warning: 'bg-[#2a1f10] text-[var(--color-gold-soft)]',
  danger: 'bg-[#2a1513] text-[var(--color-danger)]',
  info: 'bg-[#151b22] text-[var(--color-info)]',
  neutral: 'bg-[var(--color-elevated)] text-[var(--color-ink-soft)]',
}

export const priorityTone: Record<Priority, StatusTone> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
}
