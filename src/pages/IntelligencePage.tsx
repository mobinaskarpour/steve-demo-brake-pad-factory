import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Clock,
  FileText,
  GitBranch,
  History,
  ListChecks,
  Network,
  Play,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
  Workflow,
} from 'lucide-react'
import { Background, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { PageHero, SoftTabs } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { cn } from '../lib/utils'
import { toPersianDigits } from '../lib/format'
import { useLocale } from '../i18n/LocaleProvider'
import { getEnConfig } from '../i18n/enContent'
import {
  intelligenceContent,
  type Bi,
  type ConfidenceLevel,
  type DecisionMap,
  type DecisionNode,
  type KnowledgeKind,
  type KnowledgeNode,
  type TimelineEntry,
  type Verdict,
} from '../domain/intelligence'

const NODE_WIDTH = 190
const KNOWLEDGE_WIDTH = 208
const KNOWLEDGE_CENTER_WIDTH = 248

type Pick = (v: Bi | undefined) => string

const verdictBorder: Record<Verdict, string> = {
  pass: 'var(--color-steve-green)',
  fail: 'var(--color-steve-danger)',
  conditional: 'var(--color-steve-gold)',
  neutral: 'var(--color-steve-border)',
  outcome: 'var(--color-steve-green-bright)',
}

const edgeColor: Record<Verdict, string> = {
  pass: 'var(--color-steve-green)',
  fail: 'var(--color-steve-danger)',
  conditional: 'var(--color-steve-gold)',
  neutral: 'var(--flow-edge)',
  outcome: 'var(--color-steve-green-bright)',
}

const knowledgeIcons: Record<KnowledgeKind, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  fact: CircleCheck,
  evidence: FileText,
  policy: BookOpen,
  target: Target,
  pattern: Clock,
  outcome: TrendingUp,
  owner: Users,
  initiative: Workflow,
}

const knowledgeKindKey: Record<KnowledgeKind, string> = {
  fact: 'intelligence.kindFact',
  evidence: 'intelligence.kindEvidence',
  policy: 'intelligence.kindPolicy',
  target: 'intelligence.kindTarget',
  pattern: 'intelligence.kindPattern',
  outcome: 'intelligence.kindOutcome',
  owner: 'intelligence.kindOwner',
  initiative: 'intelligence.kindInitiative',
}

const confidenceKey: Record<ConfidenceLevel, string> = {
  high: 'intelligence.confHigh',
  medium: 'intelligence.confMedium',
  low: 'intelligence.confLow',
}

const confidenceTone: Record<ConfidenceLevel, 'success' | 'warning' | 'neutral'> = {
  high: 'success',
  medium: 'warning',
  low: 'neutral',
}

type DecisionNodeData = {
  label: string
  meta?: string
  verdict: Verdict
  width: number
  selected: boolean
}

type KnowledgeNodeData = {
  label: string
  value?: string
  kindLabel: string
  kind: KnowledgeKind
  center: boolean
  selected: boolean
}

function DecisionFlowNode({ data }: NodeProps) {
  const d = data as unknown as DecisionNodeData
  const isOutcome = d.verdict === 'outcome'
  return (
    <div
      className="rounded-xl px-3.5 py-3 text-start transition"
      style={{
        width: d.width,
        border: `1px solid ${verdictBorder[d.verdict]}`,
        background: isOutcome ? 'var(--color-steve-green-dim)' : 'var(--color-steve-surface)',
        boxShadow: d.selected ? `0 0 0 1px ${verdictBorder[d.verdict]}` : 'none',
      }}
    >
      <Handle type="target" position={Position.Left} id="e" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="w" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="t" style={{ opacity: 0 }} />
      <div
        className="text-[12.5px] leading-6"
        style={{ color: d.verdict === 'fail' ? 'var(--color-steve-danger)' : 'var(--color-steve-text)' }}
      >
        {d.label}
      </div>
      {d.meta ? <div className="mt-1 text-[11px] text-[var(--color-steve-text-faint)]">{d.meta}</div> : null}
      <Handle type="source" position={Position.Right} id="s" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="sl" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ opacity: 0 }} />
    </div>
  )
}

