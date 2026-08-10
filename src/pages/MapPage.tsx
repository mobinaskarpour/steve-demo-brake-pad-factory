import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Database, FileText, MessageSquare, Users, Wallet } from 'lucide-react'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { PageHero, SoftTabs, Segmented } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { VisualEvidence } from '../components/ui/VisualMonitoring'
import { useAskSteve } from '../components/layout/AskSteveContext'
import { cn } from '../lib/utils'
import { SearchField } from '../components/ui/SearchField'
import { Ltr, useLocale } from '../i18n/LocaleProvider'
import { getEnConfig } from '../i18n/enContent'
import { toPersianDigits } from '../lib/format'

type NodeData = {
  kicker?: string
  label: string
  owner?: string
  agent?: string
  statusLine?: string
  alertLine?: string
  tone?: 'default' | 'warning' | 'danger' | 'goal' | 'obligation'
  unitId?: string
  agentId?: string
}

type LocFn = (fa: string | undefined | null, collection: string, id: string, field: string) => string
type TFn = (key: string, opts?: Record<string, unknown>) => string

function SteveMapNode({ data, selected }: NodeProps) {
  const { t } = useTranslation()
  const d = data as NodeData
  return (
    <div className={cn('steve-map-node', selected && 'is-active', d.tone && d.tone !== 'default' && `is-${d.tone}`)}>
      <Handle type="target" position={Position.Top} />
      <div className="steve-map-node-title">{d.label}</div>
      <div className="steve-map-node-agent">
        <span className="steve-map-dot" />
        <span>{d.agent || d.owner || t('map.agentActive')}</span>
      </div>
      {d.statusLine ? <div className="steve-map-node-meta">{d.statusLine}</div> : null}
      {d.alertLine ? <div className="steve-map-node-alert">{d.alertLine}</div> : null}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} id="l" />
      <Handle type="target" position={Position.Right} id="r" />
    </div>
  )
}

const nodeTypes = { steve: SteveMapNode }

const edgeStyle: CSSProperties = { stroke: 'var(--flow-edge)', strokeWidth: 1.15 }
const edgeOpts = {
  type: 'smoothstep' as const,
  style: edgeStyle,
  labelStyle: { fill: 'var(--flow-label)', fontSize: 10 },
  labelBgStyle: { fill: 'var(--color-steve-page)' },
  labelBgPadding: [4, 2] as [number, number],
  markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--flow-edge)', width: 12, height: 12 },
}

