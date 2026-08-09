/**
 * Shared shapes for the Intelligence destination: decision maps, knowledge network, mastery.
 * Business narratives are bilingual pairs because they are content, not UI chrome.
 */

export type Bi = { fa: string; en: string }

export type Verdict = 'pass' | 'fail' | 'conditional' | 'neutral' | 'outcome'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface DecisionNode {
  id: string
  label: Bi
  meta?: Bi
  verdict: Verdict
  x: number
  y: number
  w?: number
  rule?: Bi
  actual?: Bi
  result?: Bi
  confidence?: ConfidenceLevel
  sources?: Bi[]
  changes?: Bi
  updated: Bi
  recordType?: string
  recordId?: string
  workId?: string
}

export interface DecisionEdge {
  from: string
  to: string
  label?: Bi
  kind?: Verdict
}

export interface TimelineEntry {
  at: Bi
  text: Bi
}

export interface DecisionMap {
  id: string
  title: Bi
  version: string
  asOf: Bi
  focusNodeId: string
  nodes: DecisionNode[]
  edges: DecisionEdge[]
  trace: string[]
  simulation: { title: Bi; body: Bi; consequence: Bi; to?: string }
  history: TimelineEntry[]
}

export type KnowledgeKind = 'fact' | 'evidence' | 'policy' | 'target' | 'pattern' | 'outcome' | 'owner' | 'initiative'

export interface KnowledgeNode {
  id: string
  kind: KnowledgeKind
  label: Bi
  value?: Bi
  relation?: Bi
  statement: Bi
  domain: Bi
  currency: Bi
  confidence: ConfidenceLevel
  sources: Bi[]
  relationships: number
  usedInDecisions: number
  updated: Bi
  outerRing?: boolean
  x: number
  y: number
  to?: string
}

export interface KnowledgeNetwork {
  centerId: string
  nodes: KnowledgeNode[]
  history: TimelineEntry[]
}

export interface MasteryAttentionItem {
  id: string
  kind: 'health' | 'review' | 'gap'
  title: Bi
  detail: Bi
  action: Bi
  to: string
}

export interface MasteryReview {
  id: string
  label: Bi
  asOf: Bi
  frozenAt: Bi
}

export interface MasteryProfile {
  explanation: Bi
  reviews: MasteryReview[]
  attention: MasteryAttentionItem[]
  history: TimelineEntry[]
  fullResultTo: string
}

export interface IntelligenceContent {
  decisionMaps: DecisionMap[]
  knowledge: KnowledgeNetwork
  mastery: MasteryProfile
}

/**
 * Canonical decision-tree topology shared by every business: a trace of
 * start → two passing checks → a failing check → a conditional → the authorized outcome,
 * with the counterfactual branch of each check kept visible.
 */
export const DECISION_LAYOUT: Record<string, { x: number; y: number; w?: number }> = {
  start: { x: 0, y: 150 },
  c1: { x: 250, y: 150 },
  t1: { x: 250, y: 320 },
  c2: { x: 500, y: 150 },
  t2: { x: 500, y: 320 },
  c3: { x: 750, y: 150 },
  t3: { x: 1240, y: 150 },
  cond: { x: 1000, y: 290 },
  t4: { x: 1240, y: 300 },
  outcome: { x: 920, y: 440, w: 250 },
}

export function decisionEdges(ids: Record<string, string>, labels: { pass: Bi; fail: Bi; conditional: Bi; no: Bi }): DecisionEdge[] {
  return [
    { from: ids.start, to: ids.c1 },
    { from: ids.c1, to: ids.c2, label: labels.pass, kind: 'pass' },
    { from: ids.c1, to: ids.t1, label: labels.fail, kind: 'fail' },
    { from: ids.c2, to: ids.c3, label: labels.pass, kind: 'pass' },
    { from: ids.c2, to: ids.t2, label: labels.fail, kind: 'fail' },
    { from: ids.c3, to: ids.t3, label: labels.pass, kind: 'pass' },
    { from: ids.c3, to: ids.cond, label: labels.conditional, kind: 'conditional' },
    { from: ids.cond, to: ids.t4, label: labels.no, kind: 'neutral' },
    { from: ids.cond, to: ids.outcome, kind: 'outcome' },
  ]
}

export const EDGE_LABELS = {
  pass: { fa: 'عبور', en: 'Pass' },
  fail: { fa: 'مردود', en: 'Fail' },
  conditional: { fa: 'مشروط', en: 'Conditional' },
  no: { fa: 'خیر', en: 'No' },
}

export const BRANCH_INACTIVE: Bi = { fa: 'مسیر غیرفعال', en: 'Branch inactive' }
export const NOT_TAKEN: Bi = { fa: 'اجرا نشد', en: 'Not taken' }