function KnowledgeFlowNode({ data }: NodeProps) {
  const d = data as unknown as KnowledgeNodeData
  const Icon = knowledgeIcons[d.kind]
  return (
    <div
      className="rounded-xl px-3.5 py-3 text-start"
      style={{
        width: d.center ? KNOWLEDGE_CENTER_WIDTH : KNOWLEDGE_WIDTH,
        border: `1px solid ${d.center ? 'var(--color-steve-green-bright)' : 'var(--color-steve-border)'}`,
        background: d.center ? 'var(--color-steve-green-dim)' : 'var(--color-steve-surface)',
        boxShadow: d.selected ? '0 0 0 1px var(--color-steve-gold)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Left} id="e" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="s" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="t" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ opacity: 0 }} />
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[var(--color-steve-green-bright)]">
          <Icon size={14} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <div className={cn('leading-6', d.center ? 'text-[14px]' : 'text-[12.5px]')}>{d.label}</div>
          <div className="mt-0.5 text-[10px] tracking-[0.12em] text-[var(--color-steve-text-faint)]">
            {d.value ? `${d.value} · ` : ''}
            {d.kindLabel}
          </div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { decision: DecisionFlowNode, knowledge: KnowledgeFlowNode }

export function IntelligencePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const question = locale === 'en' ? enCfg.intelligenceQuestion || appConfig.intelligenceQuestion : appConfig.intelligenceQuestion
  const [tab, setTab] = useState('decisions')

  return (
    <div className="steve-page space-y-5">
      <PageHero title={t('intelligence.title')} subtitle={question} />
      <SoftTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'decisions', label: t('intelligence.decisionMap') },
          { id: 'knowledge', label: t('intelligence.knowledge') },
          { id: 'mastery', label: t('intelligence.mastery') },
        ]}
      />

      {tab === 'decisions' ? <DecisionMapsTab /> : null}
      {tab === 'knowledge' ? <KnowledgeTab /> : null}
      {tab === 'mastery' ? <MasteryTab /> : null}
    </div>
  )
}

/* ---------------------------------------------------------------- Decision Maps */

function DecisionMapsTab() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const { recordPath } = useDemo()
  const navigate = useNavigate()
  const pick = useCallback<Pick>((v) => (v ? (locale === 'fa' ? v.fa : v.en) : ''), [locale])

  const maps = intelligenceContent.decisionMaps
  const [mapId, setMapId] = useState(maps[0]?.id || '')
  const map = maps.find((m) => m.id === mapId) || maps[0]
  const [view, setView] = useState<'trace' | 'full'>('trace')
  const [panel, setPanel] = useState<'none' | 'history' | 'simulate'>('none')
  const [selectedId, setSelectedId] = useState(map?.focusNodeId || '')

  useEffect(() => {
    setSelectedId(map?.focusNodeId || '')
    setPanel('none')
    setView('trace')
  }, [map?.id, map?.focusNodeId])

  const { nodes, edges } = useDecisionGraph(map, view, selectedId, isRtl, pick)
  const selected = map?.nodes.find((n) => n.id === selectedId) || map?.nodes[0]

  if (!map) return null

  return (
    <div className="space-y-4">
      <Toolbar>
        <ToolbarIcon icon={GitBranch} />
        <ToolbarSelect value={map.id} onChange={setMapId} options={maps.map((m) => ({ id: m.id, label: pick(m.title) }))} strong />
        <ToolbarDivider />
        <span className="inline-flex items-center gap-2 whitespace-nowrap px-1 text-[12px] text-[var(--color-steve-text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-steve-green-bright)]" />
          {t('status.active')} · {map.version}
        </span>
        <ToolbarDivider />
        <span className="inline-flex items-center gap-2 whitespace-nowrap px-1 text-[12px] text-[var(--color-steve-text-muted)]">
          <CalendarDays size={13} strokeWidth={1.5} />
          {pick(map.asOf)}
        </span>
        <ToolbarDivider />
        <ToolbarToggle
          value={view}
          onChange={(v) => setView(v as 'trace' | 'full')}
          options={[
            { id: 'full', label: t('intelligence.fullTree') },
            { id: 'trace', label: t('intelligence.tracePath') },
          ]}
        />
        <div className="ms-auto flex items-center gap-1">
          <ToolbarButton
            icon={Play}
            label={t('intelligence.simulate')}
            active={panel === 'simulate'}
            onClick={() => setPanel((p) => (p === 'simulate' ? 'none' : 'simulate'))}
          />
          <ToolbarButton
            icon={History}
            label={t('intelligence.history')}
            active={panel === 'history'}
            onClick={() => setPanel((p) => (p === 'history' ? 'none' : 'history'))}
          />
        </div>
      </Toolbar>

      {panel === 'simulate' ? (
        <InfoPanel title={pick(map.simulation.title)} kicker={t('intelligence.simulationTitle')} onClose={() => setPanel('none')}>
          <p className="text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{pick(map.simulation.body)}</p>
          <p className="mt-2 text-[13px] leading-7 text-[var(--color-steve-gold)]">{pick(map.simulation.consequence)}</p>
          {map.simulation.to ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--color-steve-green-bright)]"
              onClick={() => navigate(map.simulation.to as string)}
            >
              {t('intelligence.relatedWork')}
              <ArrowUpRight size={13} strokeWidth={1.6} />
            </button>
          ) : null}
        </InfoPanel>
      ) : null}

      {panel === 'history' ? (
        <InfoPanel kicker={t('intelligence.history')} title={t('intelligence.historyTitle')} onClose={() => setPanel('none')}>
          <Timeline entries={map.history} pick={pick} />
        </InfoPanel>
      ) : null}

      <div className="rounded-2xl bg-[var(--color-steve-page)]">
        <div className="h-[440px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.14 }}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll
            minZoom={0.4}
            maxZoom={1.3}
          >
            <Background gap={32} color="var(--flow-dot)" size={1} />
          </ReactFlow>
        </div>
      </div>

      {selected ? <DecisionDetail node={selected} pick={pick} recordPath={recordPath} /> : null}
    </div>
  )
}

