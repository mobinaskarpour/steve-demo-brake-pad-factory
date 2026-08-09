import { clsx, type ClassValue } from 'clsx'
import dayjs from 'dayjs'
import jalaliday from 'jalaliday'

dayjs.extend(jalaliday)

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return toPersianDigits(
    new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 0,
      ...options,
    }).format(value),
  )
}

export function formatCurrency(value: number, unit = 'تومان'): string {
  return `${formatNumber(value)} ${unit}`
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${formatNumber(value / 1_000_000_000, { maximumFractionDigits: 1 })} میلیارد`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, { maximumFractionDigits: 1 })} میلیون`
  }
  if (Math.abs(value) >= 1_000) {
    return `${formatNumber(value / 1_000, { maximumFractionDigits: 1 })} هزار`
  }
  return formatNumber(value)
}

export function formatJalali(date?: string | Date, withTime = false): string {
  const d = dayjs(date || new Date()).calendar('jalali')
  return toPersianDigits(d.format(withTime ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD'))
}

export function percent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return toPersianDigits(`${sign}${value.toFixed(1)}٪`)
}