export function MapPage() {
  const { state, recordPath } = useDemo()
  const { setContext } = useAskSteve()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, loc } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const question = locale === 'en' ? enCfg.mapQuestion || appConfig.mapQuestion : appConfig.mapQuestion
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() => {
    const v = searchParams.get('tab')
    return v === 'goals' || v === 'systems' || v === 'authority' || v === 'operating' ? v : 'operating'
  })
  const [mode, setMode] = useState<'live' | 'design'>(() => (searchParams.get('mode') === 'design' ? 'design' : 'live'))
  const [selectedId, setSelectedId] = useState('unit-holding')
  const [sysQuery, setSysQuery] = useState('')
  const [sysFilter, setSysFilter] = useState('all')
  const [authFilter, setAuthFilter] = useState('ops')
  const [authQuery, setAuthQuery] = useState('')
  const [authSelected, setAuthSelected] = useState('auth-1')

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    if (mode === 'design') next.set('mode', 'design')
    else next.delete('mode')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mode])

  const operating = useMemo(() => buildOperating(state, loc, t), [state, loc, t])
  const goals = useMemo(() => buildGoals(state, loc, t), [state, loc, t])

  const graph = tab === 'goals' ? goals : operating
  const selected = graph.nodes.find((n) => n.id === selectedId) || graph.nodes[1] || graph.nodes[0]

  useEffect(() => {
    if (tab === 'operating') {
      const prefer = state.units.find((u) => u.status === 'danger' || u.status === 'warning') || state.units.find((u) => u.id !== 'unit-holding') || state.units[0]
      if (prefer) setSelectedId(prefer.id)
    }
    if (tab === 'goals') setSelectedId('goal-main')
  }, [tab, state.units])

  useEffect(() => {
    if (tab === 'operating' || tab === 'goals') {
      const n = (selected?.data || {}) as NodeData
      setContext({
        label: n.label || t('map.title'),
        kind: tab === 'goals' ? t('map.goals') : t('map.operating'),
        recordType: 'agent',
        recordId: n.agentId || 'agent-wh',
        prompts: [t('map.askRisk', { label: n.label }), t('map.askKpis'), t('map.askOpenWork'), t('map.askOpenAgent')],
      })
    } else if (tab === 'systems') {
      setContext({ label: t('map.systems'), kind: t('map.title'), prompts: [t('map.askSystemsAttention'), t('map.askEvidenceCoverage')] })
    } else {
      setContext({ label: t('map.authorityGovernance'), kind: t('map.title'), prompts: [t('map.askAuthorityReview'), t('map.askPurchaseCeiling')] })
    }
    return () => setContext(null)
  }, [tab, selectedId, setContext, selected, t])

  const flowNodes: Node[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        ...n,
        type: 'steve',
        selected: n.id === selectedId,
      })),
    [graph.nodes, selectedId],
  )

  return (
    <div className="steve-page space-y-4">
      <PageHero
        title={t('map.title')}
        subtitle={question}
        actions={
          <Segmented
            value={mode}
            onChange={(id) => setMode(id as 'live' | 'design')}
            options={[
              { id: 'live', label: t('actions.live') },
              { id: 'design', label: t('actions.design') },
            ]}
          />
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <SoftTabs
          value={tab}
          onChange={(id) => {
            setTab(id)
          }}
          tabs={[
            { id: 'operating', label: t('map.operating') },
            { id: 'goals', label: t('map.goals') },
            { id: 'systems', label: t('map.systems') },
            { id: 'authority', label: t('map.authority') },
          ]}
        />
        <div className="pb-2 text-[11px] text-[var(--color-steve-gold)]">
          {t('map.metaLine', { mode: mode === 'live' ? t('actions.live') : t('actions.design') })}
        </div>
      </div>

      {tab === 'operating' || tab === 'goals' ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <section className="steve-surface overflow-hidden">
            {tab === 'goals' ? <div className="border-b border-[var(--color-steve-border)] px-4 py-2 text-[11px] tracking-wide text-[var(--color-steve-gold)]">{t('map.goalFocus')}</div> : null}
            <div className="relative h-[560px] bg-[var(--color-steve-page)]">
              <ReactFlow
                nodes={flowNodes}
                edges={graph.edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.22 }}
                onNodeClick={(_, node) => setSelectedId(node.id)}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={mode === 'design'}
                nodesConnectable={false}
                panOnScroll
                minZoom={0.55}
                maxZoom={1.35}
                defaultEdgeOptions={edgeOpts}
              >
                <Background gap={32} color="var(--flow-dot)" size={1} />
                <Controls position="top-left" showInteractive={false} />
              </ReactFlow>
            </div>
          </section>
          <NodeDetailPanel tab={tab} selected={selected} state={state} recordPath={recordPath} navigate={navigate} />
        </div>
      ) : null}

      {tab === 'systems' ? <SystemsView query={sysQuery} setQuery={setSysQuery} filter={sysFilter} setFilter={setSysFilter} /> : null}

      {tab === 'authority' ? (
        <AuthorityView filter={authFilter} setFilter={setAuthFilter} query={authQuery} setQuery={setAuthQuery} selected={authSelected} setSelected={setAuthSelected} />
      ) : null}
    </div>
  )
}