function useDecisionGraph(map: DecisionMap | undefined, view: 'trace' | 'full', selectedId: string, isRtl: boolean, pick: Pick) {
  return useMemo(() => {
    if (!map) return { nodes: [] as Node[], edges: [] as Edge[] }
    const width = (n: DecisionNode) => n.w || NODE_WIDTH
    const maxRight = Math.max(...map.nodes.map((n) => n.x + width(n)))
    const onTrace = new Set(map.trace)
    const posById = new Map(map.nodes.map((n) => [n.id, n]))

    const nodes: Node[] = map.nodes.map((n) => {
      const dim = view === 'trace' && !onTrace.has(n.id)
      return {
        id: n.id,
        type: 'decision',
        position: { x: isRtl ? maxRight - n.x - width(n) : n.x, y: n.y },
        style: { opacity: dim ? 0.3 : 1 },
        data: {
          label: pick(n.label),
          meta: pick(n.meta),
          verdict: n.verdict,
          width: width(n),
          selected: n.id === selectedId,
        } as unknown as Record<string, unknown>,
      }
    })

    const edges: Edge[] = map.edges.map((e) => {
      const from = posById.get(e.from)
      const to = posById.get(e.to)
      const goesDown = !!from && !!to && to.y > from.y + 60
      const dim = view === 'trace' && !(onTrace.has(e.from) && onTrace.has(e.to))
      const kind = e.kind || 'neutral'
      const color = edgeColor[kind]
      return {
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        sourceHandle: goesDown ? 'b' : isRtl ? 'sl' : 's',
        targetHandle: goesDown ? 't' : isRtl ? 'w' : 'e',
        type: 'smoothstep',
        label: pick(e.label) || undefined,
        style: { stroke: color, strokeWidth: 1.15, opacity: dim ? 0.25 : 1 },
        labelStyle: { fill: 'var(--flow-label)', fontSize: 10 },
        labelBgStyle: { fill: 'var(--color-steve-page)' },
        labelBgPadding: [4, 2] as [number, number],
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 11, height: 11 },
      }
    })

    return { nodes, edges }
  }, [map, view, selectedId, isRtl, pick])
}

