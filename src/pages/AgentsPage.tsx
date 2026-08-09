import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { SoftTabs, Segmented } from '../components/layout/PageChrome'
import { useEffect, useMemo, useState } from 'react'
import { FileText, Clock3, BarChart3 } from 'lucide-react'
import { toPersianDigits } from '../lib/format'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '../lib/utils'
import { VisualMonitoring } from '../components/ui/VisualMonitoring'
import { Ltr, useLocale } from '../i18n/LocaleProvider'
import { ensureEnglish } from '../i18n/ensureEnglish'
import { enContent } from '../i18n/enContent'

type EnKpi = { label?: string; value?: string; hint?: string }

export function AgentsPage() {
  const { state, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc, tStatus, tStage } = useLocale()
  const [params] = useSearchParams()
  const { id: routeAgentId } = useParams()
  const initialAgent =
    routeAgentId ||
    params.get('agent') ||
    state.agents.find((a) => a.status === 'attention')?.id ||
    state.agents[0]?.id
  const [domain, setDomain] = useState(initialAgent)
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  useEffect(() => {
    const q = routeAgentId || params.get('agent')
    if (q && state.agents.some((a) => a.id === q)) setDomain(q)
    if (params.get('lane') === 'cameras') setLane('cameras')
  }, [params, routeAgentId, state.agents])

  const agent = state.agents.find((a) => a.id === domain) || state.agents[0]
  const [tab, setTab] = useState('overview')
  const [lane, setLane] = useState(params.get('lane') === 'cameras' ? 'cameras' : 'ops')
  const [period, setPeriod] = useState('periodMordad')

  const periodScale = period === 'periodWeek' ? 0.82 : period === 'periodTir' ? 0.94 : 1
  const chart = useMemo(
    () =>
      state.fuelSeries.map((row) => ({
        day: row.day,
        value: Math.round((row.benzine + row.gasoil) * 20 * periodScale),
      })),
    [state.fuelSeries, periodScale],
  )
  const pendingTx = state.transactions.filter((tx) => tx.status === 'pending' && (agent.id.includes('fin') || tx.agentId === agent.id || !tx.agentId))
  const pendingPr = state.purchases.filter((p) => p.status === 'pending')
  const agentWork = state.workItems.filter((w) => agent.workIds.includes(w.id) || w.owner.includes(agent.name.split(' ')[0]))
  const agentAlerts = state.alerts.filter((a) => (agent.riskIds.includes(a.id) || a.status === 'open') && a.status === 'open').slice(0, 6)

  const enKpis = useMemo(() => {
    if (locale !== 'en' || !agent) return null
    const bag = (enContent.agents as unknown as Record<string, { kpis?: EnKpi[] }>)[agent.id]
    return bag?.kpis || null
  }, [locale, agent])

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

  if (!agent) return null

  const roleLabel = loc(agent.role, 'agents', agent.id, 'role')
  const isFinance = agent.role.includes('مالی') || roleLabel.toLowerCase().includes('finance')

  return (
    <div className="steve-page space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="text-[30px] font-light tracking-tight">{loc(agent.name, 'agents', agent.id, 'name')}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-[var(--color-steve-green-bright)]">● {tStatus(agent.status)}</span>
            <span className="text-[var(--color-steve-text-faint)]">•</span>
            <span className="text-[var(--color-steve-text-muted)]">{loc(agent.domain, 'agents', agent.id, 'domain')}</span>
            <span className="text-[var(--color-steve-text-faint)]">•</span>
            <span className="text-[var(--color-steve-text-muted)]">{t('agents.updated')}</span>
          </div>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] px-3.5 py-1.5 text-[12px]">
          <option value="periodMordad">{t('agents.periodMordad')}</option>
          <option value="periodTir">{t('agents.periodTir')}</option>
          <option value="periodWeek">{t('agents.periodWeek')}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={lane}
          onChange={setLane}
          options={[
            { id: 'ops', label: isFinance ? t('agents.finance') : t('agents.ops') },
            { id: 'cameras', label: t('agents.cameras') },
            { id: 'inspect', label: t('agents.inspect') },
          ]}
        />
        <select
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value)
            navigate(`/agents?agent=${e.target.value}`)
          }}
          className="h-9 rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] px-3 text-[12px]"
        >
          {state.agents.map((a) => (
            <option key={a.id} value={a.id}>
              {loc(a.name, 'agents', a.id, 'name')}
            </option>
          ))}
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

      {lane === 'inspect' ? (
        <div className="steve-surface p-5 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">
          {t('agents.inspectSummary', {
            mastery: d(agent.mastery),
            alignment: d(agent.alignment),
            systems: agent.systems.join(locale === 'fa' ? '، ' : ', '),
          })}
          <div className="mt-3 flex flex-wrap gap-2">
            {agent.systems.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </div>
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

      <section className="steve-brief px-5 py-5">
        <div className="mb-2 text-[11px] tracking-[0.18em] text-[var(--color-steve-text-muted)]">{t('agents.brief')}</div>
        <p className="max-w-[980px] text-[14px] leading-[1.85]">{loc(agent.summary, 'agents', agent.id, 'summary')}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {agent.kpis.map((k, i) => (
          <div key={k.id} className="steve-surface px-4 py-4">
            <div className="text-[11px] text-[var(--color-steve-text-faint)]">{locale === 'en' ? ensureEnglish(enKpis?.[i]?.label || k.label) : k.label}</div>
            <div className="mt-2 text-[24px] font-light">{locale === 'en' ? ensureEnglish(enKpis?.[i]?.value || k.value) : k.value}</div>
            <div className={cn('mt-2 text-[12px]', k.delta >= 0 ? 'text-[var(--color-steve-green-bright)]' : 'text-[var(--color-steve-text-muted)]')}>{locale === 'en' ? ensureEnglish(enKpis?.[i]?.hint || k.hint) : k.hint}</div>
          </div>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="steve-surface p-5">
            <div className="mb-4 text-[14px]">{t('agents.trendPeriod', { period: t(`agents.${period}`) })}</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                  <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--color-steve-border)', borderRadius: 12 }} />
                  <ReferenceLine y={120 * periodScale} stroke="var(--chart-2)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-1)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="steve-surface p-5">
            <div className="mb-3 text-[14px]">{t('agents.needsAttention')}</div>
            {agentAlerts.map((r, i) => {
              const Icon = [FileText, Clock3, BarChart3][i % 3]
              return (
                <button key={r.id} type="button" className="flex w-full items-center gap-3 border-b border-[var(--color-steve-border-soft)] py-3 text-start last:border-0" onClick={() => navigate(recordPath(r.recordType, r.recordId))}>
                  <Icon size={15} className="text-[var(--color-steve-text-faint)]" />
                  <div className="min-w-0 flex-1 text-[13px]">{loc(r.title, 'alerts', r.id, 'title')}</div>
                  <div className="text-[11px] text-[var(--color-steve-gold)]">{r.time}</div>
                </button>
              )
            })}
            {!agentAlerts.length ? <div className="text-[12px] text-[var(--color-steve-text-faint)]">{t('agents.noOpen')}</div> : null}
          </section>
        </div>
      ) : null}

      {tab === 'cash' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="steve-surface p-5">
            <div className="mb-3 text-[14px]">{t('agents.pendingTx')}</div>
            {pendingTx.length ? (
              pendingTx.map((tx) => (
                <button key={tx.id} type="button" className="flex w-full items-center gap-3 border-b border-[var(--color-steve-border-soft)] py-3 text-start" onClick={() => navigate(recordPath('transaction', tx.id))}>
                  <FileText size={15} className="text-[var(--color-steve-text-faint)]" />
                  <div className="min-w-0 flex-1 text-[13px]">{loc(tx.title, 'transactions', tx.id, 'title')}</div>
                  <div className="text-[11px] text-[var(--color-steve-gold)]">{loc(tx.amountLabel, 'transactions', tx.id, 'amountLabel')}</div>
                </button>
              ))
            ) : (
              <div className="text-[12px] text-[var(--color-steve-text-faint)]">{t('agents.noTx')}</div>
            )}
          </section>
          <section className="steve-surface p-5">
            <div className="mb-3 text-[14px]">{t('agents.pendingPr')}</div>
            {pendingPr.length ? (
              pendingPr.map((pr) => (
                <button key={pr.id} type="button" className="flex w-full items-center gap-3 border-b border-[var(--color-steve-border-soft)] py-3 text-start" onClick={() => navigate(recordPath('purchase', pr.id))}>
                  <Clock3 size={15} className="text-[var(--color-steve-text-faint)]" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    {pr.title ? loc(pr.title, 'purchases', pr.id, 'title') : <Ltr>{pr.id}</Ltr>}
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
            <Link key={w.id} to={`/work/${w.id}`} className="flex items-center justify-between border-b border-[var(--color-steve-border-soft)] py-3 text-[13px]">
              <span>{loc(w.title, 'workItems', w.id, 'title')}</span>
              <Badge>{tStage(w.stage)}</Badge>
            </Link>
          ))}
        </div>
      ) : null}

      {tab === 'risks' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="steve-surface p-5">
            <div className="text-[13px] text-[var(--color-steve-gold)]">{t('agents.openDecisions')}</div>
            <ul className="mt-3 space-y-2 text-[13px] text-[var(--color-steve-text-muted)]">
              {(agent.decisionIds.length ? agent.decisionIds : [...pendingPr.map((p) => p.id), ...pendingTx.map((tx) => tx.id)].slice(0, 4)).map((decisionId) => (
                <li key={decisionId}>
                  <button type="button" className="text-[var(--color-steve-green-bright)]" onClick={() => openDecision(decisionId)}>
                    <Ltr>{decisionId}</Ltr>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="steve-surface p-5">
            <div className="text-[13px] text-[var(--color-steve-gold)]">{t('agents.links')}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/plan" className="rounded-full border border-[var(--color-steve-border)] px-3 py-1.5 text-[12px]">
                {t('nav.plan')}
              </Link>
              <Link to="/map" className="rounded-full border border-[var(--color-steve-border)] px-3 py-1.5 text-[12px]">
                {t('nav.map')}
              </Link>
              <Link to="/communication" className="rounded-full border border-[var(--color-steve-border)] px-3 py-1.5 text-[12px]">
                {t('nav.communication')}
              </Link>
              <Link to="/intelligence" className="rounded-full border border-[var(--color-steve-border)] px-3 py-1.5 text-[12px]">
                {t('nav.intelligence')}
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div className="steve-surface space-y-2 p-5">
          {agent.activity.map((a) => (
            <div key={a.id} className="text-[13px] text-[var(--color-steve-text-muted)]">
              {a.time} — {a.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AgentDetailPage() {
  return <AgentsPage />
}