function NodeDetailPanel({
  tab,
  selected,
  state,
  recordPath,
  navigate,
}: {
  tab: string
  selected?: Node
  state: ReturnType<typeof useDemo>['state']
  recordPath: (typ: string, id: string) => string
  navigate: ReturnType<typeof useNavigate>
}) {
  const { t } = useTranslation()
  const { loc } = useLocale()
  const d = (selected?.data || {}) as NodeData
  const unitId = d.unitId
  const unit = unitId ? state.units.find((u) => u.id === unitId) : undefined
  const agent = d.agentId
    ? state.agents.find((a) => a.id === d.agentId)
    : unit
      ? state.agents.find((a) => a.id === unit.agentId)
      : state.agents.find((a) => a.id === state.agents[0]?.id)
  const alert = unit ? state.alerts.find((a) => a.unitId === unit.id && a.status === 'open') : state.alerts.find((a) => a.status === 'open')
  const agentHref = `/agents?agent=${agent?.id || state.agents[0]?.id || 'agent-exec'}`
  const relatedFeed = unit ? state.visualFeeds.find((f) => f.unitId === unit.id) : undefined

  if (tab === 'goals') {
    const goal = state.goals[1] || state.goals[0]
    return (
      <section className="steve-surface p-5 text-[13px]">
        <div className="text-[11px] tracking-[0.14em] text-[var(--color-steve-gold)]">{t('map.orgGoal')}</div>
        <div className="mt-2 text-[18px] font-light">{d.label}</div>
        <p className="mt-2 leading-7 text-[var(--color-steve-text-muted)]">{t('map.goalBody')}</p>
        <div className="mt-4 space-y-2 border-t border-[var(--color-steve-border-soft)] pt-3 text-[12px]">
          <KV k={t('map.ownerDecision')} v={t('map.ownerDecisionValue')} />
          <KV k={t('map.statusPriority')} v={<span className="text-[var(--color-steve-green-bright)]">{t('map.statusPriorityValue')}</span>} />
          <KV k={t('map.horizon')} v={goal ? loc(goal.due, 'goals', goal.id, 'due') : t('plan.horizon')} />
          <KV k={t('map.mainTarget')} v={goal ? loc(goal.target, 'goals', goal.id, 'target') : '—'} />
          <KV
            k={t('map.participatingNodes')}
            v={
              state.units
                .filter((u) => u.id !== 'unit-holding')
                .slice(0, 3)
                .map((u) => loc(u.name, 'units', u.id, 'name'))
                .join(' · ') || '—'
            }
          />
          <KV k={t('map.guardrail')} v={t('map.guardrailValue')} />
        </div>
        {goal?.risk ? (
          <div className="mt-4 rounded-xl border border-[var(--notice-warning-border)] bg-[var(--notice-warning-bg)] px-3 py-2.5 text-[12px] text-[var(--color-steve-gold-soft)]">
            <Ltr>{loc(goal.risk, 'goals', goal.id, 'risk')}</Ltr>
          </div>
        ) : null}
        <Link to="/plan" className="mt-4 flex w-full items-center justify-center rounded-xl bg-[var(--color-steve-green)] px-3 py-2.5 text-white">
          {t('map.openInPlan')}
        </Link>
        <button type="button" className="mt-2 w-full text-center text-[12px] text-[var(--color-steve-gold)]" onClick={() => navigate('/work/work-wh-1')}>
          {t('map.trackContribution')}
        </button>
      </section>
    )
  }

  return (
    <section className="steve-surface p-5 text-[13px]">
      <div className="text-[11px] tracking-[0.14em] text-[var(--color-steve-gold)]">
        {t('map.node')} {d.kicker || t('map.opsNode')}
      </div>
      <div className="mt-2 text-[18px] font-light">{d.label}</div>
      <p className="mt-2 leading-7 text-[var(--color-steve-text-muted)]">
        {unit ? loc(unit.summary, 'units', unit.id, 'summary') : t('map.nodeFallbackSummary')}
      </p>
      <div className="mt-4 space-y-2 border-t border-[var(--color-steve-border-soft)] pt-3 text-[12px]">
        <KV k={t('map.owner')} v={d.owner || (unit ? loc(unit.owner, 'units', unit.id, 'owner') : '—')} />
        <KV
          k={t('map.nodeAgent')}
          v={
            <span className="text-[var(--color-steve-green-bright)]">
              {d.agent || (agent ? loc(agent.name, 'agents', agent.id, 'name') : t('status.active'))} ●
            </span>
          }
        />
        <KV k={t('map.currentState')} v={d.statusLine || (unit ? loc(unit.kpiValue, 'units', unit.id, 'kpiValue') : '—')} />
        <KV k={t('map.authorityLimit')} v={t('map.authorityValue')} />
        <KV
          k={t('map.systemsLabel')}
          v={
            <span className="flex flex-wrap gap-1">
              {(agent?.systems || ['ERP', t('map.inboxSystem')]).slice(0, 2).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </span>
          }
        />
      </div>
      {alert || d.alertLine ? (
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-[var(--notice-warning-border)] bg-[var(--notice-warning-bg)] px-3 py-2.5 text-start text-[12px] text-[var(--color-steve-gold-soft)]"
          onClick={() => {
            if (alert) navigate(recordPath(alert.recordType, alert.recordId))
            else navigate('/work')
          }}
        >
          {d.alertLine || (alert ? loc(alert.title, 'alerts', alert.id, 'title') : '')}
        </button>
      ) : null}
      {relatedFeed ? (
        <div className="mt-4">
          <VisualEvidence
            src={relatedFeed.src}
            caption={loc(relatedFeed.title, 'visualFeeds', relatedFeed.id, 'title')}
            meta={`${loc(relatedFeed.location, 'visualFeeds', relatedFeed.id, 'location')} · ${relatedFeed.time}`}
            onOpen={() => {
              if (relatedFeed.recordType && relatedFeed.recordId) navigate(`/records/${relatedFeed.recordType}/${relatedFeed.recordId}`)
              else if (unit) navigate(recordPath('unit', unit.id))
            }}
          />
        </div>
      ) : null}
      <button type="button" className="mt-4 flex w-full items-center justify-center rounded-xl bg-[var(--color-steve-green)] px-3 py-2.5 text-white" onClick={() => navigate(agentHref)}>
        {t('actions.openAgent')}
      </button>
      {unit ? (
        <button type="button" className="mt-2 w-full text-center text-[12px] text-[var(--color-steve-gold)]" onClick={() => navigate(recordPath('unit', unit.id))}>
          {t('actions.viewNode')}
        </button>
      ) : null}
    </section>
  )
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--color-steve-border-soft)] py-2">
      <span className="text-[var(--color-steve-gold)]">{k}</span>
      <span className="text-end">{v}</span>
    </div>
  )
}

