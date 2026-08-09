import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  GripVertical,
  Plane,
  Plus,
  Settings2,
  Users,
  Volume2,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { VisualMonitoring } from '../components/ui/VisualMonitoring'
import { useLocale } from '../i18n/LocaleProvider'
import { getEnBrief } from '../i18n/enContent'

const icons = [AlertTriangle, ClipboardCheck, Plane, Users]

const CAL_GROUPS = [
  { match: ['امروز', 'Today'], key: 'time.today' as const },
  { match: ['فردا', 'Tomorrow'], key: 'time.tomorrow' as const },
  { match: ['آتی', 'Upcoming'], key: 'time.upcoming' as const },
]

const DASH_KEY = 'steve.myDashboard.widgets'

type WidgetId =
  | 'communications'
  | 'receivables'
  | 'people'
  | 'purchases'
  | 'inventory'
  | 'cameras'
  | 'unitPulse'
  | 'needsPin'

const DEFAULT_WIDGETS: WidgetId[] = ['communications', 'receivables', 'people', 'purchases', 'inventory', 'unitPulse']

function readWidgets(): WidgetId[] {
  try {
    const raw = localStorage.getItem(DASH_KEY)
    if (!raw) return DEFAULT_WIDGETS
    const parsed = JSON.parse(raw) as WidgetId[]
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_WIDGETS
  } catch {
    return DEFAULT_WIDGETS
  }
}

function writeWidgets(ids: WidgetId[]) {
  localStorage.setItem(DASH_KEY, JSON.stringify(ids))
}

/** Inline deep-link helper — calm prose, selective interactive phrases */
function BriefProse({
  text,
  links,
}: {
  text: string
  links: { match: string; to: string }[]
}) {
  const navigate = useNavigate()
  const parts: ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length) {
    let earliest = -1
    let hit: { match: string; to: string } | null = null
    for (const link of links) {
      const i = remaining.indexOf(link.match)
      if (i >= 0 && (earliest < 0 || i < earliest)) {
        earliest = i
        hit = link
      }
    }
    if (!hit || earliest < 0) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
    if (earliest > 0) parts.push(<span key={key++}>{remaining.slice(0, earliest)}</span>)
    const target = hit.to
    const label = hit.match
    parts.push(
      <button
        key={key++}
        type="button"
        className="text-[var(--color-steve-green-bright)] underline-offset-2 hover:underline"
        onClick={() => navigate(target)}
      >
        {label}
      </button>,
    )
    remaining = remaining.slice(earliest + hit.match.length)
  }
  return <>{parts}</>
}

