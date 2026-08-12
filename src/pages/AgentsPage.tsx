import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { SoftTabs, Segmented } from '../components/layout/PageChrome'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Clock3,
  FileText,
  Layers,
  Pin,
  PinOff,
  Truck,
} from 'lucide-react'
import { toPersianDigits } from '../lib/format'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '../lib/utils'
import { VisualMonitoring } from '../components/ui/VisualMonitoring'
import { useLocale } from '../i18n/LocaleProvider'
import { ensureEnglish } from '../i18n/ensureEnglish'
import { enContent } from '../i18n/enContent'
import { useAskSteve } from '../components/layout/AskSteveContext'
import { buildIdTitleMap, scrubWithState } from '../domain/displayRecord'
import {
  dashboardKindOf,
  productionStageLabel,
  productionStats,
  pushRecent,
  qcStatusLabel,
  readPinned,
  readRecent,
  settlementLabel,
  settlementStats,
  supplyStats,
  surfaceFor,
  writePinned,
} from '../domain/agentDashboards'
import type { AgentProfile, InventoryItem, ProductionBatch, ProductionOrder, ProductionStage, SettlementAssignment } from '../domain/types'

type EnKpi = { label?: string; value?: string; hint?: string }

const PRODUCTION_STAGES: ProductionStage[] = ['planning', 'materials', 'production', 'qc', 'hold', 'finished_goods', 'shipment']