function buildOperating(state: ReturnType<typeof useDemo>['state'], loc: LocFn, t: TFn) {
  const units = state.units
  const holding = units.find((u) => u.id === 'unit-holding') || units[0]
  const others = units.filter((u) => u.id !== holding?.id).slice(0, 8)
  const agentsById = Object.fromEntries(state.agents.map((a) => [a.id, a]))

  const layout = [
    { x: 40, y: 200 },
    { x: 320, y: 200 },
    { x: 600, y: 200 },
    { x: 40, y: 390 },
    { x: 220, y: 390 },
    { x: 400, y: 390 },
    { x: 580, y: 390 },
    { x: 760, y: 390 },
  ]

  const nodes: Node[] = [
    {
      id: holding.id,
      position: { x: 320, y: 28 },
      data: {
        label: loc(holding.name, 'units', holding.id, 'name'),
        owner: loc(holding.owner, 'units', holding.id, 'owner'),
        agent: loc(agentsById[holding.agentId]?.name || holding.owner, 'agents', holding.agentId, 'name') || loc(holding.owner, 'units', holding.id, 'owner'),
        statusLine: `${loc(holding.kpiLabel, 'units', holding.id, 'kpiLabel')} · ${loc(holding.kpiValue, 'units', holding.id, 'kpiValue')}`,
        unitId: holding.id,
        agentId: holding.agentId,
      },
    },
    ...others.map((u, i) => {
      const alert = state.alerts.find((a) => a.unitId === u.id && a.status === 'open')
      const tone = u.status === 'danger' ? 'danger' : u.status === 'warning' ? 'warning' : 'default'
      const agentName = loc(agentsById[u.agentId]?.name || u.owner, 'agents', u.agentId, 'name') || loc(u.owner, 'units', u.id, 'owner')
      return {
        id: u.id,
        position: layout[i] || { x: 40 + (i % 4) * 180, y: 200 + Math.floor(i / 4) * 190 },
        data: {
          label: loc(u.name, 'units', u.id, 'name'),
          owner: loc(u.owner, 'units', u.id, 'owner'),
          agent: t('map.agentSuffix', { name: agentName }),
          statusLine: `${loc(u.kpiLabel, 'units', u.id, 'kpiLabel')} · ${loc(u.kpiValue, 'units', u.id, 'kpiValue')}`,
          alertLine: alert ? loc(alert.title, 'alerts', alert.id, 'title') : u.alert ? loc(u.alert, 'units', u.id, 'alert') : undefined,
          tone,
          unitId: u.id,
          agentId: u.agentId,
        },
      }
    }),
  ]

  const mid = others.slice(0, 3)
  const bottom = others.slice(3)
  const edges: Edge[] = [
    ...mid.map((u, i) => ({ id: `e-top-${i}`, source: holding.id, target: u.id, label: t('map.edgeAuthority'), ...edgeOpts })),
    ...bottom.map((u, i) => ({
      id: `e-bot-${i}`,
      source: mid[Math.min(i, mid.length - 1)]?.id || holding.id,
      target: u.id,
      label: t('map.edgeDependency'),
      ...edgeOpts,
    })),
  ]
  return { nodes, edges }
}

