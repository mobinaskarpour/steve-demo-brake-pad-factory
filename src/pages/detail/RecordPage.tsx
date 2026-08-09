import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../../domain/store'
import { Badge } from '../../components/ui/Badge'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { toPersianDigits } from '../../lib/format'
import { VisualEvidence } from '../../components/ui/VisualMonitoring'
import { Ltr, useLocale } from '../../i18n/LocaleProvider'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--color-steve-border-soft)] py-2.5 text-[13px]">
      <span className="text-[var(--color-steve-gold)]">{label}</span>
      <span className="text-end text-[var(--color-steve-text)]">{value}</span>
    </div>
  )
}

export function RecordPage() {
  const { type = '', id = '' } = useParams()
  const { state, dispatch, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc, tStatus } = useLocale()
  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  if (type === 'inventory') {
    const inv = state.inventory.find((x) => x.id === id)
    if (!inv) return <Missing />
    const pr = inv.purchaseRequestId ? state.purchases.find((p) => p.id === inv.purchaseRequestId) : undefined
    const days = inv.avgDailyUse ? (inv.onHand / inv.avgDailyUse).toFixed(1) : '—'
    return (
      <Shell title={loc(inv.sku, 'inventory', inv.id, 'sku')} subtitle={t('record.lastUpdate', { place: loc(inv.warehouse, 'inventory', inv.id, 'warehouse'), time: inv.lastUpdate })} back="/">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="steve-surface p-5">
            {inv.imageSrc ? (
              <div className="mb-4">
                <VisualEvidence src={inv.imageSrc} caption={loc(inv.sku, 'inventory', inv.id, 'sku')} meta={loc(inv.warehouse, 'inventory', inv.id, 'warehouse')} />
              </div>
            ) : null}
            <div className="mb-3 text-[13px] text-[var(--color-steve-gold)]">{t('record.inventory')}</div>
            <Row label={t('record.onHand')} value={t('record.dayUnit', { value: d(inv.onHand), unit: loc(inv.unit, 'inventory', inv.id, 'unit') })} />
            <Row label={t('record.reorder')} value={t('record.dayUnit', { value: d(inv.reorder), unit: loc(inv.unit, 'inventory', inv.id, 'unit') })} />
            <Row label={t('record.avgUse')} value={t('record.perDay', { value: d(inv.avgDailyUse), unit: loc(inv.unit, 'inventory', inv.id, 'unit') })} />
            <Row label={t('record.eta')} value={t('record.days', { value: d(days) })} />
            <Row label={t('record.status')} value={<Badge tone={inv.status}>{tStatus(inv.status)}</Badge>} />
            <div className="mt-4">
              <div className="mb-2 text-[13px] text-[var(--color-steve-text)]">{t('record.history')}</div>
              <div className="space-y-2">
                {inv.history.map((h, i) => (
                  <div key={i} className="rounded-xl bg-[var(--color-steve-elevated)] px-3 py-2 text-[12px] text-[var(--color-steve-text-muted)]">
                    {h.date} · {h.delta > 0 ? '+' : ''}
                    {d(h.delta)} · {h.note}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="space-y-3">
            {pr ? (
              <Link to={recordPath('purchase', pr.id)} className="steve-brief block p-4 transition hover:brightness-110">
                <div className="text-[11px] tracking-wide text-[var(--color-steve-text-muted)]">{t('record.relatedPurchase')}</div>
                <div className="mt-1 text-[15px]">
                  <Ltr>{pr.id}</Ltr> · {loc(pr.title, 'purchases', pr.id, 'title')}
                </div>
                <div className="mt-2 text-[12px] text-[var(--color-steve-gold)]">
                  {t('record.amountStatus', { amount: loc(pr.amountLabel, 'purchases', pr.id, 'amountLabel'), status: tStatus(pr.status) })}
                </div>
              </Link>
            ) : null}
            {inv.workId ? (
              <Link to={`/work/${inv.workId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px] hover:border-[var(--color-steve-brief-border)]">
                {t('record.openRelatedWork')} <Chevron size={14} />
              </Link>
            ) : null}
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--color-steve-border)] px-3 py-2.5 text-[13px]"
              onClick={() =>
                dispatch({
                  type: 'CREATE_FOLLOWUP',
                  payload: {
                    title: t('record.reviewInventory', { sku: inv.sku }),
                    unitId: 'unit-wh',
                    fromRecordType: 'inventory',
                    fromRecordId: inv.id,
                    owner: 'عامل انبار',
                  },
                })
              }
            >
              {t('record.createFollowup')}
            </button>
          </section>
        </div>
      </Shell>
    )
  }

  if (type === 'purchase') {
    const pr = state.purchases.find((x) => x.id === id)
    if (!pr) return <Missing />
    const inv = state.inventory.find((x) => x.id === pr.itemId)
    const unit = state.units.find((u) => u.id === pr.unitId)
    return (
      <Shell title={<Ltr>{pr.id}</Ltr>} subtitle={loc(pr.title, 'purchases', pr.id, 'title')} back="/">
        <div className="mb-3 rounded-xl border border-[var(--notice-warning-border)] bg-[var(--notice-warning-bg)] px-3 py-2 text-[12px] text-[var(--color-steve-gold-soft)]">{t('record.purchaseDemoNote')}</div>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="steve-surface p-5">
            <Row label={t('record.status')} value={<Badge tone={pr.status === 'approved' ? 'success' : pr.status === 'rejected' ? 'danger' : 'warning'}>{tStatus(pr.status)}</Badge>} />
            <Row label={t('record.unit')} value={unit ? loc(unit.name, 'units', unit.id, 'name') : pr.unitId} />
            <Row label={t('record.requester')} value={loc(pr.requester, 'purchases', pr.id, 'requester')} />
            <Row label={t('record.approver')} value={loc(pr.approver, 'purchases', pr.id, 'approver')} />
            <Row label={t('record.supplier')} value={loc(pr.supplier, 'purchases', pr.id, 'supplier')} />
            <Row label={t('record.quantity')} value={t('record.quantityValue', { count: d(pr.quantity) })} />
            <Row label={t('record.amount')} value={loc(pr.amountLabel, 'purchases', pr.id, 'amountLabel')} />
            <Row label={t('record.due')} value={loc(pr.due, 'purchases', pr.id, 'due')} />
            <Row label={t('record.createdAt')} value={pr.createdAt} />
            <p className="mt-4 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{loc(pr.reason, 'purchases', pr.id, 'reason')}</p>
            <div className="mt-4 space-y-2">
              <div className="text-[13px] text-[var(--color-steve-text)]">{t('record.activity')}</div>
              {pr.activity.map((a) => (
                <div key={a.id} className="text-[12px] text-[var(--color-steve-text-faint)]">
                  {a.time} — {a.text}
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            {inv ? (
              <Link to={recordPath('inventory', inv.id)} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
                {t('record.relatedInventory', { sku: loc(inv.sku, 'inventory', inv.id, 'sku') })} <Chevron size={14} />
              </Link>
            ) : null}
            <Link to={`/work/${pr.workId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
              {t('record.workLink', { id: '' })}
              <Ltr>{pr.workId}</Ltr> <Chevron size={14} />
            </Link>
            {pr.conversationId ? (
              <Link to={`/communication?thread=${pr.conversationId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
                {t('record.relatedThread')} <Chevron size={14} />
              </Link>
            ) : null}
            {pr.status === 'pending' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-steve-green)] px-3 py-2.5 text-white"
                  onClick={() => {
                    dispatch({ type: 'APPROVE_PURCHASE', id: pr.id })
                    navigate('/')
                  }}
                >
                  <CheckCircle2 size={16} /> {t('record.approveRequest')}
                </button>
                <button type="button" className="flex-1 rounded-xl border border-[var(--color-steve-border)] px-3 py-2.5 text-[var(--color-steve-danger)]" onClick={() => dispatch({ type: 'REJECT_PURCHASE', id: pr.id })}>
                  {t('actions.reject')}
                </button>
              </div>
            ) : (
              <div className="steve-brief p-4 text-[13px]">{t('record.currentStatus', { status: tStatus(pr.status) })}</div>
            )}
          </section>
        </div>
      </Shell>
    )
  }

  if (type === 'transaction') {
    const tx = state.transactions.find((x) => x.id === id)
    if (!tx) return <Missing />
    return (
      <Shell title={<Ltr>{tx.id}</Ltr>} subtitle={loc(tx.title, 'transactions', tx.id, 'title')} back="/agents">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="steve-surface p-5">
            <Row label={t('record.amount')} value={loc(tx.amountLabel, 'transactions', tx.id, 'amountLabel')} />
            <Row label={t('record.category')} value={loc(tx.category, 'transactions', tx.id, 'category')} />
            <Row label={t('record.period')} value={loc(tx.period, 'transactions', tx.id, 'period')} />
            <Row label={t('record.status')} value={<Badge tone={tx.status === 'approved' ? 'success' : tx.status === 'rejected' ? 'danger' : 'warning'}>{tStatus(tx.status)}</Badge>} />
            <p className="mt-4 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{loc(tx.comparison, 'transactions', tx.id, 'comparison')}</p>
            <div className="mt-4 space-y-2">
              <div className="text-[13px]">{t('record.evidence')}</div>
              {tx.evidence.map((e) => (
                <div key={e} className="rounded-xl bg-[var(--color-steve-elevated)] px-3 py-2 text-[12px]">
                  {e}
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            {tx.workId ? (
              <Link to={`/work/${tx.workId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
                {t('record.relatedWork')} <Chevron size={14} />
              </Link>
            ) : null}
            <Link
              to={`/agents?agent=${tx.agentId || state.agents.find((a) => a.role.includes('مالی') || a.domain.includes('مالی'))?.id || state.agents[0]?.id}`}
              className="steve-surface flex items-center gap-1 p-4 text-[13px]"
            >
              {t('record.financeAgent')} <Chevron size={14} />
            </Link>
            {tx.status === 'pending' ? (
              <div className="flex gap-2">
                <button type="button" className="flex-1 rounded-xl bg-[var(--color-steve-green)] px-3 py-2.5 text-white" onClick={() => dispatch({ type: 'APPROVE_TRANSACTION', id: tx.id })}>
                  {t('record.approvePayment')}
                </button>
                <button type="button" className="flex-1 rounded-xl border border-[var(--color-steve-border)] px-3 py-2.5 text-[var(--color-steve-danger)]" onClick={() => dispatch({ type: 'REJECT_TRANSACTION', id: tx.id })}>
                  {t('actions.reject')}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </Shell>
    )
  }

  if (type === 'employee') {
    const emp = state.employees.find((x) => x.id === id)
    if (!emp) return <Missing />
    const unit = state.units.find((u) => u.id === emp.unitId)
    return (
      <Shell
        title={loc(emp.name, 'employees', emp.id, 'name')}
        subtitle={`${loc(emp.role, 'employees', emp.id, 'role')} · ${t('today.attendance', { rate: d(emp.attendanceRate) })}`}
        back="/"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="steve-surface p-5">
            <Row label={t('record.unit')} value={unit ? loc(unit.name, 'units', unit.id, 'name') : emp.unitId} />
            <Row label={t('record.lateToday')} value={emp.lateTodayMinutes ? t('record.lateMinutes', { count: d(emp.lateTodayMinutes) }) : t('record.notLate')} />
            <div className="mt-4 space-y-2">
              {emp.history.map((h, i) => (
                <div key={i} className="rounded-xl bg-[var(--color-steve-elevated)] px-3 py-2 text-[12px]">
                  {loc(h.date, 'employees', emp.id, 'historyDate')} — {loc(h.status, 'employees', emp.id, 'historyStatus')}
                  {h.note ? ` · ${loc(h.note, 'employees', emp.id, 'historyNote')}` : ''}
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <button
              type="button"
              className="w-full rounded-xl bg-[var(--color-steve-green)] px-3 py-2.5 text-white"
              onClick={() => {
                dispatch({
                  type: 'CREATE_FOLLOWUP',
                  payload: {
                    title: t('record.supervisorChat', { name: loc(emp.name, 'employees', emp.id, 'name') }),
                    unitId: emp.unitId,
                    fromRecordType: 'employee',
                    fromRecordId: emp.id,
                    owner: 'عامل منابع انسانی',
                  },
                })
                if (emp.alertId) dispatch({ type: 'ACK_ALERT', id: emp.alertId })
                navigate('/work')
              }}
            >
              {t('record.attendanceFollowup')}
            </button>
            {emp.workId ? (
              <Link to={`/work/${emp.workId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
                {t('record.currentWork')} <Chevron size={14} />
              </Link>
            ) : null}
          </section>
        </div>
      </Shell>
    )
  }

  if (type === 'correspondence') {
    const c = state.correspondence.find((x) => x.id === id)
    if (!c) return <Missing />
    return (
      <Shell title={t('record.letterTitle', { number: c.number })} subtitle={loc(c.title, 'correspondence', c.id, 'title')} back="/">
        <div className="mb-3 rounded-xl border border-[var(--notice-warning-border)] bg-[var(--notice-warning-bg)] px-3 py-2 text-[12px] text-[var(--color-steve-gold-soft)]">{loc(c.demoNote, 'correspondence', c.id, 'demoNote')}</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="steve-surface p-5">
            <Row label={t('record.from')} value={loc(c.from, 'correspondence', c.id, 'from')} />
            <Row label={t('record.to')} value={loc(c.to, 'correspondence', c.id, 'to')} />
            <Row label={t('record.status')} value={tStatus(c.status) === c.status ? loc(c.status, 'correspondence', c.id, 'status') : tStatus(c.status)} />
            <Row label={t('record.deadline')} value={loc(c.deadline, 'correspondence', c.id, 'deadline')} />
            <Row label={t('record.responsible')} value={loc(c.owner, 'correspondence', c.id, 'owner')} />
            <p className="mt-4 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{loc(c.summary, 'correspondence', c.id, 'summary')}</p>
            <div className="mt-4 space-y-2">
              {c.history.map((h) => (
                <div key={h.id} className="text-[12px] text-[var(--color-steve-text-faint)]">
                  {h.time} — {h.text}
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <Link to={`/communication?thread=${c.conversationId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
              {t('record.relatedThread')} <Chevron size={14} />
            </Link>
            <Link to={`/work/${c.workId}`} className="steve-surface flex items-center gap-1 p-4 text-[13px]">
              {t('record.relatedWork')} <Chevron size={14} />
            </Link>
            {c.status !== 'closed' ? (
              <button type="button" className="w-full rounded-xl bg-[var(--color-steve-green)] px-3 py-2.5 text-white" onClick={() => dispatch({ type: 'CLOSE_CORRESPONDENCE', id: c.id })}>
                {t('record.closeCase')}
              </button>
            ) : (
              <div className="steve-brief p-4 text-[13px]">{t('record.caseClosed')}</div>
            )}
          </section>
        </div>
      </Shell>
    )
  }

  if (type === 'unit') {
    const u = state.units.find((x) => x.id === id)
    if (!u) return <Missing />
    const unitWork = state.workItems.filter((w) => w.unitId === u.id).slice(0, 6)
    const unitAlerts = state.alerts.filter((a) => a.unitId === u.id && a.status === 'open')
    const feed = state.visualFeeds?.find((f) => f.unitId === u.id)
    return (
      <Shell title={loc(u.name, 'units', u.id, 'name')} subtitle={loc(u.kind, 'units', u.id, 'kind')} back="/map">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="steve-surface p-5">
            {u.imageSrc ? (
              <div className="mb-4">
                <VisualEvidence src={u.imageSrc} caption={loc(u.name, 'units', u.id, 'name')} meta={loc(u.kind, 'units', u.id, 'kind')} />
              </div>
            ) : feed ? (
              <div className="mb-4">
                <VisualEvidence src={feed.src} caption={loc(feed.title, 'visualFeeds', feed.id, 'title')} meta={loc(feed.location, 'visualFeeds', feed.id, 'location')} />
              </div>
            ) : null}
            <p className="text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{loc(u.summary, 'units', u.id, 'summary')}</p>
            <Row label={t('record.owner')} value={loc(u.owner, 'units', u.id, 'owner')} />
            <Row label={loc(u.kpiLabel, 'units', u.id, 'kpiLabel')} value={loc(u.kpiValue, 'units', u.id, 'kpiValue')} />
            {u.alert ? <Row label={t('record.alert')} value={<span className="text-[var(--color-steve-danger)]">{loc(u.alert, 'units', u.id, 'alert')}</span>} /> : null}
            <Link to={`/agents?agent=${u.agentId}`} className="mt-4 inline-flex items-center gap-1 text-[13px] text-[var(--color-steve-gold)]">
              {t('record.relatedAgent')} <ExternalLink size={14} />
            </Link>
          </section>
          <section className="steve-surface p-5">
            <div className="mb-3 text-[13px] text-[var(--color-steve-text)]">{t('record.alertsAndWork')}</div>
            {unitAlerts.map((a) => (
              <Link key={a.id} to={recordPath(a.recordType, a.recordId)} className="block border-b border-[var(--color-steve-border-soft)] py-2 text-[13px]">
                {loc(a.title, 'alerts', a.id, 'title')}
              </Link>
            ))}
            {unitWork.map((w) => (
              <Link key={w.id} to={`/work/${w.id}`} className="block border-b border-[var(--color-steve-border-soft)] py-2 text-[13px] text-[var(--color-steve-text-muted)]">
                {loc(w.title, 'workItems', w.id, 'title')}
              </Link>
            ))}
          </section>
        </div>
      </Shell>
    )
  }

  return <Missing />
}

function Missing() {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  return (
    <div className="steve-surface p-6">
      <div>{t('record.notFound')}</div>
      <Link to="/" className="mt-3 inline-flex items-center gap-1 text-[var(--color-steve-gold)]">
        <BackIcon size={14} /> {t('record.backToday')}
      </Link>
    </div>
  )
}

function Shell({ title, subtitle, back, children }: { title: ReactNode; subtitle?: ReactNode; back: string; children: ReactNode }) {
  const { t } = useTranslation()
  const { isRtl } = useLocale()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  return (
    <div className="steve-page space-y-4">
      <Link to={back} className="inline-flex items-center gap-1 text-[13px] text-[var(--color-steve-gold)]">
        <BackIcon size={14} /> {t('record.back')}
      </Link>
      <div>
        <h1 className="text-[28px] font-light text-[var(--color-steve-text)]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-[var(--color-steve-gold)]">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  )
}
