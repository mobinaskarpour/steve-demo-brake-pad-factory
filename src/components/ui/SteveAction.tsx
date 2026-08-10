import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

type Tone = 'primary' | 'secondary'

/**
 * Restrained Steve action — text/link weight, not a pill/chip row.
 */
export function SteveActionButton({
  tone = 'secondary',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <button type="button" className={cn('steve-action', tone === 'primary' && 'is-primary', className)} {...rest}>
      {children}
    </button>
  )
}

export function SteveActionLink({
  to,
  tone = 'secondary',
  className,
  children,
}: {
  to: string
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={cn('steve-action', tone === 'primary' && 'is-primary', className)}>
      {children}
    </Link>
  )
}