function buildGoals(state: ReturnType<typeof useDemo>['state'], loc: LocFn, t: TFn) {
  const g = state.goals[1] || state.goals[0]
  const g0 = state.goals[0]
  const units = state.units.filter((u) => u.id !== 'unit-holding').slice(0, 3)
  const init = state.initiatives[0]
  const pr = state.purchases.find((p) => p.status === 'pending')
  const nodes: Node[] = [
    {
      id: 'dir',
      position: { x: 300, y: 10 },
      data: { kicker: t('map.businessDirection'), label: g0 ? loc(g0.title, 'goals', g0.id, 'title') : t('map.strategicDirection'), tone: 'goal' },
    },
    {
      id: 'goal-main',
      position: { x: 300, y: 150 },
      data: {
        kicker: t('map.orgGoal'),
        label: g ? loc(g.title, 'goals', g.id, 'title') : t('map.currentGoal'),
        statusLine: `${g?.progress || 45}% · ${g ? loc(g.status, 'goals', g.id, 'status') : ''}`,
        tone: 'goal',
      },
    },
    {
      id: 'obl',
      position: { x: 620, y: 150 },
      data: {
        kicker: t('map.protectedCommitment'),
        label: g?.risk ? loc(g.risk, 'goals', g.id, 'risk') : t('map.keepCommitments'),
        tone: 'obligation',
        alertLine: g?.risk ? t('map.riskActive') : undefined,
      },
    },
    {
      id: 'out-a',
      position: { x: 40, y: 320 },
      data: {
        kicker: t('map.unitOutcome'),
        label: units[0] ? loc(units[0].name, 'units', units[0].id, 'name') : t('map.opsUnit'),
        statusLine: units[0] ? loc(units[0].kpiValue, 'units', units[0].id, 'kpiValue') : '—',
      },
    },
    {
      id: 'out-b',
      position: { x: 300, y: 320 },
      data: {
        kicker: t('map.unitOutcome'),
        label: units[1] ? loc(units[1].name, 'units', units[1].id, 'name') : t('map.secondUnit'),
        statusLine: units[1] ? loc(units[1].kpiValue, 'units', units[1].id, 'kpiValue') : '—',
      },
    },
    {
      id: 'target',
      position: { x: 560, y: 320 },
      data: {
        kicker: t('map.measuredTarget'),
        label: g ? loc(g.target, 'goals', g.id, 'target') : t('map.quantitativeTarget'),
        statusLine: t('map.periodicMeasure'),
      },
    },
    {
      id: 'init',
      position: { x: 160, y: 460 },
      data: {
        kicker: t('map.initiative'),
        label: init ? loc(init.title, 'initiatives', init.id, 'title') : t('map.currentInitiative'),
        statusLine: init ? loc(init.status, 'initiatives', init.id, 'status') : t('status.active'),
      },
    },
    {
      id: 'verified',
      position: { x: 480, y: 460 },
      data: {
        kicker: t('map.inFlowResult'),
        label: pr ? t('map.pendingQueue', { id: pr.id }) : t('map.opsEvidence'),
        statusLine: units[1] ? loc(units[1].name, 'units', units[1].id, 'name') : t('map.operations'),
      },
    },
  ]
  const edges: Edge[] = [
    { id: 'g1', source: 'dir', target: 'goal-main', label: t('map.edgeDefines'), ...edgeOpts },
    { id: 'g2', source: 'obl', target: 'goal-main', label: t('map.edgeConstrains'), ...edgeOpts },
    { id: 'g3', source: 'out-a', target: 'goal-main', label: t('map.edgeContributes'), ...edgeOpts },
    { id: 'g4', source: 'out-b', target: 'goal-main', label: t('map.edgeContributes'), ...edgeOpts },
    { id: 'g5', source: 'target', target: 'goal-main', label: t('map.edgeMeasures'), ...edgeOpts },
    { id: 'g6', source: 'out-b', target: 'obl', label: t('map.edgeFulfills'), ...edgeOpts },
    { id: 'g7', source: 'init', target: 'out-a', label: t('map.edgeContributes'), ...edgeOpts },
    { id: 'g8', source: 'init', target: 'target', label: t('map.edgeContributes'), ...edgeOpts },
    { id: 'g9', source: 'verified', target: 'out-b', label: t('map.edgeConfirms'), ...edgeOpts },
  ]
  return { nodes, edges }
}