export function TodayPage() {
  const { state, dispatch, openAlerts, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc } = useLocale()
  const [briefOpen, setBriefOpen] = useState(true)
  const [view, setView] = useState<'brief' | 'dashboard'>('brief')
  const [widgets, setWidgets] = useState<WidgetId[]>(() => readWidgets())
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const Chevron = isRtl ? ChevronLeft : ChevronRight

  const pendingPurchases = state.purchases.filter((p) => p.status === 'pending')
  const pendingTx = state.transactions.filter((tr) => tr.status === 'pending')
  const openCorr =
    state.correspondence.find((c) => c.status === 'awaiting_reply' || c.status === 'assigned' || c.status === 'registered') ||
    state.correspondence[0]
  const dangerInv = state.inventory.find((i) => i.status === 'danger') || state.inventory[0]
  const firstEmp = state.employees.find((e) => e.attendanceRate < 100) || state.employees[0]
  const primaryUnit = state.units.find((u) => u.id === 'unit-fuel') || state.units.find((u) => u.id !== 'unit-holding') || state.units[0]

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

  const briefLinks = useMemo(() => {
    const links: { match: string; to: string }[] = []
    const pr = pendingPurchases[0]
    const tx = pendingTx[0]
    if (pr) {
      links.push({ match: pr.id, to: recordPath('purchase', pr.id) })
      if (locale === 'fa') links.push({ match: 'خرید اضطراری ماده اصطکاکی', to: recordPath('purchase', pr.id) })
      else links.push({ match: 'emergency friction-material purchase', to: recordPath('purchase', pr.id) })
    }
    if (tx) {
      links.push({ match: tx.id, to: recordPath('transaction', tx.id) })
      if (locale === 'fa') links.push({ match: 'هزینه نگهداری', to: recordPath('transaction', tx.id) })
      else links.push({ match: 'maintenance cost', to: recordPath('transaction', tx.id) })
    }
    if (openCorr) {
      links.push({ match: openCorr.id, to: recordPath('correspondence', openCorr.id) })
      if (locale === 'fa') links.push({ match: 'نامه مشتری', to: recordPath('correspondence', openCorr.id) })
      else links.push({ match: 'customer letter', to: recordPath('correspondence', openCorr.id) })
    }
    if (dangerInv) {
      links.push({ match: dangerInv.id, to: recordPath('inventory', dangerInv.id) })
      if (locale === 'fa') links.push({ match: 'رزین فنولیک', to: recordPath('inventory', dangerInv.id) })
      else links.push({ match: 'phenolic resin', to: recordPath('inventory', dangerInv.id) })
    }
    links.push({ match: 'FG-8842', to: recordPath('inventory', 'inv-fg-8842') })
    return links
  }, [locale, pendingPurchases, pendingTx, openCorr, dangerInv, recordPath])

  useEffect(() => {
    if (!state.toast) return
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800)
    return () => window.clearTimeout(timer)
  }, [state.toast, dispatch])

  function persistWidgets(next: WidgetId[]) {
    setWidgets(next)
    writeWidgets(next)
  }

  const catalog: { id: WidgetId; label: string }[] = [
    { id: 'communications', label: t('today.communications') },
    { id: 'receivables', label: t('today.dashReceivables') },
    { id: 'people', label: t('today.dashPeople') },
    { id: 'purchases', label: t('today.pendingApprovals') },
    { id: 'inventory', label: t('today.dashInventory') },
    { id: 'unitPulse', label: t('today.dashPulse') },
    { id: 'cameras', label: t('today.dashCameras') },
    { id: 'needsPin', label: t('today.needsYou') },
  ]

  return (
    <div className="steve-page space-y-4">
      {state.toast ? (
        <div className="fixed top-4 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-[var(--color-steve-brief-border)] bg-[var(--color-steve-green-dim)] px-4 py-2 text-[12px] text-[var(--color-steve-green-bright)] shadow-lg">
          {state.toast}
        </div>
      ) : null}

      {/* Stable header hierarchy — matches approved Today / My Dashboard */}
      <div className="pt-1">
        <h1 className="steve-greeting">{brief.greeting}</h1>
        <p className="steve-asof">
          {brief.dateLabel} • {t('today.asOf')}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex gap-1 rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-1">
            {(
              [
                ['brief', 'nav.today'],
                ['dashboard', 'today.myDashboard'],
              ] as const
            ).map(([id, labelKey]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[12px]',
                  view === id ? 'bg-[var(--color-steve-green-active)] text-[var(--color-steve-text)]' : 'text-[var(--color-steve-text-faint)]',
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
          {view === 'dashboard' ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-steve-border)] px-3.5 py-1.5 text-[12px] text-[var(--color-steve-text-muted)]"
              onClick={() => setCustomizeOpen(true)}
            >
              <Settings2 size={14} strokeWidth={1.6} />
              {t('today.customize')}
            </button>
          ) : null}
        </div>
      </div>

      {view === 'dashboard' ? (
        <MyDashboard
          widgets={widgets}
          catalog={catalog}
          onOpenCustomize={() => setCustomizeOpen(true)}
          state={state}
          loc={loc}
          t={t}
          recordPath={recordPath}
          navigate={navigate}
          pendingPurchases={pendingPurchases.length}
          pendingTx={pendingTx.length}
          openAlerts={openAlerts}
          primaryUnit={primaryUnit}
          firstEmp={firstEmp}
          dangerInv={dangerInv}
          Chevron={Chevron}
        />
      ) : (
        <>
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
                  <p key={p}>
                    <BriefProse text={p} links={briefLinks} />
                  </p>
                ))}
              </div>
              <div className="mt-5 space-y-1.5 text-[13px] leading-7">
                {brief.lines.map((line) => (
                  <div key={line.label}>
                    <span className="text-[var(--color-steve-green-lead)]">{line.label} — </span>
                    <span className="text-[var(--color-steve-text-muted)]">
                      <BriefProse text={line.text} links={briefLinks} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <button type="button" className="text-[12px] text-[var(--color-steve-green-lead)]" onClick={() => setBriefOpen(true)}>
              {t('today.showBrief')}
            </button>
          )}

          {/* Live = happening-now activity stream — not a task list */}
          <div className="steve-live">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-steve-green-bright)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-steve-green-bright)]" />
              {t('today.live')}
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex animate-[steve-ticker_48s_linear_infinite] gap-8 whitespace-nowrap text-[var(--color-steve-text-muted)]">
                {[...state.activityFeed, ...state.activityFeed].map((a, i) => (
                  <button
                    key={`${a.id}-${i}`}
                    type="button"
                    className="inline-flex items-center gap-2 text-start hover:text-[var(--color-steve-text)]"
                    onClick={() => {
                      if (a.recordType && a.recordId) navigate(recordPath(a.recordType as 'purchase' | 'transaction' | 'inventory' | 'correspondence' | 'unit', a.recordId))
                    }}
                  >
                    <span className="text-[11px] text-[var(--color-steve-gold)]" dir="ltr">
                      {a.time}
                    </span>
                    <span className="text-[13px]">{loc(a.text, 'activityFeed', a.id, 'text')}</span>
                    {a.unit ? <span className="text-[11px] text-[var(--color-steve-text-faint)]">· {loc(a.unit, 'activityFeed', a.id, 'unit')}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.45fr_0.95fr]">
            <section className="min-w-0 pt-1">
              <div className="mb-1 flex items-center justify-between px-1">
                <div className="text-[14px] text-[var(--color-steve-text)]">{t('today.needsYou')}</div>
                <div className="text-[11px] text-[var(--color-steve-text-faint)]">{t('today.openCount', { count: openAlerts.length })}</div>
              </div>
              <div className="max-h-[340px] overflow-y-auto pe-1">
                {openAlerts.map((item, idx) => {
                  const Icon = icons[idx % icons.length]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-center gap-3 border-b border-[var(--color-steve-border-soft)] px-1 py-2.5 text-start last:border-b-0 hover:bg-[var(--steve-hover-soft)]"
                      onClick={() => navigate(recordPath(item.recordType, item.recordId))}
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          item.priority === 'critical'
                            ? 'bg-[var(--steve-danger-tint)] text-[var(--color-steve-danger)]'
                            : 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-green-bright)]',
                        )}
                      >
                        <Icon size={14} strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[var(--steve-chip-bg)] px-2 py-0.5 text-[11px] text-[var(--color-steve-gold)]">
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
                  const list = state.calendarEvents.filter((e) => group.match.includes(e.date))
                  if (!list.length) return null
                  return (
                    <div key={group.key}>
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
        </>
      )}

      {customizeOpen ? (
        <CustomizeModal
          catalog={catalog}
          widgets={widgets}
          onClose={() => setCustomizeOpen(false)}
          onChange={persistWidgets}
          t={t}
        />
      ) : null}
    </div>
  )
}

