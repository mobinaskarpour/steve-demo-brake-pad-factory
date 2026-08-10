import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, CalendarDays, CheckSquare, ChevronDown, House, Map as MapIcon, MessageSquare, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { appConfig } from '../../config'
import { cn } from '../../lib/utils'
import { useLocale } from '../../i18n/LocaleProvider'
import { BrandLockup } from '../../brand/BrandLockup'
import { getEnConfig } from '../../i18n/enContent'

const items = [
  { to: '/', navKey: 'nav.today', icon: House, end: true },
  { to: '/plan', navKey: 'nav.plan', icon: CalendarDays },
  { to: '/intelligence', navKey: 'nav.intelligence', icon: BarChart3 },
  { to: '/work', navKey: 'nav.work', icon: CheckSquare },
  { to: '/map', navKey: 'nav.map', icon: MapIcon },
  { to: '/agents', navKey: 'nav.agents', icon: UserRound },
  { to: '/communication', navKey: 'nav.communication', icon: MessageSquare },
] as const

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const brand = locale === 'en' ? enCfg.brandName || appConfig.brandName : appConfig.brandName
  const shortBrand = locale === 'en' ? enCfg.shortName || appConfig.shortName : appConfig.shortName

  return (
    <aside className="steve-sidebar flex h-full shrink-0 flex-col">
      <div className="px-5 pt-7 pb-6">
        <button
          type="button"
          className="w-full"
          aria-label={`${appConfig.productName} — ${shortBrand}`}
          onClick={() => {
            navigate('/')
            onNavigate?.()
          }}
        >
          <BrandLockup product={appConfig.productName} name={shortBrand} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} onClick={onNavigate} className={({ isActive }) => cn('steve-nav-item', isActive && 'is-active')}>
              <Icon size={16} strokeWidth={1.5} />
              <span>{t(item.navKey)}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-[var(--color-steve-border-soft)] px-4 py-4">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-start hover:bg-[var(--steve-hover)]"
          onClick={() => {
            navigate('/agents')
            onNavigate?.()
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--color-steve-green-dim)] text-[11px] text-[var(--color-steve-text-muted)]">{locale === 'en' ? appConfig.user.initialsEn || 'AG' : appConfig.user.initials}</div>
          <div className="min-w-0 flex-1 truncate text-[12px] text-[var(--color-steve-text-muted)]">{brand}</div>
          <ChevronDown size={14} className="text-[var(--color-steve-text-faint)]" />
        </button>
      </div>
    </aside>
  )
}
