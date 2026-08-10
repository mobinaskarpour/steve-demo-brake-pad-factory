import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Ltr } from '../../i18n/LocaleProvider'

/**
 * Subtle inline record reference — IDs stay authoritative in prose,
 * never as background pills/chips.
 */
export function InlineRecordLink({
  to,
  children,
  className,
  ltr,
}: {
  to: string
  children: ReactNode
  className?: string
  /** Force LTR for Latin business IDs */
  ltr?: boolean
}) {
  const body = ltr ? <Ltr>{children}</Ltr> : children
  return (
    <Link to={to} className={cn('steve-inline-link', className)}>
      {body}
    </Link>
  )
}