export function AgentsPage() {
  const { state, dispatch, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc, tStatus, tStage } = useLocale()
  const { setContext } = useAskSteve()
  const [params] = useSearchParams()
  const { id: routeAgentId } = useParams()
  const en = locale === 'en'
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  const selectedId = routeAgentId || params.get('agent') || ''
  const agent = state.agents.find((a) => a.id === selectedId)
  const [pins, setPins] = useState<string[]>(() => readPinned(state.agents))
  const [hubTab, setHubTab] = useState<'pinned' | 'recent' | 'all'>('pinned')
  const [tab, setTab] = useState('overview')
  const [lane, setLane] = useState(params.get('lane') === 'cameras' ? 'cameras' : 'ops')
  const [period, setPeriod] = useState('periodMordad')
  const [productionStageFilter, setProductionStageFilter] = useState<'all' | ProductionStage>('all')
  const [detailOrder, setDetailOrder] = useState<ProductionOrder | null>(null)
  const [detailBatch, setDetailBatch] = useState<ProductionBatch | null>(null)
  const [detailMaterial, setDetailMaterial] = useState<InventoryItem | null>(null)
  const [detailSettlement, setDetailSettlement] = useState<SettlementAssignment | null>(null)

  const idMap = useMemo(() => buildIdTitleMap(state, locale === 'en' ? 'en' : 'fa', loc), [state, locale, loc])
  const titleOf = (recId: string) => idMap.get(recId) || (en ? 'Business record' : 'رکورد کسب‌وکار')

  useEffect(() => {
    if (params.get('lane') === 'cameras') setLane('cameras')
  }, [params])

  useEffect(() => {
    if (!agent) {
      setContext({
        label: en ? 'Agent Dashboard' : 'داشبورد عامل',
        kind: 'destination',
        prompts: ['کدام دستور تولید بلاک شده؟', 'کدام ماده اولیه کسری دارد؟', 'کدام تخصیص آماده تسویه است؟'],
        promptsEn: ['Which production order is blocked?', 'Which raw material is short?', 'Which settlement is ready for payment?'],
      })
      return
    }
    pushRecent(agent.id, state.agents)
    const kind = dashboardKindOf(agent)
    const prodOrderTitle = titleOf('Pending production order for Parts-Gostar Pars order')
    const batchTitle = titleOf('Quarantined batch (friction-test failure)')
    const supplyTitle = titleOf('خرید اضطراری ماده اصطکاکی — رزین فنولیک')
    const settlementTitle = titleOf('STL-701')
    setContext({
      label: loc(agent.name, 'agents', agent.id, 'name'),
      kind: 'agent-dashboard',
      recordType: 'agent',
      recordId: agent.id,
      prompts:
        kind === 'production'
          ? [`وضعیت ${prodOrderTitle} و ${batchTitle} چیست؟`, 'کدام دستور تولید در Hold است؟', 'توقف پرس ۲ چه تاثیری دارد؟']
          : kind === 'supply'
            ? ['کدام ماده اولیه زیر نقطه سفارش است؟', `${supplyTitle} را تایید کنم؟`, 'کدام دستور تولید به این کسری وابسته است؟']
            : kind === 'finance-settlement'
              ? ['کدام تخصیص هنوز پرداخت نشده؟', `${settlementTitle} را تایید کن`, 'مانده قابل پرداخت چقدر است؟']
              : ['این عامل روی چه چیزی باید تمرکز کند؟', 'کدام تصمیم باز است؟', 'ریسک‌های این عامل کدام‌اند؟'],
      promptsEn:
        kind === 'production'
          ? [`What is the status of ${prodOrderTitle} and ${batchTitle}?`, 'Which production order is on hold?', 'What impact does the Press 2 stoppage have?']
          : kind === 'supply'
            ? ['Which raw material is below its reorder point?', `Should I approve ${supplyTitle}?`, 'Which production order depends on this shortage?']
            : kind === 'finance-settlement'
              ? ['Which assignment is still unpaid?', `Confirm ${settlementTitle}`, 'What is the outstanding payable?']
              : ['What should this agent focus on?', 'Which decisions are open?', 'What are this agent’s risks?'],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, en, loc, setContext])

  const recent = readRecent(state.agents).filter((id) => state.agents.some((a) => a.id === id))

  const enKpis = useMemo(() => {
    if (!en || !agent) return null
    const bag = (enContent.agents as unknown as Record<string, { kpis?: EnKpi[] }>)[agent.id]
    return bag?.kpis || null
  }, [en, agent])

  const periodScale = period === 'periodWeek' ? 0.82 : period === 'periodTir' ? 0.94 : 1
  const chart = useMemo(
    () =>
      state.fuelSeries.map((row) => ({
        day: row.day,
        value: Math.round((row.benzine + row.gasoil) * 20 * periodScale),
      })),
    [state.fuelSeries, periodScale],
  )

  function openAgent(id: string) {
    navigate(`/agents?agent=${id}`)
  }

  function togglePin(id: string) {
    const next = pins.includes(id) ? pins.filter((x) => x !== id) : [id, ...pins]
    setPins(next)
    writePinned(next)
  }

  if (!agent) {
    const lists: Record<typeof hubTab, AgentProfile[]> = {
      pinned: pins.map((id) => state.agents.find((a) => a.id === id)).filter(Boolean) as AgentProfile[],
      recent: recent.map((id) => state.agents.find((a) => a.id === id)).filter(Boolean) as AgentProfile[],
      all: state.agents,
    }
    return (
      <div className="steve-page">
        <div className="pt-1">
          <h1 className="text-[28px] font-light tracking-tight">{t('agents.title')}</h1>
          <p className="text-[13px] text-[var(--color-steve-text-muted)]">
            {en
              ? 'Select an operational Agent Dashboard. Pinned boards stay ready for daily work.'
              : 'یک داشبورد عملیاتی عامل را انتخاب کنید. داشبوردهای پین‌شده برای کار روزانه آماده‌اند.'}
          </p>
        </div>
        <SoftTabs
          value={hubTab}
          onChange={(id) => setHubTab(id as typeof hubTab)}
          tabs={[
            { id: 'pinned', label: en ? 'Pinned' : 'پین‌شده' },
            { id: 'recent', label: en ? 'Recently used' : 'اخیراً استفاده‌شده' },
            { id: 'all', label: en ? 'All' : 'همه' },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lists[hubTab].map((a) => {
            const kind = dashboardKindOf(a)
            return (
              <div key={a.id} className="steve-surface flex flex-col p-4">
                <div className="flex items-start justify-between">
                  <button type="button" className="text-start" onClick={() => openAgent(a.id)}>
                    <div className="text-[15px] text-[var(--color-steve-text)]">{loc(a.name, 'agents', a.id, 'name')}</div>
                    <div className="text-[12px] text-[var(--color-steve-text-muted)]">{loc(a.domain, 'agents', a.id, 'domain')}</div>
                  </button>
                  <button type="button" className="rounded-lg p-1.5 text-[var(--color-steve-gold)]" onClick={() => togglePin(a.id)} aria-label="Pin">
                    {pins.includes(a.id) ? <Pin size={14} /> : <PinOff size={14} />}
                  </button>
                </div>
                <p className="text-[12.5px] text-[var(--color-steve-text-faint)]">{loc(a.summary, 'agents', a.id, 'summary')}</p>
                <div className="flex items-center justify-between">
                  <Badge>{kind === 'generic' ? (en ? 'Ops' : 'عملیات') : kind}</Badge>
                  <span className="text-[11px] text-[var(--color-steve-green-bright)]">● {tStatus(a.status)}</span>
                </div>
                <button type="button" className="steve-action is-primary" onClick={() => openAgent(a.id)}>
                  {en ? 'Open dashboard' : 'باز کردن داشبورد'}
                </button>
              </div>
            )
          })}
          {!lists[hubTab].length ? <div className="text-[13px] text-[var(--color-steve-text-faint)]">{en ? 'Nothing here yet.' : 'هنوز موردی نیست.'}</div> : null}
        </div>
      </div>
    )
  }

  const kind = dashboardKindOf(agent)
  const surface = surfaceFor(kind)
  const pendingTx = state.transactions.filter((tx) => tx.status === 'pending' && (agent.id.includes('fin') || tx.agentId === agent.id || !tx.agentId))
  const pendingPr = state.purchases.filter((p) => p.status === 'pending')
  const agentWork = state.workItems.filter((w) => agent.workIds.includes(w.id) || w.owner.includes(agent.name.split(' ')[0]))
  const agentAlerts = state.alerts.filter((a) => (agent.riskIds.includes(a.id) || a.status === 'open') && a.status === 'open').slice(0, 6)

  function openDecision(decisionId: string) {
    const purchase = state.purchases.find((p) => p.id === decisionId)
    if (purchase) return navigate(recordPath('purchase', decisionId))
    const tx = state.transactions.find((x) => x.id === decisionId)
    if (tx) return navigate(recordPath('transaction', decisionId))
    const corr = state.correspondence.find((c) => c.id === decisionId)
    if (corr) return navigate(recordPath('correspondence', decisionId))
    if (decisionId.startsWith('CORR') || decisionId.includes('CORR')) return navigate(recordPath('correspondence', decisionId))
    navigate('/work')
  }

  const roleLabel = loc(agent.role, 'agents', agent.id, 'role')
  const isFinance = agent.role.includes('مالی') || roleLabel.toLowerCase().includes('finance')

  return (
    <div className="steve-page">
      <div className="flex flex-wrap items-start justify-between">
        <div>
          <button type="button" className="text-[11px] text-[var(--color-steve-gold)]" onClick={() => navigate('/agents')}>
            ← {en ? 'All dashboards' : 'همه داشبوردها'}
          </button>
          <h1 className="text-[28px] font-light tracking-tight">{loc(agent.name, 'agents', agent.id, 'name')}</h1>
          <div className="flex flex-wrap items-center text-[12px]">
            <span className="text-[var(--color-steve-green-bright)]">● {tStatus(agent.status)}</span>
            <span className="text-[var(--color-steve-text-faint)]">•</span>
            <span className="text-[var(--color-steve-text-muted)]">{loc(agent.domain, 'agents', agent.id, 'domain')}</span>
            <span className="text-[var(--color-steve-text-faint)]">•</span>
            <span className="text-[var(--color-steve-text-muted)]">{t('agents.updated')}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center">
          <button type="button" className="steve-action" onClick={() => togglePin(agent.id)}>
            {pins.includes(agent.id) ? (en ? 'Unpin' : 'برداشتن پین') : en ? 'Pin' : 'پین کردن'}
          </button>
          <select
            value={agent.id}
            onChange={(e) => openAgent(e.target.value)}
            className="h-9 rounded-[8px] border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] text-[12px]"
          >
            {state.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {loc(a.name, 'agents', a.id, 'name')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {surface === 'line-status' ? (
        <ProductionSurface
          en={en}
          d={d}
          state={state}
          idMap={idMap}
          dispatch={dispatch}
          navigate={navigate}
          stageFilter={productionStageFilter}
          setStageFilter={setProductionStageFilter}
          detailOrder={detailOrder}
          setDetailOrder={setDetailOrder}
          detailBatch={detailBatch}
          setDetailBatch={setDetailBatch}
        />
      ) : null}

      {surface === 'material-deps' ? (
        <SupplySurface
          en={en}
          d={d}
          state={state}
          idMap={idMap}
          dispatch={dispatch}
          navigate={navigate}
          recordPath={recordPath}
          detail={detailMaterial}
          setDetail={setDetailMaterial}
        />
      ) : null}

      {surface === 'settlement-table' ? (
        <SettlementSurface
          en={en}
          state={state}
          dispatch={dispatch}
          navigate={navigate}
          detail={detailSettlement}
          setDetail={setDetailSettlement}
        />
      ) : null}

      {surface === 'ops' ? (
        <>
          <div className="flex flex-wrap items-center justify-between">
            <Segmented
              value={lane}
              onChange={setLane}
              options={[
                { id: 'ops', label: isFinance ? t('agents.finance') : t('agents.ops') },
                { id: 'cameras', label: t('agents.cameras') },
              ]}
            />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-[8px] border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)].5.5 text-[12px]">
              <option value="periodMordad">{t('agents.periodMordad')}</option>
              <option value="periodTir">{t('agents.periodTir')}</option>
              <option value="periodWeek">{t('agents.periodWeek')}</option>
            </select>
          </div>

          {lane === 'cameras' ? (
            <VisualMonitoring
              feeds={
                state.visualFeeds.filter((f) => !agent.unitId || !f.unitId || f.unitId === agent.unitId).slice(0, 4).length
                  ? state.visualFeeds.filter((f) => !agent.unitId || !f.unitId || f.unitId === agent.unitId).slice(0, 4)
                  : state.visualFeeds.slice(0, 4)
              }
              title={t('agents.camerasTitle')}
              subtitle={loc(agent.domain, 'agents', agent.id, 'domain')}
            />
          ) : null}

          <SoftTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'overview', label: t('agents.overview') },
              { id: 'cash', label: t('agents.cash') },
              { id: 'work', label: t('agents.work') },
              { id: 'risks', label: t('agents.risks') },
              { id: 'activity', label: t('agents.activity') },
            ]}
          />

          <section className="steve-brief">
            <div className="text-[11px] tracking-[0.18em] text-[var(--color-steve-text-muted)]">{t('agents.brief')}</div>
            <p className="max-w-[980px] text-[14px] leading-[1.85]">{loc(agent.summary, 'agents', agent.id, 'summary')}</p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {agent.kpis.map((k, i) => (
              <div key={k.id} className="steve-surface">
                <div className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? ensureEnglish(enKpis?.[i]?.label || k.label) : k.label}</div>
                <div className="text-[24px] font-light">{en ? ensureEnglish(enKpis?.[i]?.value || k.value) : k.value}</div>
                <div className={cn('text-[12px]', k.delta >= 0 ? 'text-[var(--color-steve-green-bright)]' : 'text-[var(--color-steve-text-muted)]')}>{scrubWithState(en ? ensureEnglish(enKpis?.[i]?.hint || k.hint) : k.hint, state, en ? 'en' : 'fa', loc)}</div>
              </div>
            ))}
          </div>

          {tab === 'overview' ? (
            <div className="grid lg:grid-cols-[1.2fr_0.9fr]">
              <section className="steve-surface p-5">
                <div className="text-[14px]">{t('agents.trendPeriod', { period: t(`agents.${period}`) })}</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                      <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--color-steve-border)', borderRadius: 12 }} />
                      <ReferenceLine y={120 * periodScale} stroke="var(--)" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="value" stroke="var(--)" strokeWidth={2} dot={{ r: 3, fill: 'var(--)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="steve-surface p-5">
                <div className="text-[14px]">{t('agents.needsAttention')}</div>
                {agentAlerts.map((r, i) => {
                  const Icon = [FileText, Clock3, BarChart3][i % 3]
                  return (
                    <button key={r.id} type="button" className="flex w-full items-center border-b border-[var(--color-steve-border-soft)] text-start last:" onClick={() => navigate(recordPath(r.recordType, r.recordId))}>
                      <Icon size={15} className="text-[var(--color-steve-text-faint)]" />
                      <div className="text-[13px]">{loc(r.title, 'alerts', r.id, 'title')}</div>
                      <div className="text-[11px] text-[var(--color-steve-gold)]">{r.time}</div>
                    </button>
                  )
                })}
                {!agentAlerts.length ? <div className="text-[12px] text-[var(--color-steve-text-faint)]">{t('agents.noOpen')}</div> : null}
              </section>
            </div>
          ) : null}

          {tab === 'cash' ? (
            <div className="grid lg:">
              <section className="steve-surface p-5">
                <div className="text-[14px]">{t('agents.pendingTx')}</div>
                {pendingTx.length ? (
                  pendingTx.map((tx) => (
                    <button key={tx.id} type="button" className="flex w-full items-center border-b border-[var(--color-steve-border-soft)] text-start" onClick={() => navigate(recordPath('transaction', tx.id))}>
                      <FileText size={15} className="text-[var(--color-steve-text-faint)]" />
                      <div className="text-[13px]">{loc(tx.title, 'transactions', tx.id, 'title')}</div>
                      <div className="text-[11px] text-[var(--color-steve-gold)]">{loc(tx.amountLabel, 'transactions', tx.id, 'amountLabel')}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-[12px] text-[var(--color-steve-text-faint)]">{t('agents.noTx')}</div>
                )}
              </section>
              <section className="steve-surface p-5">
                <div className="text-[14px]">{t('agents.pendingPr')}</div>
                {pendingPr.length ? (
                  pendingPr.map((pr) => (
                    <button key={pr.id} type="button" className="flex w-full items-center border-b border-[var(--color-steve-border-soft)] text-start" onClick={() => navigate(recordPath('purchase', pr.id))}>
                      <Clock3 size={15} className="text-[var(--color-steve-text-faint)]" />
                      <div className="text-[13px]">
                        {pr.title ? loc(pr.title, 'purchases', pr.id, 'title') : en ? 'Purchase request' : 'درخواست خرید'}
                      </div>
                      <div className="text-[11px] text-[var(--color-steve-gold)]">{loc(pr.amountLabel, 'purchases', pr.id, 'amountLabel')}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-[12px] text-[var(--color-steve-text-faint)]">{t('agents.noPr')}</div>
                )}
              </section>
            </div>
          ) : null}

          {tab === 'work' ? (
            <div className="steve-surface p-4">
              {(agentWork.length ? agentWork : state.workItems.slice(0, 5)).map((w) => (
                <Link key={w.id} to={`/work/${w.id}`} className="flex items-center justify-between border-b border-[var(--color-steve-border-soft)] text-[13px]">
                  <span>{loc(w.title, 'workItems', w.id, 'title')}</span>
                  <Badge>{tStage(w.stage)}</Badge>
                </Link>
              ))}
            </div>
          ) : null}

          {tab === 'risks' ? (
            <div className="grid md:">
              <section className="steve-surface p-5">
                <div className="text-[13px] text-[var(--color-steve-gold)]">{t('agents.openDecisions')}</div>
                <ul className="text-[13px] text-[var(--color-steve-text-muted)]">
                  {(agent.decisionIds.length ? agent.decisionIds : [...pendingPr.map((p) => p.id), ...pendingTx.map((tx) => tx.id)].slice(0, 4)).map((decisionId) => (
                    <li key={decisionId}>
                      <button type="button" className="text-[var(--color-steve-green-bright)]" onClick={() => openDecision(decisionId)}>
                        {titleOf(decisionId)}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="steve-surface p-5">
                <div className="text-[13px] text-[var(--color-steve-gold)]">{t('agents.links')}</div>
                <div className="flex flex-wrap">
                  <Link to="/plan" className="steve-action">
                    {t('nav.plan')}
                  </Link>
                  <Link to="/map" className="steve-action">
                    {t('nav.map')}
                  </Link>
                  <Link to="/communication" className="steve-action">
                    {t('nav.communication')}
                  </Link>
                  <Link to="/intelligence" className="steve-action">
                    {t('nav.intelligence')}
                  </Link>
                </div>
              </section>
            </div>
          ) : null}

          {tab === 'activity' ? (
            <div className="steve-surface p-5">
              {agent.activity.map((a) => (
                <div key={a.id} className="text-[13px] text-[var(--color-steve-text-muted)]">
                  {a.time} — {scrubWithState(en ? ensureEnglish(a.text) : a.text, state, en ? 'en' : 'fa', loc)}
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Production — Planning → Materials → Production → QC → Hold/Rework → Finished Goods → Shipment */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProductionSurface({ en, d, state, idMap, dispatch, navigate, stageFilter, setStageFilter, detailOrder, setDetailOrder, detailBatch, setDetailBatch }: any) {
  const stats = productionStats(state)
  const titleOf = (recId: string) => idMap.get(recId) || (en ? 'Business record' : 'رکورد کسب‌وکار')
  const orders: ProductionOrder[] = stageFilter === 'all' ? state.productionOrders : state.productionOrders.filter((o: ProductionOrder) => o.stage === stageFilter)
  const feeds = state.visualFeeds.filter((f: { id: string }) => ['vf-press', 'vf-qc', 'vf-fg'].includes(f.id))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: en ? 'Open production orders' : 'دستور تولید باز', value: stats.open, icon: Layers },
          { label: en ? 'In QC' : 'در کنترل کیفیت', value: stats.inQc, icon: AlertTriangle },
          { label: en ? 'On Hold / rework' : 'در Hold / اصلاح', value: stats.onHold, icon: Clock3 },
          { label: en ? 'Quarantined batches' : 'بچ قرنطینه', value: stats.quarantined, icon: Boxes },
        ].map((k) => (
          <div key={k.label} className="steve-surface flex items-center">
            <k.icon size={16} className="text-[var(--color-steve-green-bright)]" />
            <div>
              <div className="text-[11px] text-[var(--color-steve-text-faint)]">{k.label}</div>
              <div className="text-[22px] font-light">{d(k.value)}</div>
            </div>
          </div>
        ))}
      </div>

      <VisualMonitoring feeds={feeds} title={en ? 'Line, QC & finished-goods monitoring' : 'پایش خط، کنترل کیفیت و محصول نهایی'} subtitle={en ? 'Observed evidence — not absolute truth' : 'شاهد مشاهده‌ای — نه حقیقت قطعی'} />

      <div className="flex flex-wrap.5">
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className={cn('.5 text-[12px]', stageFilter === 'all' ? 'border-[var(--color-steve-green-bright)] text-[var(--color-steve-text)]' : 'border-transparent text-[var(--color-steve-text-muted)]')}
        >
          {en ? 'All stages' : 'همه مراحل'}
        </button>
        {PRODUCTION_STAGES.map((stg) => (
          <button
            key={stg}
            type="button"
            onClick={() => setStageFilter(stg)}
            className={cn('.5 text-[12px]', stageFilter === stg ? 'border-[var(--color-steve-green-bright)] text-[var(--color-steve-text)]' : 'border-transparent text-[var(--color-steve-text-muted)]')}
          >
            {productionStageLabel(stg, en)}
          </button>
        ))}
      </div>

      <section className="steve-surface overflow-x-auto p-4">
        <div className="text-[13.5px]">{en ? 'Production orders' : 'دستورهای تولید'}</div>
        <table className="w-full min-w-[900px] text-start text-[12.5px]">
          <thead className="text-[11px] text-[var(--color-steve-gold)]">
            <tr>
              <th className="font-medium">{en ? 'Item' : 'محصول'}</th>
              <th className="font-medium">{en ? 'Qty' : 'مقدار'}</th>
              <th className="font-medium">{en ? 'Stage' : 'مرحله'}</th>
              <th className="font-medium">{en ? 'Press' : 'پرس'}</th>
              <th className="font-medium">{en ? 'Due' : 'مهلت'}</th>
              <th className="font-medium">{en ? 'Blocker' : 'بلاکر'}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="cursor-pointer border-t border-[var(--color-steve-border-soft)] hover:bg-[var(--steve-hover-soft)]" onClick={() => setDetailOrder(o)}>
                <td className=".5">
                  {en ? ensureEnglish(o.itemSku) : o.itemSku}
                  {o.soId ? <div className="text-[10px] text-[var(--color-steve-text-faint)]">{titleOf(o.soId)}</div> : null}
                </td>
                <td dir="ltr">{d(o.quantity)} {en ? ensureEnglish(o.unit) : o.unit}</td>
                <td>
                  <Badge tone={o.status}>{productionStageLabel(o.stage, en)}</Badge>
                </td>
                <td>{o.press ? (en ? ensureEnglish(o.press) : o.press) : '—'}</td>
                <td dir={en ? 'ltr' : undefined}>{en ? ensureEnglish(o.dueDate) : o.dueDate}</td>
                <td className="max-w-[220px] truncate text-[var(--color-steve-text-muted)]">{o.blocker ? (en ? ensureEnglish(o.blocker) : o.blocker) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="steve-surface overflow-x-auto p-4">
        <div className="text-[13.5px]">{en ? 'Batches' : 'بچ‌های تولید'}</div>
        <table className="w-full min-w-[820px] text-start text-[12.5px]">
          <thead className="text-[11px] text-[var(--color-steve-gold)]">
            <tr>
              <th className="font-medium">{en ? 'Order' : 'دستور تولید'}</th>
              <th className="font-medium">{en ? 'Press' : 'پرس'}</th>
              <th className="font-medium">{en ? 'QC status' : 'وضعیت QC'}</th>
              <th className="font-medium">{en ? 'QC record' : 'برگه QC'}</th>
              <th className="font-medium">{en ? 'Qty' : 'مقدار'}</th>
            </tr>
          </thead>
          <tbody>
            {state.productionBatches.map((b: ProductionBatch) => (
              <tr key={b.id} className="cursor-pointer border-t border-[var(--color-steve-border-soft)] hover:bg-[var(--steve-hover-soft)]" onClick={() => setDetailBatch(b)}>
                <td className=".5">{b.productionOrderId ? titleOf(b.productionOrderId) : titleOf(b.id)}</td>
                <td>{en ? ensureEnglish(b.press) : b.press}</td>
                <td>
                  <Badge tone={b.qcStatus === 'passed' ? 'success' : b.qcStatus === 'quarantined' || b.qcStatus === 'failed' ? 'danger' : 'warning'}>{qcStatusLabel(b.qcStatus, en)}</Badge>
                </td>
                <td>{b.qcRecordId ? titleOf(b.qcRecordId) : '—'}</td>
                <td dir="ltr">{d(b.quantity)} {en ? ensureEnglish(b.unit) : b.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {detailOrder ? (
        <div className="fixed z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setDetailOrder(null)}>
          <div className="steve-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-[var(--color-steve-gold)]">{en ? 'Production order' : 'دستور تولید'}</div>
                <h2 className="text-[18px]">{en ? ensureEnglish(detailOrder.itemSku) : detailOrder.itemSku}</h2>
              </div>
              <button type="button" className="text-[12px] text-[var(--color-steve-text-faint)]" onClick={() => setDetailOrder(null)}>
                {en ? 'Close' : 'بستن'}
              </button>
            </div>
            <dl className="text-[13px]">
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Stage' : 'مرحله'}</dt>
                <dd><Badge tone={detailOrder.status}>{productionStageLabel(detailOrder.stage, en)}</Badge></dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Quantity / due' : 'مقدار / مهلت'}</dt>
                <dd dir="ltr">{d(detailOrder.quantity)} {en ? ensureEnglish(detailOrder.unit) : detailOrder.unit} · {en ? ensureEnglish(detailOrder.dueDate) : detailOrder.dueDate}</dd>
              </div>
              {detailOrder.batchIds.length ? (
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Batches' : 'بچ‌ها'}</dt>
                  <dd className="flex flex-wrap.5">
                    {detailOrder.batchIds.map((bid: string) => (
                      <span key={bid} className="steve-inline-link">
                        {titleOf(bid)}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {detailOrder.blocker ? (
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Blocker' : 'بلاکر'}</dt>
                  <dd className="text-[var(--color-steve-text-muted)]">{en ? ensureEnglish(detailOrder.blocker) : detailOrder.blocker}</dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap">
              {detailOrder.stage === 'hold' ? (
                <button type="button" className="steve-action is-primary" onClick={() => dispatch({ type: 'RELEASE_PRODUCTION_HOLD', id: detailOrder.id })}>
                  {en ? 'Release hold' : 'آزادسازی از Hold'}
                </button>
              ) : detailOrder.stage !== 'shipment' ? (
                <button type="button" className="steve-action is-primary" onClick={() => dispatch({ type: 'ADVANCE_PRODUCTION_ORDER', id: detailOrder.id })}>
                  {en ? 'Advance stage' : 'انتقال به مرحله بعد'}
                </button>
              ) : null}
              {detailOrder.workId ? (
                <Link to={`/work/${detailOrder.workId}`} className="steve-action">
                  {en ? 'Open related work' : 'باز کردن کار مرتبط'}
                </Link>
              ) : null}
              {detailOrder.materialBlockerIds?.length ? (
                <button type="button" className="steve-action" onClick={() => navigate('/agents?agent=agent-proc')}>
                  {en ? 'Open supply dashboard' : 'باز کردن داشبورد تأمین'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {detailBatch ? (
        <div className="fixed z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setDetailBatch(null)}>
          <div className="steve-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-[var(--color-steve-gold)]">{en ? 'Production batch' : 'بچ تولید'}</div>
                <h2 className="text-[18px]">{qcStatusLabel(detailBatch.qcStatus, en)}</h2>
              </div>
              <button type="button" className="text-[12px] text-[var(--color-steve-text-faint)]" onClick={() => setDetailBatch(null)}>
                {en ? 'Close' : 'بستن'}
              </button>
            </div>
            <dl className="text-[13px]">
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Note' : 'یادداشت'}</dt>
                <dd className="text-[var(--color-steve-text-muted)]">{en ? ensureEnglish(detailBatch.note) : detailBatch.note}</dd>
              </div>
              {detailBatch.qcRecordId ? (
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'QC record' : 'برگه QC'}</dt>
                  <dd>{titleOf(detailBatch.qcRecordId)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap">
              {detailBatch.qcStatus !== 'passed' ? (
                <button type="button" className="steve-action is-primary" onClick={() => dispatch({ type: 'SET_BATCH_QC', id: detailBatch.id, qcStatus: 'passed' })}>
                  {en ? 'Mark QC passed' : 'ثبت ترخیص QC'}
                </button>
              ) : null}
              {detailBatch.qcStatus !== 'quarantined' ? (
                <button type="button" className="steve-action" onClick={() => dispatch({ type: 'SET_BATCH_QC', id: detailBatch.id, qcStatus: 'quarantined' })}>
                  {en ? 'Quarantine batch' : 'قرنطینه بچ'}
                </button>
              ) : null}
              {detailBatch.workId ? (
                <Link to={`/work/${detailBatch.workId}`} className="steve-action">
                  {en ? 'Open related work' : 'باز کردن کار مرتبط'}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Supply — required vs available materials, shortages, purchases    */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SupplySurface({ en, d, state, idMap, dispatch, navigate, recordPath, detail, setDetail }: any) {
  const stats = supplyStats(state)
  const titleOf = (recId: string) => idMap.get(recId) || (en ? 'Business record' : 'رکورد کسب‌وکار')
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: en ? 'Materials short' : 'کسری موجودی', value: stats.shortages, icon: AlertTriangle },
          { label: en ? 'Critical items' : 'قلم بحرانی', value: stats.critical, icon: Boxes },
          { label: en ? 'Open purchase requests' : 'درخواست خرید باز', value: stats.openPurchases, icon: FileText },
          { label: en ? 'Incoming shipments' : 'در راه ورود', value: stats.incoming, icon: Truck },
        ].map((k) => (
          <div key={k.label} className="steve-surface flex items-center">
            <k.icon size={16} className="text-[var(--color-steve-green-bright)]" />
            <div>
              <div className="text-[11px] text-[var(--color-steve-text-faint)]">{k.label}</div>
              <div className="text-[22px] font-light">{d(k.value)}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="steve-brief">
        <div className="text-[11px] text-[var(--color-steve-text-muted)]">{en ? 'What we need vs. have' : 'چه چیزی لازم داریم در برابر چه چیزی داریم'}</div>
        <p className="text-[13.5px] text-[var(--color-steve-text-muted)]">
          {en
            ? 'Required covers open production orders; available is on-hand stock. A shortfall names which production order it is holding back.'
            : 'ستون «لازم» برای دستورهای تولید باز است؛ «در دسترس» موجودی فعلی است. کسری نشان می‌دهد کدام دستور تولید را عقب انداخته است.'}
        </p>
      </section>

      <section className="steve-surface overflow-x-auto p-4">
        <div className="text-[13.5px]">{en ? 'Materials' : 'مواد اولیه'}</div>
        <table className="w-full min-w-[920px] text-start text-[12.5px]">
          <thead className="text-[11px] text-[var(--color-steve-gold)]">
            <tr>
              <th className="font-medium">{en ? 'Material' : 'ماده'}</th>
              <th className="font-medium">{en ? 'Required' : 'لازم'}</th>
              <th className="font-medium">{en ? 'Available' : 'در دسترس'}</th>
              <th className="font-medium">{en ? 'Shortfall' : 'کسری'}</th>
              <th className="font-medium">{en ? 'Incoming' : 'در راه'}</th>
              <th className="font-medium">{en ? 'Supplier' : 'تامین‌کننده'}</th>
              <th className="font-medium">{en ? 'Production affected' : 'دستور تولید تحت‌تاثیر'}</th>
            </tr>
          </thead>
          <tbody>
            {state.inventory.map((inv: InventoryItem) => {
              const required = inv.requiredQty ?? inv.reorder
              const shortfall = Math.max(0, required - inv.onHand)
              return (
                <tr key={inv.id} className="cursor-pointer border-t border-[var(--color-steve-border-soft)] hover:bg-[var(--steve-hover-soft)]" onClick={() => setDetail(inv)}>
                  <td className=".5">{en ? ensureEnglish(inv.sku) : inv.sku}</td>
                  <td dir="ltr">{d(required)} {en ? ensureEnglish(inv.unit) : inv.unit}</td>
                  <td dir="ltr">
                    <span className={cn(inv.status === 'danger' && 'text-[var(--color-steve-danger)]', inv.status === 'warning' && 'text-[var(--color-steve-gold)]')}>{d(inv.onHand)}</span> {en ? ensureEnglish(inv.unit) : inv.unit}
                  </td>
                  <td dir="ltr">{shortfall > 0 ? d(shortfall) : '—'}</td>
                  <td dir="ltr">{inv.incomingQty ? `${d(inv.incomingQty)} ${en ? ensureEnglish(inv.unit) : inv.unit} · ${en ? ensureEnglish(inv.incomingEta || '') : inv.incomingEta}` : '—'}</td>
                  <td>{inv.supplier ? (en ? ensureEnglish(inv.supplier) : inv.supplier) : '—'}</td>
                  <td className="flex flex-wrap">
                    {(inv.affectedOrderIds || []).length
                      ? inv.affectedOrderIds!.map((oid) => (
                          <span key={oid} className="steve-inline-link">
                            {titleOf(oid)}
                          </span>
                        ))
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="steve-surface overflow-x-auto p-4">
        <div className="text-[13.5px]">{en ? 'Purchase requirements' : 'درخواست‌های خرید'}</div>
        <table className="w-full min-w-[760px] text-start text-[12.5px]">
          <thead className="text-[11px] text-[var(--color-steve-gold)]">
            <tr>
              <th className="font-medium">{en ? 'Title' : 'عنوان'}</th>
              <th className="font-medium">{en ? 'Supplier' : 'تامین‌کننده'}</th>
              <th className="font-medium">{en ? 'Status' : 'وضعیت'}</th>
              <th className="font-medium">{en ? 'Due' : 'مهلت'}</th>
            </tr>
          </thead>
          <tbody>
            {state.purchases.map((p: { id: string; title: string; supplier: string; status: string; due: string }) => (
              <tr key={p.id} className="cursor-pointer border-t border-[var(--color-steve-border-soft)] hover:bg-[var(--steve-hover-soft)]" onClick={() => navigate(recordPath('purchase', p.id))}>
                <td className=".5">{en ? ensureEnglish(p.title) : p.title}</td>
                <td>{en ? ensureEnglish(p.supplier) : p.supplier}</td>
                <td>
                  <Badge tone={p.status === 'pending' ? 'warning' : p.status === 'approved' ? 'success' : 'danger'}>{p.status}</Badge>
                </td>
                <td dir={en ? 'ltr' : undefined}>{en ? ensureEnglish(p.due) : p.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {detail ? (
        <div className="fixed z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setDetail(null)}>
          <div className="steve-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-[16px]">{en ? ensureEnglish(detail.sku) : detail.sku}</h2>
              <button type="button" className="text-[12px] text-[var(--color-steve-text-faint)]" onClick={() => setDetail(null)}>
                {en ? 'Close' : 'بستن'}
              </button>
            </div>
            <dl className="text-[13px]">
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'On hand / warehouse' : 'موجودی / انبار'}</dt>
                <dd dir="ltr">{d(detail.onHand)} {en ? ensureEnglish(detail.unit) : detail.unit} — {en ? ensureEnglish(detail.warehouse) : detail.warehouse}</dd>
              </div>
              {detail.purchaseRequestId ? (
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Purchase request' : 'درخواست خرید'}</dt>
                  <dd>{titleOf(detail.purchaseRequestId)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap">
              {detail.purchaseRequestId && state.purchases.find((p: { id: string; status: string }) => p.id === detail.purchaseRequestId)?.status === 'pending' ? (
                <>
                  <button type="button" className="steve-action is-primary" onClick={() => dispatch({ type: 'APPROVE_PURCHASE', id: detail.purchaseRequestId })}>
                    {en ? 'Approve purchase' : 'تایید خرید'}
                  </button>
                  <button type="button" className="steve-action" onClick={() => dispatch({ type: 'REJECT_PURCHASE', id: detail.purchaseRequestId })}>
                    {en ? 'Reject purchase' : 'رد خرید'}
                  </button>
                </>
              ) : null}
              {detail.incomingQty ? (
                <button type="button" className="steve-action" onClick={() => dispatch({ type: 'RECEIVE_INCOMING_SUPPLY', id: detail.id })}>
                  {en ? 'Mark incoming received' : 'ثبت ورود کالای در راه'}
                </button>
              ) : null}
              {(detail.affectedOrderIds || []).length ? (
                <button type="button" className="steve-action" onClick={() => navigate('/agents?agent=agent-fuel')}>
                  {en ? 'Open production dashboard' : 'باز کردن داشبورد تولید'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Finance & Settlements                                               */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SettlementSurface({ en, state, dispatch, navigate, detail, setDetail }: any) {
  const stats = settlementStats(state)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: en ? 'Open assignments' : 'تخصیص باز', value: stats.open },
          { label: en ? 'Awaiting confirmation' : 'منتظر تایید', value: stats.awaiting },
          { label: en ? 'Ready for settlement' : 'آماده تسویه', value: stats.ready },
          { label: en ? 'Outstanding payable (M)' : 'مانده قابل پرداخت (م)', value: stats.outstanding },
        ].map((k) => (
          <div key={k.label} className="steve-surface">
            <div className="text-[11px] text-[var(--color-steve-text-faint)]">{k.label}</div>
            <div className=".5 text-[22px] font-light">{k.value}</div>
          </div>
        ))}
      </div>

      <section className="steve-brief">
        <div className="text-[11px] text-[var(--color-steve-text-muted)]">{en ? 'Operating model' : 'مدل عملیاتی'}</div>
        <p className="text-[13.5px] text-[var(--color-steve-text-muted)]">
          {en
            ? 'Contractor / supplier assignment → confirmation → settlement. Focus is who was assigned what for the plant, what was completed, and what remains payable.'
            : 'تخصیص کار به پیمانکار / تامین‌کننده → تایید → تسویه. تمرکز روی این است که به چه کسی چه کاری برای کارخانه سپرده شده، چه چیزی انجام شده و چه مبلغی مانده است.'}
        </p>
      </section>

      <section className="steve-surface overflow-x-auto p-4">
        <div className="text-[13.5px]">{en ? 'Assignments' : 'تخصیص‌ها'}</div>
        <table className="w-full min-w-[860px] text-start text-[12.5px]">
          <thead className="text-[11px] text-[var(--color-steve-gold)]">
            <tr>
              <th className="font-medium">{en ? 'Contractor / supplier' : 'پیمانکار / تامین‌کننده'}</th>
              <th className="font-medium">{en ? 'Unit' : 'واحد'}</th>
              <th className="font-medium">{en ? 'Task' : 'وظیفه'}</th>
              <th className="font-medium">{en ? 'Status' : 'وضعیت'}</th>
              <th className="font-medium">{en ? 'Approved' : 'مصوب'}</th>
              <th className="font-medium">{en ? 'Paid' : 'پرداخت‌شده'}</th>
              <th className="font-medium">{en ? 'Outstanding' : 'مانده'}</th>
            </tr>
          </thead>
          <tbody>
            {state.settlements.map((s: SettlementAssignment) => (
              <tr key={s.id} className="cursor-pointer border-t border-[var(--color-steve-border-soft)] hover:bg-[var(--steve-hover-soft)]" onClick={() => setDetail(s)}>
                <td className=".5">{en ? ensureEnglish(s.agentName) : s.agentName}</td>
                <td>{en ? ensureEnglish(s.unitLabel) : s.unitLabel}</td>
                <td>{en ? ensureEnglish(s.task) : s.task}</td>
                <td>{settlementLabel(s.status, en)}</td>
                <td>{s.approvedAmount}</td>
                <td>{s.paidAmount}</td>
                <td className={cn(s.outstandingAmount > 0 && 'text-[var(--color-steve-gold)]')}>{s.outstandingAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {detail ? (
        <div className="fixed z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setDetail(null)}>
          <div className="steve-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-[var(--color-steve-gold)]">{en ? 'Settlement assignment' : 'تخصیص تسویه'}</div>
                <h2 className="text-[18px]">{en ? ensureEnglish(detail.task) : detail.task}</h2>
              </div>
              <button type="button" className="text-[12px] text-[var(--color-steve-text-faint)]" onClick={() => setDetail(null)}>
                {en ? 'Close' : 'بستن'}
              </button>
            </div>
            <dl className="text-[13px]">
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Contractor / supplier' : 'پیمانکار / تامین‌کننده'}</dt>
                <dd>{en ? ensureEnglish(detail.agentName) : detail.agentName}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Evidence' : 'شواهد'}</dt>
                <dd className="text-[var(--color-steve-text-muted)]">{en ? ensureEnglish(detail.evidence) : detail.evidence}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Confirmation' : 'تایید'}</dt>
                <dd>{en ? ensureEnglish(detail.confirmation) : detail.confirmation}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Settlement status' : 'وضعیت تسویه'}</dt>
                <dd>{settlementLabel(detail.status, en)}</dd>
              </div>
              <div className="grid">
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Approved' : 'مصوب'}</dt>
                  <dd>{detail.approvedAmount}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Paid' : 'پرداخت'}</dt>
                  <dd>{detail.paidAmount}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-[var(--color-steve-text-faint)]">{en ? 'Outstanding' : 'مانده'}</dt>
                  <dd>{detail.outstandingAmount}</dd>
                </div>
              </div>
            </dl>
            <div className="flex flex-wrap">
              {(detail.status === 'pending_confirmation' || detail.status === 'submitted') && (
                <button type="button" className="steve-action is-primary" onClick={() => dispatch({ type: 'CONFIRM_SETTLEMENT', id: detail.id })}>
                  {en ? 'Confirm assignment' : 'تایید تخصیص'}
                </button>
              )}
              {(detail.status === 'ready_for_settlement' || detail.status === 'partially_settled') && detail.outstandingAmount > 0 && (
                <button type="button" className="steve-action is-primary" onClick={() => dispatch({ type: 'MARK_SETTLEMENT_PAID', id: detail.id })}>
                  {en ? 'Mark settled / paid' : 'ثبت پرداخت / تسویه'}
                </button>
              )}
              {detail.workId ? (
                <button type="button" className="steve-action" onClick={() => navigate(`/work/${detail.workId}`)}>
                  {en ? 'Open related work' : 'باز کردن کار مرتبط'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AgentDetailPage() {
  return <AgentsPage />
}