function MyDashboard({
  widgets,
  catalog,
  onOpenCustomize,
  state,
  loc,
  t,
  recordPath,
  navigate,
  pendingPurchases,
  pendingTx,
  openAlerts,
  primaryUnit,
  firstEmp,
  dangerInv,
  Chevron,
}: {
  widgets: WidgetId[]
  catalog: { id: WidgetId; label: string }[]
  onOpenCustomize: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loc: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordPath: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any
  pendingPurchases: number
  pendingTx: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openAlerts: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  primaryUnit: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firstEmp: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dangerInv: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Chevron: any
}) {
  if (!widgets.length) {
    return (
      <div className="steve-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-[14px] text-[var(--color-steve-text-muted)]">{t('today.dashEmpty')}</p>
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-steve-green-bright)] px-4 py-2 text-[12px] text-[var(--color-steve-green-bright)]" onClick={onOpenCustomize}>
          <Plus size={14} /> {t('today.customize')}
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {widgets.map((id) => {
        if (id === 'cameras') {
          if (!state.visualFeeds?.length) return null
          return (
            <div key={id} className="steve-surface p-4 md:col-span-2 xl:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-[var(--color-steve-gold)]">
                  <Eye size={14} /> {t('today.dashCameras')}
                </div>
                <button type="button" className="text-[11px] text-[var(--color-steve-gold)]" onClick={() => navigate('/agents?lane=cameras')}>
                  {t('today.openAgentCameras')}
                </button>
              </div>
              <VisualMonitoring feeds={state.visualFeeds.slice(0, 4)} title="" compact subtitle={t('today.asOf')} />
            </div>
          )
        }
        if (id === 'needsPin') {
          return (
            <div key={id} className="steve-surface p-5">
              <div className="text-[13px] text-[var(--color-steve-gold)]">{t('today.needsYou')}</div>
              <div className="mt-3 space-y-2">
                {openAlerts.slice(0, 3).map((a) => (
                  <button key={a.id} type="button" className="flex w-full items-center justify-between gap-2 text-start text-[13px]" onClick={() => navigate(recordPath(a.recordType, a.recordId))}>
                    <span>{loc(a.title, 'alerts', a.id, 'title')}</span>
                    <Chevron size={14} className="text-[var(--color-steve-text-faint)]" />
                  </button>
                ))}
              </div>
            </div>
          )
        }
        const card = (() => {
          switch (id) {
            case 'communications':
              return {
                title: t('today.communications'),
                body: t('today.unreadMessages', { count: state.threads.reduce((n: number, th: { unread: number }) => n + th.unread, 0) }),
                to: '/communication',
              }
            case 'receivables':
              return {
                title: t('today.dashReceivables'),
                body: t('today.approvalsQueued', { count: pendingPurchases + pendingTx }),
                to: '/work',
              }
            case 'people':
              return {
                title: t('today.dashPeople'),
                body: firstEmp
                  ? `${loc(firstEmp.name, 'employees', firstEmp.id, 'name')} · ${t('today.attendance', { rate: firstEmp.attendanceRate })}`
                  : t('today.noData'),
                to: firstEmp ? recordPath('employee', firstEmp.id) : '/work',
              }
            case 'purchases':
              return {
                title: t('today.pendingApprovals'),
                body: t('today.approvalsQueued', { count: pendingPurchases }),
                to: '/work',
              }
            case 'inventory':
              return {
                title: t('today.dashInventory'),
                body: dangerInv ? loc(dangerInv.sku, 'inventory', dangerInv.id, 'sku') : t('today.noData'),
                to: dangerInv ? recordPath('inventory', dangerInv.id) : '/work',
              }
            case 'unitPulse':
              return {
                title: primaryUnit ? loc(primaryUnit.name, 'units', primaryUnit.id, 'name') : t('today.primaryUnit'),
                body: primaryUnit
                  ? `${loc(primaryUnit.kpiLabel, 'units', primaryUnit.id, 'kpiLabel')}: ${loc(primaryUnit.kpiValue, 'units', primaryUnit.id, 'kpiValue')}`
                  : t('today.noData'),
                to: primaryUnit ? recordPath('unit', primaryUnit.id) : '/map',
              }
            default:
              return { title: catalog.find((c) => c.id === id)?.label || id, body: '—', to: '/' }
          }
        })()
        return (
          <Link key={id} to={card.to} className="steve-surface p-5 transition hover:border-[var(--color-steve-brief-border)]">
            <div className="text-[13px] text-[var(--color-steve-gold)]">{card.title}</div>
            <div className="mt-3 text-[14px] leading-7">{card.body}</div>
          </Link>
        )
      })}
    </div>
  )
}