function SystemsView({
  query,
  setQuery,
  filter,
  setFilter,
}: {
  query: string
  setQuery: (v: string) => void
  filter: string
  setFilter: (v: string) => void
}) {
  const { state, dispatch } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, loc, tStatus } = useLocale()
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  const connections = [
    ...state.agents.slice(0, 8).map((a, i) => ({
      id: `c-ag-${a.id}`,
      name: loc(a.name, 'agents', a.id, 'name'),
      cat: loc(a.domain, 'agents', a.id, 'domain'),
      status: a.status === 'attention' ? 'attention' : a.status === 'idle' ? 'paused' : 'active',
      sync: i % 4 === 0 ? t('map.syncAttention') : t('map.syncAgo', { n: d(i + 2) }),
      icon: i % 3 === 0 ? Wallet : i % 3 === 1 ? Database : FileText,
      unitId: a.unitId as string | undefined,
    })),
    ...state.units.slice(0, 4).map((u, i) => ({
      id: `c-u-${u.id}`,
      name: t('map.recordsOf', { name: loc(u.name, 'units', u.id, 'name') }),
      cat: loc(u.kind, 'units', u.id, 'kind'),
      status: u.status === 'danger' || u.status === 'warning' ? 'attention' : 'active',
      sync: u.alert ? t('map.alertActive') : t('map.syncAgo', { n: d(i + 3) }),
      icon: i % 2 === 0 ? Users : MessageSquare,
      unitId: u.id,
    })),
  ]
  const filtered = connections.filter((c) => {
    const qok = !query || c.name.includes(query) || c.cat.includes(query)
    const fok = filter === 'all' || (filter === 'active' && c.status === 'active') || (filter === 'attention' && c.status === 'attention') || (filter === 'paused' && c.status === 'paused')
    return qok && fok
  })

  return (
    <section className="steve-surface p-5">
      <div className="mb-1 text-[12px] text-[var(--color-steve-text-faint)]">{t('map.systemsDemoNote')}</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[16px]">{t('map.connections')}</div>
          <div className="mt-1 text-[12px] text-[var(--color-steve-text-faint)]">{t('map.connectionsStats')}</div>
        </div>
        <button
          type="button"
          className="steve-action is-primary"
          onClick={() => {
            dispatch({
              type: 'CREATE_FOLLOWUP',
              payload: {
                title: t('map.newConnectionWork'),
                unitId: state.units[0]?.id || 'unit-holding',
                fromRecordType: 'map',
                fromRecordId: 'systems',
                owner: state.units[0]?.owner || 'مدیر',
              },
            })
            navigate('/work')
          }}
        >
          {t('map.addConnection')}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <SearchField value={query} onChange={setQuery} placeholder={t('map.searchConnection')} />
        </div>
        {['all', 'active', 'attention', 'paused'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn('rounded-md px-3 py-1.5 text-[12px]', filter === f ? 'bg-[var(--color-steve-green-active)] text-[var(--color-steve-text)]' : 'border border-[var(--color-steve-border)] text-[var(--color-steve-text-faint)]')}
          >
            {f === 'all' ? t('map.all') : f === 'active' ? t('status.active') : f === 'attention' ? t('status.attention') : t('map.paused')}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.id}
              type="button"
              className="steve-surface flex flex-col gap-3 p-4 text-start transition hover:border-[var(--color-steve-brief-border)]"
              onClick={() => {
                if (c.unitId) navigate(`/records/unit/${c.unitId}`)
                else navigate('/work')
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-steve-elevated)] text-[var(--color-steve-gold)]">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">{c.name}</div>
                  <div className="text-[11px] text-[var(--color-steve-text-faint)]">{c.cat}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={cn(c.status === 'active' ? 'text-[var(--color-steve-green-bright)]' : c.status === 'attention' ? 'text-[var(--color-steve-warning)]' : 'text-[var(--color-steve-gold)]')}>
                  ● {c.status === 'active' ? t('status.active') : c.status === 'attention' ? tStatus('attention') : t('map.paused')}
                </span>
                <span className="text-[var(--color-steve-text-faint)]">{c.sync}</span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-4 text-[11px] text-[var(--color-steve-text-faint)]">{t('map.showingConnections', { shown: d(filtered.length) })}</div>
    </section>
  )
}

