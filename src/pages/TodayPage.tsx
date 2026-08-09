import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Plane,
  Users,
  Volume2,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { VisualMonitoring } from '../components/ui/VisualMonitoring'
import { Ltr, useLocale } from '../i18n/LocaleProvider'
import { getEnBrief } from '../i18n/enContent'

const icons = [AlertTriangle, ClipboardCheck, Plane, Users]

const CAL_GROUPS = [
  { fa: 'امروز', key: 'time.today' as const },
  { fa: 'فردا', key: 'time.tomorrow' as const },
  { fa: 'آتی', key: 'time.upcoming' as const },
]

export function TodayPage() {
  const { state, dispatch, openAlerts, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc } = useLocale()
  const [briefOpen, setBriefOpen] = useState(true)
  const [view, setView] = useState<'brief' | 'dashboard' | 'compare'>('brief')
  const Chevron = isRtl ? ChevronLeft : ChevronRight

  const pendingPurchases = state.purchases.filter((p) => p.status === 'pending').length
  const pendingTx = state.transactions.filter((t) => t.status === 'pending').length
  const primaryUnit = state.units.find((u) => u.id !== 'unit-holding') || state.units[0]
  const dangerInv = state.inventory.find((i) => i.status === 'danger') || state.inventory[0]
  const firstEmp = state.employees[0]
  const focusWork = state.workItems.find((w) => w.priority === 'critical' || w.priority === 'high') || state.workItems[0]

  const brief = useMemo(() => {
    if (locale === 'fa') return state.brief
    const en = getEnBrief()
    return {
      greeting: (en.greeting as string) || state.brief.greeting,
      dateLabel: (en.dateLabel as string) || state.brief.dateLabel,
      paragraphs: (en.paragraphs as string[]) || state.brief.paragraphs,
      lines: (en.lines as { label: string; text: string }[]) || state.brief.lines,
    }
  }, [locale, state.brief])

  useEffect(() => {
    if (!state.toast) return
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800)
    return () => window.clearTimeout(timer)
  }, [state.toast, dispatch])

  if (view === 'compare') {
    return (
      <div className="steve-page space-y-4">
        <HeaderNav view={view} setView={setView} />
        <h1 className="steve-greeting">{t('today.compareTitle')}</h1>
        <p className="steve-asof">{t('today.compareSub')}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {state.units
            .filter((u) => u.id !== 'unit-holding')
            .slice(0, 8)
            .map((u) => (
              <Link key={u.id} to={recordPath('unit', u.id)} className="steve-surface p-4 transition hover:border-[var(--color-steve-brief-border)]">
                <div className="text-[13px] text-[var(--color-steve-gold)]">{loc(u.name, 'units', u.id, 'name')}</div>
                <div className="mt-2 text-[22px] font-light" dir="ltr">
                  {loc(u.kpiValue, 'units', u.id, 'kpiValue')}
                </div>
                <div className="mt-1 text-[12px] text-[var(--color-steve-text-faint)]">{loc(u.kpiLabel, 'units', u.id, 'kpiLabel')}</div>
                {u.alert ? (
                  <div className="mt-3 text-[12px] text-[var(--color-steve-danger)]">{loc(u.alert, 'units', u.id, 'alert')}</div>
                ) : (
                  <div className="mt-3 text-[12px] text-[var(--color-steve-green-bright)]">{t('today.noCritical')}</div>
                )}
              </Link>
            ))}
        </div>
      </div>
    )
  }

  if (view === 'dashboard') {
    return (
      <div className="steve-page space-y-5">
        <HeaderNav view={view} setView={setView} />
        <h1 className="steve-greeting">{t('today.myDashboard')}</h1>
        <p className="steve-asof">{t('today.compareSub')}</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: t('today.communications'),
              body: t('today.unreadMessages', { count: state.threads.reduce((n, th) => n + th.unread, 0) }),
              to: '/communication',
            },
            {
              title: t('today.pendingApprovals'),
              body: t('today.approvalsQueued', { count: pendingPurchases + pendingTx }),
              to: '/work',
            },
            {
              title: firstEmp ? loc(firstEmp.role, 'employees', firstEmp.id, 'role') : t('today.staff'),
              body: firstEmp
                ? `${loc(firstEmp.name, 'employees', firstEmp.id, 'name')} · ${t('today.attendance', { rate: firstEmp.attendanceRate })}`
                : t('today.noData'),
              to: firstEmp ? recordPath('employee', firstEmp.id) : '/work',
            },
            {
              title: t('today.criticalItems'),
              body: t('today.itemsNeedAttention', { count: state.inventory.filter((i) => i.status !== 'success').length }),
              to: dangerInv ? recordPath('inventory', dangerInv.id) : '/work',
            },
            {
              title: primaryUnit ? loc(primaryUnit.name, 'units', primaryUnit.id, 'name') : t('today.primaryUnit'),
              body: primaryUnit
                ? `${loc(primaryUnit.kpiLabel, 'units', primaryUnit.id, 'kpiLabel')}: ${loc(primaryUnit.kpiValue, 'units', primaryUnit.id, 'kpiValue')}`
                : t('today.noData'),
              to: primaryUnit ? recordPath('unit', primaryUnit.id) : '/map',
            },
            {
              title: t('today.priorityWork'),
              body: focusWork ? loc(focusWork.title, 'workItems', focusWork.id, 'title') : t('today.noOpenWork'),
              to: focusWork ? `/work/${focusWork.id}` : '/work',
            },
          ].map((c) => (
            <Link key={c.title} to={c.to} className="steve-surface p-5 transition hover:border-[var(--color-steve-brief-border)]">
              <div className="text-[13px] text-[var(--color-steve-gold)]">{c.title}</div>
              <div className="mt-3 text-[14px] leading-7">{c.body}</div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="steve-page space-y-4">
      {state.toast ? (
        <div className="fixed top-4 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-[var(--color-steve-brief-border)] bg-[var(--color-steve-green-dim)] px-4 py-2 text-[12px] text-[var(--color-steve-green-bright)] shadow-lg">
          {state.toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="steve-greeting">{brief.greeting}</h1>
          <p className="steve-asof">
            {brief.dateLabel} • {t('today.asOf')}
          </p>
        </div>
        <HeaderNav view={view} setView={setView} />
      </div>

      {briefOpen ? (
        <section className="steve-brief px-5 py-5 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-steve-text)]">
              {t('today.brief')}
              <Volume2 size={14} strokeWidth={1.6} className="text-[var(--color-steve-text-muted)]" />
            </div>
            <button type="button" className="text-[var(--color-steve-text-faint)]" aria-label={t('today.closeBrief')} onClick={() => setBriefOpen(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="max-w-[980px] space-y-3 text-[14px] leading-[1.85]">
            {brief.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-5 space-y-1.5 text-[13px] leading-7">
            {brief.lines.map((line) => (
              <div key={line.label}>
                <span className="text-[var(--color-steve-green-lead)]">{line.label} — </span>
                <span className="text-[var(--color-steve-text-muted)]">{line.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.purchases
              .filter((p) => p.status === 'pending')
              .slice(0, 1)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="rounded-full border border-[var(--color-steve-brief-border)] px-3 py-1.5 text-[11px] text-[var(--color-steve-green-bright)]"
                  onClick={() => navigate(recordPath('purchase', p.id))}
                >
                  {t('today.openId', { id: '' })}
                  <Ltr>{p.id}</Ltr>
                </button>
              ))}
            {state.transactions
              .filter((tr) => tr.status === 'pending')
              .slice(0, 1)
              .map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  className="rounded-full border border-[var(--color-steve-brief-border)] px-3 py-1.5 text-[11px] text-[var(--color-steve-green-bright)]"
                  onClick={() => navigate(recordPath('transaction', tr.id))}
                >
                  {t('today.openId', { id: '' })}
                  <Ltr>{tr.id}</Ltr>
                </button>
              ))}
            <button
              type="button"
              className="rounded-full border border-[var(--color-steve-border)] px-3 py-1.5 text-[11px] text-[var(--color-steve-text-muted)]"
              onClick={() => navigate('/intelligence')}
            >
              {t('today.viewIntelligence')}
            </button>
          </div>
        </section>
      ) : (
        <button type="button" className="text-[12px] text-[var(--color-steve-green-lead)]" onClick={() => setBriefOpen(true)}>
          {t('today.showBrief')}
        </button>
      )}

      <div className="steve-live">
        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-steve-green-bright)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-steve-green-bright)]" />
          {t('today.live')}
        </span>
        <div className="min-w-0 flex-1 truncate text-[var(--color-steve-text-muted)]">
          {state.activityFeed.map((a) => loc(a.text, 'activityFeed', a.id, 'text')).join('  •  ')}
        </div>
        <button type="button" className="shrink-0 text-[11px] text-[var(--color-steve-gold)]" onClick={() => navigate('/work')}>
          {t('today.workQueue')}
        </button>
      </div>

      {state.visualFeeds?.length ? (
        <VisualMonitoring feeds={state.visualFeeds.slice(0, 3)} title={t('today.visualTitle')} compact subtitle={t('today.asOf')} />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.45fr_0.95fr]">
        <section className="min-w-0 pt-1">
          <div className="mb-1 flex items-center justify-between px-1">
            <div className="text-[14px] text-[var(--color-steve-text)]">{t('today.needsYou')}</div>
            <div className="text-[11px] text-[var(--color-steve-text-faint)]">{t('today.openCount', { count: openAlerts.length })}</div>
          </div>
          <div>
            {openAlerts.map((item, idx) => {
              const Icon = icons[idx % icons.length]
              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-3 border-b border-[var(--color-steve-border-soft)] px-1 py-2.5 text-start last:border-b-0 hover:bg-[rgba(255,255,255,0.015)]"
                  onClick={() => navigate(recordPath(item.recordType, item.recordId))}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      item.priority === 'critical'
                        ? 'bg-[#3a1a16] text-[var(--color-steve-danger)]'
                        : 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-green-bright)]',
                    )}
                  >
                    <Icon size={14} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#221f18] px-2 py-0.5 text-[11px] text-[var(--color-steve-gold)]">
                        {loc(item.type, 'alerts', item.id, 'type')}
                      </span>
                      <span className="text-[13px] text-[var(--color-steve-text)]">{loc(item.title, 'alerts', item.id, 'title')}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--color-steve-gold)]">{t('time.actionBy', { time: item.time })}</div>
                  </div>
                  <Chevron size={15} className="text-[var(--color-steve-text-faint)]" />
                </button>
              )
            })}
            {!openAlerts.length ? (
              <div className="rounded-xl border border-[var(--color-steve-border)] px-4 py-6 text-[13px] text-[var(--color-steve-text-muted)]">
                {t('today.noOpenItems')}
                <button type="button" className="mt-2 block text-[var(--color-steve-gold)]" onClick={() => navigate('/work')}>
                  {t('today.viewWork')}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="steve-surface px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] text-[var(--color-steve-text)]">{t('today.schedule')}</div>
            <button type="button" className="text-[11px] text-[var(--color-steve-gold)]" onClick={() => navigate('/plan')}>
              {t('today.openPlan')}
            </button>
          </div>
          <div className="relative space-y-3">
            <div className="absolute top-1 bottom-2 inset-inline-end-[7px] w-px bg-[var(--color-steve-green-lead)]/40" />
            {CAL_GROUPS.map((group) => {
              const list = state.calendarEvents.filter((e) => e.date === group.fa)
              if (!list.length) return null
              return (
                <div key={group.fa}>
                  <div className="mb-2 text-[11px] text-[var(--color-steve-green-lead)]">{t(group.key)}</div>
                  <div className="space-y-3">
                    {list.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className="relative flex w-full gap-3 pe-2 text-start"
                        onClick={() => navigate(e.workId ? `/work/${e.workId}` : '/plan')}
                      >
                        <div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-steve-green-bright)]" />
                        <div>
                          <div className="text-[12px] text-[var(--color-steve-gold)]" dir="ltr">
                            {e.time}
                          </div>
                          <div className="text-[13px] text-[var(--color-steve-text-muted)]">{loc(e.title, 'calendarEvents', e.id, 'title')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            className="mt-5 rounded-full border border-[var(--color-steve-gold)] px-3 py-1.5 text-[11px] text-[var(--color-steve-gold)]"
            onClick={() => navigate('/plan')}
          >
            {t('actions.prepWindow')}
          </button>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Pulse
          title={primaryUnit ? loc(primaryUnit.kpiLabel, 'units', primaryUnit.id, 'kpiLabel') : t('today.primaryUnit')}
          value={primaryUnit ? loc(primaryUnit.kpiValue, 'units', primaryUnit.id, 'kpiValue') : '—'}
          meta={primaryUnit ? loc(primaryUnit.name, 'units', primaryUnit.id, 'name') : ''}
          to={primaryUnit ? recordPath('unit', primaryUnit.id) : '/map'}
        />
        <Pulse title={t('today.pendingApprovals')} value={String(pendingPurchases + pendingTx)} meta={t('today.purchaseFinance')} to="/work" />
        <Pulse
          title={t('today.criticalAlerts')}
          value={String(state.inventory.filter((i) => i.status === 'danger').length || openAlerts.filter((a) => a.priority === 'critical').length)}
          meta={dangerInv?.sku?.slice(0, 28) || t('today.needsYou')}
          to={dangerInv ? recordPath('inventory', dangerInv.id) : '/'}
        />
      </div>
    </div>
  )
}

function Pulse({ title, value, meta, to }: { title: string; value: string; meta: string; to: string }) {
  return (
    <Link to={to} className="steve-surface px-4 py-3 transition hover:border-[var(--color-steve-brief-border)]">
      <div className="text-[11px] text-[var(--color-steve-text-faint)]">{title}</div>
      <div className="mt-1 text-[20px] font-light" dir="ltr">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-[var(--color-steve-gold)]">{meta}</div>
    </Link>
  )
}

function HeaderNav({ view, setView }: { view: string; setView: (v: 'brief' | 'dashboard' | 'compare') => void }) {
  const { t } = useTranslation()
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-1">
      {(
        [
          ['brief', 'nav.today'],
          ['dashboard', 'today.myDashboard'],
          ['compare', 'today.compareUnits'],
        ] as const
      ).map(([id, labelKey]) => (
        <button
          key={id}
          type="button"
          onClick={() => setView(id)}
          className={cn(
            'rounded-full px-3 py-1.5 text-[12px]',
            view === id ? 'bg-[var(--color-steve-green-active)] text-[var(--color-steve-text-muted)]' : 'text-[var(--color-steve-text-faint)]',
          )}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