function CustomizeModal({
  catalog,
  widgets,
  onClose,
  onChange,
  t,
}: {
  catalog: { id: WidgetId; label: string }[]
  widgets: WidgetId[]
  onClose: () => void
  onChange: (ids: WidgetId[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const [draft, setDraft] = useState<WidgetId[]>(widgets)

  function toggle(id: WidgetId) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function move(id: WidgetId, dir: -1 | 1) {
    setDraft((prev) => {
      const i = prev.indexOf(id)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={t('today.customize')}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[16px] text-[var(--color-steve-text)]">{t('today.customize')}</div>
            <div className="mt-1 text-[12px] text-[var(--color-steve-text-muted)]">{t('today.customizeHint')}</div>
          </div>
          <button type="button" aria-label={t('actions.close')} onClick={onClose}>
            <X size={16} className="text-[var(--color-steve-text-faint)]" />
          </button>
        </div>
        <div className="space-y-2">
          {catalog.map((c) => {
            const on = draft.includes(c.id)
            const order = draft.indexOf(c.id)
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-xl border border-[var(--color-steve-border-soft)] px-3 py-2.5">
                <GripVertical size={14} className="text-[var(--color-steve-text-faint)]" />
                <label className="flex flex-1 cursor-pointer items-center gap-3 text-[13px]">
                  <input type="checkbox" checked={on} onChange={() => toggle(c.id)} className="accent-[var(--color-steve-green)]" />
                  {c.label}
                </label>
                {on ? (
                  <div className="flex gap-1">
                    <button type="button" className="rounded px-2 text-[11px] text-[var(--color-steve-text-faint)]" disabled={order <= 0} onClick={() => move(c.id, -1)}>
                      ↑
                    </button>
                    <button type="button" className="rounded px-2 text-[11px] text-[var(--color-steve-text-faint)]" disabled={order >= draft.length - 1} onClick={() => move(c.id, 1)}>
                      ↓
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-full border border-[var(--color-steve-border)] px-4 py-2 text-[12px]" onClick={onClose}>
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            className="rounded-full bg-[var(--color-steve-green)] px-4 py-2 text-[12px] text-white"
            onClick={() => {
              onChange(draft)
              onClose()
            }}
          >
            {t('today.saveDashboard')}
          </button>
        </div>
      </div>
    </div>
  )
}