function DecisionDetail({ node, pick, recordPath }: { node: DecisionNode; pick: Pick; recordPath: (type: string, id: string) => string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const resultTone =
    node.verdict === 'fail'
      ? 'var(--color-steve-danger)'
      : node.verdict === 'conditional'
        ? 'var(--color-steve-gold)'
        : 'var(--color-steve-green-bright)'

  return (
    <section className="steve-surface p-5">
      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-[var(--color-steve-text-faint)]">{t('intelligence.selectedNode')}</span>
            <span className="text-[var(--color-steve-text-faint)]">·</span>
            <span className="text-[var(--color-steve-gold)]">{pick(node.label)}</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1.5fr_1fr_1fr]">
            <Field label={t('intelligence.rule')} value={pick(node.rule)} />
            <Field label={t('intelligence.actual')} value={pick(node.actual)} bordered />
            <Field label={t('intelligence.result')} value={pick(node.result)} valueColor={resultTone} bordered />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {node.confidence ? <Badge tone={confidenceTone[node.confidence]}>{t(confidenceKey[node.confidence])}</Badge> : null}
            {(node.sources || []).map((s) => (
              <Badge key={s.en}>{pick(s)}</Badge>
            ))}
            <span className="rounded-full border border-[var(--color-steve-border-soft)] px-2.5 py-0.5 text-[11px] text-[var(--color-steve-text-faint)]">
              {t('intelligence.updatedAt', { time: pick(node.updated) })}
            </span>
          </div>
        </div>
        <div className="border-t border-[var(--color-steve-border-soft)] pt-4 lg:border-t-0 lg:border-s lg:ps-6 lg:pt-0">
          <div className="flex items-center gap-1.5 text-[14px] text-[var(--color-steve-gold)]">
            {t('intelligence.whatChangesBranch')}
            <ArrowUpRight size={14} strokeWidth={1.6} />
          </div>
          <p className="mt-3 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{pick(node.changes)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {node.recordType && node.recordId ? (
              <button
                type="button"
                className="rounded-full border border-[var(--color-steve-brief-border)] px-3 py-1 text-[11px] text-[var(--color-steve-green-bright)]"
                onClick={() => navigate(recordPath(node.recordType as string, node.recordId as string))}
              >
                {t('intelligence.viewEvidence')}
              </button>
            ) : null}
            {node.workId ? (
              <button
                type="button"
                className="rounded-full border border-[var(--color-steve-border)] px-3 py-1 text-[11px]"
                onClick={() => navigate(`/work/${node.workId}`)}
              >
                {t('intelligence.relatedWork')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, value, valueColor, bordered }: { label: string; value: string; valueColor?: string; bordered?: boolean }) {
  return (
    <div className={cn(bordered && 'sm:border-s sm:border-[var(--color-steve-border-soft)] sm:ps-4')}>
      <div className="text-[11px] text-[var(--color-steve-text-faint)]">{label}</div>
      <div className="mt-1.5 text-[13px] leading-7" style={valueColor ? { color: valueColor } : undefined}>
        {value || '—'}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- Knowledge */

function KnowledgeTab() {
  const { t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const navigate = useNavigate()
  const pick = useCallback<Pick>((v) => (v ? (locale === 'fa' ? v.fa : v.en) : ''), [locale])
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))
  const net = intelligenceContent.knowledge

  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | KnowledgeKind>('all')
  const [scope, setScope] = useState<'focus' | 'full'>('focus')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(net.centerId)

  const kinds = useMemo(() => Array.from(new Set(net.nodes.map((n) => n.kind))), [net.nodes])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return net.nodes.filter((n) => {
      if (n.id === net.centerId) return true
      if (scope === 'focus' && n.outerRing) return false
      if (kind !== 'all' && n.kind !== kind) return false
      if (!q) return true
      return `${pick(n.label)} ${pick(n.statement)}`.toLowerCase().includes(q)
    })
  }, [net, query, kind, scope, pick])

  const selected = net.nodes.find((n) => n.id === selectedId) || net.nodes[0]
  const center = net.nodes.find((n) => n.id === net.centerId)
  const noMatch = visible.length <= 1 && query.trim().length > 0

  const { nodes, edges } = useMemo(() => {
    const width = (n: KnowledgeNode) => (n.id === net.centerId ? KNOWLEDGE_CENTER_WIDTH : KNOWLEDGE_WIDTH)
    const maxRight = Math.max(...visible.map((n) => n.x + width(n)))
    const flowNodes: Node[] = visible.map((n) => ({
      id: n.id,
      type: 'knowledge',
      position: { x: isRtl ? maxRight - n.x - width(n) : n.x, y: n.y },
      data: {
        label: pick(n.label),
        value: pick(n.value),
        kindLabel: t(knowledgeKindKey[n.kind]),
        kind: n.kind,
        center: n.id === net.centerId,
        selected: n.id === selectedId,
      } as unknown as Record<string, unknown>,
    }))
    const flowEdges: Edge[] = visible
      .filter((n) => n.id !== net.centerId && center)
      .map((n) => {
        const goesDown = Math.abs(n.y - (center as KnowledgeNode).y) > 120
        const below = n.y > (center as KnowledgeNode).y
        return {
          id: `k-${n.id}`,
          source: below ? net.centerId : n.id,
          target: below ? n.id : net.centerId,
          sourceHandle: goesDown ? 'b' : isRtl ? 's' : 's',
          targetHandle: goesDown ? 't' : 'e',
          type: 'smoothstep',
          label: pick(n.relation) || undefined,
          style: { stroke: 'var(--flow-edge)', strokeWidth: 1.05 },
          labelStyle: { fill: 'var(--flow-label)', fontSize: 10 },
          labelBgStyle: { fill: 'var(--color-steve-page)' },
          labelBgPadding: [4, 2] as [number, number],
        }
      })
    return { nodes: flowNodes, edges: flowEdges }
  }, [visible, center, net.centerId, isRtl, selectedId, pick, t])

  return (
    <div className="space-y-4">
      <Toolbar>
        <ToolbarIcon icon={Network} />
        <span className="whitespace-nowrap px-1 text-[13px]">{t('intelligence.knowledgeNetwork')}</span>
        <ToolbarDivider />
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] px-3 py-1.5">
          <Search size={13} strokeWidth={1.5} className="text-[var(--color-steve-text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('intelligence.knowledgeSearch')}
            className="w-full bg-transparent text-[12px] text-[var(--color-steve-text)] outline-none placeholder:text-[var(--color-steve-text-faint)]"
          />
        </label>
        <ToolbarSelect
          value={kind}
          onChange={(v) => setKind(v as 'all' | KnowledgeKind)}
          options={[{ id: 'all', label: t('intelligence.allKnowledge') }, ...kinds.map((k) => ({ id: k, label: t(knowledgeKindKey[k]) }))]}
        />
        <ToolbarToggle
          value={scope}
          onChange={(v) => setScope(v as 'focus' | 'full')}
          options={[
            { id: 'focus', label: t('intelligence.focus') },
            { id: 'full', label: t('intelligence.fullNetwork') },
          ]}
        />
        <div className="ms-auto">
          <ToolbarButton icon={History} label={t('intelligence.history')} active={historyOpen} onClick={() => setHistoryOpen((v) => !v)} />
        </div>
      </Toolbar>

      {historyOpen ? (
        <InfoPanel kicker={t('intelligence.history')} title={t('intelligence.knowledgeHistoryTitle')} onClose={() => setHistoryOpen(false)}>
          <Timeline entries={net.history} pick={pick} />
        </InfoPanel>
      ) : null}

      <div className="rounded-2xl bg-[var(--color-steve-page)]">
        <div className="relative h-[420px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll
            minZoom={0.4}
            maxZoom={1.3}
          >
            <Background gap={32} color="var(--flow-dot)" size={1} />
          </ReactFlow>
          {noMatch ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] text-[var(--color-steve-text-faint)]">
              {t('intelligence.knowledgeEmpty')}
            </div>
          ) : null}
        </div>
      </div>

      {selected ? (
        <section className="steve-surface p-5">
          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.12em] text-[var(--color-steve-text-faint)]">
                <span className="text-[var(--color-steve-green-bright)]">
                  <CircleCheck size={14} strokeWidth={1.5} />
                </span>
                {t('intelligence.selectedKnowledge')}
                <span>·</span>
                <span className="text-[var(--color-steve-gold)]">{t(knowledgeKindKey[selected.kind])}</span>
              </div>
              <h3 className="mt-3 text-[18px] font-light leading-8">{pick(selected.statement)}</h3>
              <div className="mt-2 text-[12px] text-[var(--color-steve-text-faint)]">
                {pick(selected.domain)} · {pick(selected.currency)} · {t('intelligence.updatedAt', { time: pick(selected.updated) })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={confidenceTone[selected.confidence]}>{t(confidenceKey[selected.confidence])}</Badge>
                {selected.sources.map((s) => (
                  <Badge key={s.en}>{pick(s)}</Badge>
                ))}
              </div>
            </div>
            <div className="border-t border-[var(--color-steve-border-soft)] pt-4 lg:border-t-0 lg:border-s lg:ps-6 lg:pt-0">
              <div className="text-[12px] text-[var(--color-steve-text-muted)]">
                {t('intelligence.relationships', { value: d(selected.relationships) })}
              </div>
              <div className="mt-1 text-[12px] text-[var(--color-steve-text-muted)]">
                {t('intelligence.usedInDecisions', { value: d(selected.usedInDecisions) })}
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-steve-gold)]"
                onClick={() => navigate(selected.to || '/work')}
              >
                {t('intelligence.openKnowledge')}
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------------- Mastery */

