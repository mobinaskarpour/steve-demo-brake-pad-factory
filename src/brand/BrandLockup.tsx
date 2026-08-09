import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'

/**
 * Product mark plus a caller-supplied, already-localized business name.
 * Pass `name` for the standard two-line lockup, or `children` to render custom
 * secondary content beneath the product word.
 */
export function BrandLockup({
  product = 'STEVE',
  name,
  size = 26,
  className = '',
  children,
}: {
  product?: string
  name?: string
  size?: number
  className?: string
  children?: ReactNode
}) {
  const sub = children ?? (name ? <span className="steve-brand-sub">{name}</span> : null)
  return (
    <span className={`steve-brand-lockup ${className}`}>
      <BrandMark size={size} />
      <span className="min-w-0">
        <span className="steve-brand-name">{product}</span>
        {sub}
      </span>
    </span>
  )
}