function AuthorityView({
  filter,
  setFilter,
  query,
  setQuery,
  selected,
  setSelected,
}: {
  filter: string
  setFilter: (v: string) => void
  query: string
  setQuery: (v: string) => void
  selected: string
  setSelected: (v: string) => void
}) {
  const { state } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { loc } = useLocale()

  const items = state.agents.slice(0, 6).map((a, i) => {
    const name = loc(a.name, 'agents', a.id, 'name')
    const role = loc(a.role, 'agents', a.id, 'role')
    const domain = loc(a.domain, 'agents', a.id, 'domain')
    const unit = state.units.find((u) => u.agentId === a.id)
    const owner = unit ? loc(unit.owner, 'units', unit.id, 'owner') : name
    return {
      id: `auth-${i + 1}`,
      title: a.role.includes('عامل') || role.toLowerCase().includes('agent') ? t('map.delegationOf', { role }) : t('map.authorityOf', { name }),
      agent: name,
      level: a.status === 'attention' ? t('map.executeWithApproval') : a.status === 'idle' ? t('map.observeDraft') : t('map.limitedExec'),
      detail: a.summary ? loc(a.summary, 'agents', a.id, 'summary') : t('map.agentDetail', { name, domain }),
      grantor: owner || t('map.seniorManager'),
      owner,
      scope: domain,
      reserved: t('map.financialReserved'),
      period: t('map.currentSeason'),
      review: a.status === 'attention' ? t('map.reviewInDays') : null,
      levelKey: a.status === 'attention' ? 'exec' : a.status === 'idle' ? 'observe' : 'limited',
    }
  })
  const filtered = items.filter((i, idx) => {
    const qok = !query || i.title.includes(query) || i.agent.includes(query) || i.scope.includes(query)
    const fok = filter === 'ops' ? idx % 2 === 0 || i.levelKey === 'exec' || i.levelKey === 'limited' : filter === 'strategic' ? idx % 2 === 1 || i.levelKey === 'observe' || !!i.review : true
    return qok && fok
  })
  const current = filtered.find((i) => i.id === selected) || filtered[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="steve-surface overflow-hidden">
        <div className="border-b border-[var(--color-steve-border)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[16px]">{t('map.authority')}</div>
              <div className="mt-1 text-[12px] text-[var(--color-steve-text-faint)]">{t('map.authorityStats')}</div>
            </div>
            <button type="button" className="steve-action" onClick={() => navigate('/map?tab=authority&mode=design')}>
              {t('map.manageDesign')}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter('ops')} className={cn('rounded-md px-3 py-1.5 text-[12px]', filter === 'ops' ? 'bg-[var(--color-steve-green-active)]' : 'border border-[var(--color-steve-border)]')}>
              {t('map.opsDelegation')}
            </button>
            <button type="button" onClick={() => setFilter('strategic')} className={cn('rounded-md px-3 py-1.5 text-[12px]', filter === 'strategic' ? 'bg-[var(--color-steve-green-active)]' : 'border border-[var(--color-steve-border)]')}>
              {t('map.strategicMission')}
            </button>
            <div className="min-w-[200px] flex-1">
              <SearchField value={query} onChange={setQuery} placeholder={t('map.searchAuthority')} />
            </div>
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setSelected(i.id)}
              className={cn('flex w-full flex-col gap-1 border-b border-[var(--color-steve-border-soft)] px-5 py-3.5 text-start', current?.id === i.id && 'bg-[var(--color-steve-green-dim)]')}
            >
              <div className="text-[13px]">{i.title}</div>
              <div className="text-[11px] text-[var(--color-steve-text-faint)]">
                {i.agent} · {i.level}
              </div>
              {i.review ? <div className="text-[11px] text-[var(--color-steve-gold)]">{i.review}</div> : null}
            </button>
          ))}
        </div>
      </section>

      {current ? (
        <section className="steve-surface p-5 text-[13px]">
          <div className="text-[11px] text-[var(--color-steve-gold)]">{t('map.delegationVer')}</div>
          <div className="mt-1 text-[20px] font-light">{current.title}</div>
          <p className="mt-3 leading-7 text-[var(--color-steve-text-muted)]">{current.detail}</p>
          <div className="mt-4 space-y-2 border-t border-[var(--color-steve-border-soft)] pt-3 text-[12px]">
            <KV k={t('map.grantor')} v={current.grantor} />
            <KV k={t('map.owner')} v={current.owner} />
            <KV k={t('map.scopeCeiling')} v={current.scope} />
            <KV k={t('map.reserved')} v={current.reserved} />
            <KV k={t('map.validity')} v={current.period} />
            <KV k={t('map.authorityLevel')} v={current.level} />
            <KV k={t('map.execStatus')} v={<span className="text-[var(--color-steve-green-bright)]">{t('map.execActive')}</span>} />
          </div>
          {current.review ? <div className="mt-4 rounded-xl border border-[var(--notice-warning-border)] bg-[var(--notice-warning-bg)] px-3 py-2.5 text-[12px] text-[var(--color-steve-gold-soft)]">{current.review}</div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/agents" className="rounded-xl bg-[var(--color-steve-green)] px-4 py-2.5 text-white">
              {t('map.openDelegation')}
            </Link>
            <Link to="/work" className="rounded-xl border border-[var(--color-steve-border)] px-4 py-2.5">
              {t('map.interventionControl')}
            </Link>
          </div>
          <button type="button" className="mt-3 text-[12px] text-[var(--color-steve-gold)]" onClick={() => navigate('/communication')}>
            {t('map.viewHistory')}
          </button>
        </section>
      ) : null}
    </div>
  )
}