function MasteryTab() {
  const { t } = useTranslation()
  const { locale, loc } = useLocale()
  const { state } = useDemo()
  const navigate = useNavigate()
  const pick: Pick = (v) => (v ? (locale === 'fa' ? v.fa : v.en) : '')
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))
  const enCfg = getEnConfig() as Record<string, string>
  const shortName = locale === 'en' ? enCfg.shortName || appConfig.shortName : appConfig.shortName
  const profile = intelligenceContent.mastery

  const [scope, setScope] = useState('enterprise')
  const [reviewId, setReviewId] = useState(profile.reviews[0]?.id || '')
  const [view, setView] = useState<'overview' | 'domains'>('overview')
  const [historyOpen, setHistoryOpen] = useState(false)

  const review = profile.reviews.find((r) => r.id === reviewId) || profile.reviews[0]
  const scopedAgents = useMemo(
    () => (scope === 'enterprise' ? state.agents : state.agents.filter((a) => a.unitId === scope)),
    [scope, state.agents],
  )
  const agents = scopedAgents.length ? scopedAgents : state.agents

  const index = Math.round(agents.reduce((sum, a) => sum + a.mastery, 0) / Math.max(agents.length, 1))
  const evidenceCoverage = Math.round(agents.reduce((sum, a) => sum + a.alignment, 0) / Math.max(agents.length, 1))
  const scopeCoverage = Math.round((agents.filter((a) => a.status !== 'idle').length / Math.max(agents.length, 1)) * 100)
  const reliability = index >= 80 && agents.length >= 4 ? t('intelligence.reliabilityHigh') : t('intelligence.reliabilityMedium')
  const floorAgent = agents.reduce((low, a) => (a.mastery < low.mastery ? a : low), agents[0])

  const scopeOptions = [
    { id: 'enterprise', label: t('intelligence.enterpriseScope') },
    ...state.units.filter((u) => u.id !== 'unit-holding').map((u) => ({ id: u.id, label: loc(u.name, 'units', u.id, 'name') })),
  ]

  return (
    <div className="space-y-4">
      <Toolbar>
        <ToolbarIcon icon={ShieldCheck} />
        <span className="whitespace-nowrap px-1 text-[13px]">{t('intelligence.masteryCenter')}</span>
        <ToolbarDivider />
        <ToolbarSelect value={scope} onChange={setScope} options={scopeOptions} />
        <ToolbarSelect value={reviewId} onChange={setReviewId} options={profile.reviews.map((r) => ({ id: r.id, label: pick(r.label) }))} />
        <ToolbarSelect
          value={view}
          onChange={(v) => setView(v as 'overview' | 'domains')}
          options={[
            { id: 'overview', label: t('intelligence.viewOverview') },
            { id: 'domains', label: t('intelligence.viewDomains') },
          ]}
        />
        <div className="ms-auto">
          <ToolbarButton icon={History} label={t('intelligence.history')} active={historyOpen} onClick={() => setHistoryOpen((v) => !v)} />
        </div>
      </Toolbar>

      {historyOpen ? (
        <InfoPanel kicker={t('intelligence.history')} title={t('intelligence.masteryHistoryTitle')} onClose={() => setHistoryOpen(false)}>
          <Timeline entries={profile.history} pick={pick} />
        </InfoPanel>
      ) : null}

      <section className="rounded-2xl border border-[var(--color-steve-brief-border)] bg-[var(--color-steve-brief)] p-6">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="text-[11px] tracking-[0.16em] text-[var(--color-steve-gold)]">{t('intelligence.masteryIndex')}</div>
            <div className="mt-2 text-[64px] font-extralight leading-none text-[var(--color-steve-green-bright)]">{d(index)}%</div>
            <h3 className="mt-3 text-[22px] font-light">{t('intelligence.masteryHeadline')}</h3>
            <p className="mt-3 max-w-[46ch] text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{pick(profile.explanation)}</p>
            <div className="mt-4 text-[12px] text-[var(--color-steve-text-faint)]">
              {shortName} · {scopeOptions.find((o) => o.id === scope)?.label}
            </div>
            <div className="text-[12px] text-[var(--color-steve-text-faint)]">
              {t('intelligence.asOfLabel', { date: pick(review?.asOf) })} · {t('intelligence.frozenAt', { time: pick(review?.frozenAt) })}
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-steve-green-bright)]"
              onClick={() => navigate(profile.fullResultTo)}
            >
              {t('intelligence.openFullResult')}
              <ArrowUpRight size={14} strokeWidth={1.6} />
            </button>
          </div>
          <div className="lg:border-s lg:border-[var(--color-steve-brief-border)] lg:ps-8">
            <MasteryMetric label={t('intelligence.scopeCoverage')} value={`${d(scopeCoverage)}%`} />
            <MasteryMetric label={t('intelligence.evidenceCoverage')} value={`${d(evidenceCoverage)}%`} />
            <MasteryMetric label={t('intelligence.assessmentReliability')} value={reliability} />
            <MasteryMetric
              label={t('intelligence.criticalFloor')}
              value={floorAgent ? `${loc(floorAgent.domain, 'agents', floorAgent.id, 'domain')} ${d(floorAgent.mastery)}%` : '—'}
              last
            />
          </div>
        </div>
        <p className="mt-5 border-t border-[var(--color-steve-brief-border)] pt-4 text-[12px] text-[var(--color-steve-text-faint)]">
          {t('intelligence.masteryFootnote')}
        </p>
      </section>

      {view === 'overview' ? (
        <section className="space-y-2">
          <h3 className="text-[18px] font-light">{t('intelligence.requiresAttention')}</h3>
          <div className="steve-surface divide-y divide-[var(--color-steve-border-soft)]">
            {profile.attention.map((item) => (
              <AttentionRow key={item.id} kind={item.kind} title={pick(item.title)} detail={pick(item.detail)} action={pick(item.action)} onOpen={() => navigate(item.to)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[14px] text-[var(--color-steve-text-muted)]">{t('intelligence.agentMastery')}</h3>
        <div className={cn('grid gap-3', view === 'domains' ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>
          {(view === 'domains' ? agents : agents.slice(0, 4)).map((a) => (
            <button
              key={a.id}
              type="button"
              className="steve-surface p-4 text-start"
              onClick={() => navigate(`/agents?agent=${a.id}`)}
            >
              <div className="text-[12px] text-[var(--color-steve-gold)]">{loc(a.name, 'agents', a.id, 'name')}</div>
              <div className="mt-2 text-[28px] font-extralight">{d(a.mastery)}%</div>
              <div className="mt-1 text-[11px] text-[var(--color-steve-text-faint)]">
                {t('intelligence.alignment', { rate: d(a.alignment), domain: loc(a.domain, 'agents', a.id, 'domain') })}
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--color-steve-elevated)]">
                <div className="h-full bg-[var(--color-steve-green)]" style={{ width: `${a.mastery}%` }} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function MasteryMetric({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3.5', !last && 'border-b border-[var(--color-steve-brief-border)]')}>
      <span className="text-[13px] text-[var(--color-steve-text-muted)]">{label}</span>
      <span className="text-[15px] font-light">{value}</span>
    </div>
  )
}

function AttentionRow({
  kind,
  title,
  detail,
  action,
  onOpen,
}: {
  kind: 'health' | 'review' | 'gap'
  title: string
  detail: string
  action: string
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const Icon = kind === 'health' ? Brain : kind === 'review' ? ListChecks : TriangleAlert
  const kicker = kind === 'health' ? t('intelligence.brainHealth') : kind === 'review' ? t('intelligence.monthlyReview') : t('intelligence.criticalGap')
  const tone = kind === 'gap' ? 'var(--color-steve-gold)' : 'var(--color-steve-text-faint)'
  return (
    <button type="button" className="flex w-full items-center gap-4 px-5 py-4 text-start" onClick={onOpen}>
      <span style={{ color: tone }}>
        <Icon size={20} strokeWidth={1.3} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] tracking-[0.14em] text-[var(--color-steve-text-faint)]">{kicker}</span>
        <span className="mt-1 block text-[14px]">{title}</span>
        <span className="mt-1 block text-[12px] text-[var(--color-steve-text-faint)]">{detail}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-[var(--color-steve-gold)]">
        {action}
        <ArrowUpRight size={13} strokeWidth={1.6} />
      </span>
    </button>
  )
}

/* --------------------------------------------------------------------- Shared */

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-steve-border)] bg-[var(--color-steve-surface)] px-3 py-2.5">
      {children}
    </div>
  )
}

function ToolbarIcon({ icon: Icon }: { icon: ComponentType<{ size?: number; strokeWidth?: number }> }) {
  return (
    <span className="text-[var(--color-steve-text-muted)]">
      <Icon size={16} strokeWidth={1.4} />
    </span>
  )
}

function ToolbarDivider() {
  return <span className="hidden h-6 w-px bg-[var(--color-steve-border-soft)] md:block" />
}

function ToolbarSelect({
  value,
  onChange,
  options,
  strong,
}: {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
  strong?: boolean
}) {
  return (
    <span className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] py-1.5 pe-7 ps-3 text-[12px] text-[var(--color-steve-text)] outline-none',
          strong && 'text-[13px]',
        )}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} strokeWidth={1.5} className="pointer-events-none absolute end-2.5 text-[var(--color-steve-text-faint)]" />
    </span>
  )
}

function ToolbarToggle({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <span className="inline-flex rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-full px-3 py-1 text-[12px] transition',
            value === o.id ? 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-green-bright)]' : 'text-[var(--color-steve-text-faint)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </span>
  )
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition',
        active ? 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-green-bright)]' : 'text-[var(--color-steve-text-muted)] hover:text-[var(--color-steve-text)]',
      )}
    >
      <Icon size={14} strokeWidth={1.5} />
      {label}
    </button>
  )
}

function InfoPanel({
  kicker,
  title,
  children,
  onClose,
}: {
  kicker: string
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <section className="steve-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.14em] text-[var(--color-steve-gold)]">{kicker}</div>
          <h3 className="mt-1 text-[15px] font-light">{title}</h3>
        </div>
        <button type="button" className="text-[12px] text-[var(--color-steve-text-faint)]" onClick={onClose}>
          {t('actions.close')}
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Timeline({ entries, pick }: { entries: TimelineEntry[]; pick: Pick }) {
  return (
    <ol className="space-y-3">
      {entries.map((e) => (
        <li key={e.text.en} className="flex gap-3 text-[13px] leading-7">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-steve-green)]" />
          <span className="min-w-[110px] shrink-0 text-[12px] text-[var(--color-steve-text-faint)]">{pick(e.at)}</span>
          <span className="text-[var(--color-steve-text-muted)]">{pick(e.text)}</span>
        </li>
      ))}
    </ol>
  )
}
