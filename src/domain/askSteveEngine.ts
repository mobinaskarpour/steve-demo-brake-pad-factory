/**
 * Ask Steve contextual intelligence engine.
 *
 * Pure, state-aware resolver: every answer is composed from the live demo state
 * (status, amounts, owners, linked records) rather than a canned script, so the
 * reply stays correct after the user approves, rejects, or advances something.
 */
import { productionStageLabel, qcStatusLabel, settlementLabel } from './agentDashboards'
import type { AlertItem, DemoState, Priority } from './types'
import { buildIdTitleMap, scrubVisibleIds } from './displayRecord'

export type AskTurn = { role: 'user' | 'steve'; text: string }

export type AskRun = 'approve-purchase' | 'approve-transaction' | 'create-followup' | 'open'

export type AskAction = {
  label: string
  to?: string
  run?: AskRun
  payload?: Record<string, string>
}

export type AskRich = 'control-room' | 'approvals' | 'inventory'

export type AskFocus = { recordType: string; recordId: string; label: string }

export type AskReply = {
  text: string
  actions?: AskAction[]
  rich?: AskRich
  /** Resolved subject of this reply — the caller stores it to answer follow-ups. */
  focus?: AskFocus | null
}

export type AskContextInput = {
  label?: string
  recordType?: string
  recordId?: string
  kind?: string
} | null

export type AskInput = {
  question: string
  locale: 'fa' | 'en'
  pathname: string
  context: AskContextInput
  history: AskTurn[]
  state: DemoState
  openAlerts: AlertItem[]
  t: (key: string, opts?: Record<string, unknown>) => string
  loc: (fa: string, collection: string, id: string, field: string) => string
  /** Subject of the previous turn, used for pronoun follow-ups. */
  lastFocus?: AskFocus | null
}

/* ------------------------------------------------------------------ */
/* Domain vocabulary — the only part that differs between demos        */
/* ------------------------------------------------------------------ */

const LEX = {
  purchase: { fa: 'درخواست مواد', en: 'material request' },
  transaction: { fa: 'هزینه تولید', en: 'production cost item' },
  correspondence: { fa: 'نامه مشتری', en: 'customer letter' },
  inventory: { fa: 'قلم انبار', en: 'material item' },
  employee: { fa: 'پرونده حضور', en: 'attendance record' },
  work: { fa: 'کار', en: 'work item' },
  unit: { fa: 'واحد تولیدی', en: 'plant unit' },
  agent: { fa: 'عامل', en: 'agent' },
  alert: { fa: 'هشدار', en: 'alert' },
  goal: { fa: 'هدف', en: 'goal' },
  insight: { fa: 'تحلیل', en: 'insight' },
  thread: { fa: 'گفتگو', en: 'conversation' },
} as const

/* ------------------------------------------------------------------ */
/* Text utilities                                                      */
/* ------------------------------------------------------------------ */

const PERSIAN_RANGE = /[\u0600-\u06FF]/
const ID_TOKEN = /[A-Za-z]{2,}[A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g

const AR_DIGITS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

/** Fold Arabic/Persian spelling variants so keyword matching is stable. */
function normalize(raw: string): string {
  return raw
    .replace(/[۰-۹٠-٩]/g, (d) => AR_DIGITS[d] || d)
    .replace(/[يﻱﻲ]/g, 'ی')
    .replace(/[كﻙﻚ]/g, 'ک')
    .replace(/[أإٲٱآ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[«»"'’‘]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

function hasAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/* ------------------------------------------------------------------ */
/* Record index                                                        */
/* ------------------------------------------------------------------ */

type RecordKind =
  | 'purchase'
  | 'transaction'
  | 'correspondence'
  | 'inventory'
  | 'employee'
  | 'work'
  | 'unit'
  | 'agent'
  | 'alert'
  | 'goal'
  | 'insight'
  | 'thread'
  | 'productionOrder'
  | 'productionBatch'
  | 'settlement'

type AskRecord = {
  kind: RecordKind
  id: string
  label: string
  /** Tokens that name this record directly (own id, title, sku, number). */
  strong: string[]
  /** Tokens this record is linked to (work links, related record ids). */
  weak: string[]
}

const KIND_RANK: RecordKind[] = [
  'productionOrder',
  'productionBatch',
  'settlement',
  'purchase',
  'transaction',
  'correspondence',
  'inventory',
  'employee',
  'work',
  'unit',
  'agent',
  'goal',
  'insight',
  'thread',
  'alert',
]

export function recordRoute(kind: string, id: string): string {
  switch (kind) {
    case 'work':
      return `/work/${id}`
    case 'agent':
      return `/agents?agent=${id}`
    case 'thread':
      return `/communication?thread=${id}`
    case 'goal':
      return '/plan'
    case 'insight':
      return '/intelligence'
    case 'alert':
      return '/'
    case 'productionOrder':
    case 'productionBatch':
      return '/agents?agent=agent-fuel'
    case 'settlement':
      return '/agents?agent=agent-fin'
    default:
      return `/records/${kind}/${id}`
  }
}

function tokensOf(...values: (string | undefined | null)[]): string[] {
  const out: string[] = []
  for (const value of values) {
    if (!value) continue
    const matches = value.match(ID_TOKEN)
    if (matches) out.push(...matches.map((m) => m.toUpperCase()))
  }
  return Array.from(new Set(out))
}

/* ------------------------------------------------------------------ */
/* Intent                                                              */
/* ------------------------------------------------------------------ */

type Intent =
  | 'follow-up'
  | 'approve'
  | 'why'
  | 'next'
  | 'open'
  | 'visual'
  | 'pending'
  | 'inventory'
  | 'work'
  | 'sales'
  | 'attention'
  | 'changed'
  | 'map-node'
  | 'agent'
  | 'decisions'
  | 'evidence'
  | 'plan'
  | 'summary'
  | 'explain'

const WORDS = {
  followUp: ['پیگیری بساز', 'کار پیگیری', 'ایجاد کار', 'کار بساز', 'یاداور', 'یادآور', 'follow up', 'follow-up', 'followup', 'create task', 'create work', 'remind me'],
  approve: ['تایید کن', 'تاییدش کن', 'تصویب کن', 'موافقت کن', 'قبول کن', 'approve it', 'approve this', 'approve ', 'sign off', 'authorize', 'authorise', 'go ahead with'],
  pending: ['منتظر تایید', 'در انتظار تایید', 'تاییدهای باز', 'صف تایید', 'تاییدهای معلق', 'کارتابل تایید', 'pending approval', 'open approvals', 'awaiting approval', 'approval queue', 'what needs approval', 'pending items', 'waiting for approval'],
  why: ['چرا', 'علت', 'دلیل', 'ریشه', 'چه شد که', 'why', 'reason', 'rationale', 'root cause', 'what caused'],
  blocked: ['بلاک', 'بلوکه', 'مانع', 'گیر کرده', 'متوقف', 'معطل', 'گلوگاه', 'جلوی', 'blocked', 'blocking', 'stuck', 'held up', 'hold up', 'bottleneck', 'what is stopping', 'whats stopping'],
  next: ['مرحله بعد', 'قدم بعد', 'اقدام بعد', 'بعدش', 'چه کار کنم', 'چکار کنم', 'حالا چه', 'next step', 'what next', 'whats next', 'what should i do', 'what do i do', 'then what', 'what now', 'recommended action', 'what actions'],
  open: ['بازش کن', 'باز کن', 'بازکن', 'نشانم بده', 'نشان بده', 'برو به', 'نمایش بده', 'open it', 'open this', 'open ', 'show it', 'show me it', 'take me to', 'go to', 'view it'],
  visual: ['دوربین', 'تصویر', 'پایش', 'عکس', 'نمای', 'رسانه', 'camera', 'visual', 'monitoring', 'photo', 'image', 'feed', 'cctv'],
  inventory: ['موجودی', 'انبار', 'نقطه سفارش', 'کسری', 'کمبود', 'اتمام', 'inventory', 'stock', 'on hand', 'reorder', 'stockout', 'stock-out', 'shortage', 'warehouse'],
  work: ['کار باز', 'کارها', 'کارتابل', 'صف کار', 'در حال اجرا', 'work item', 'work items', 'open work', 'work queue', 'in motion', 'tasks'],
  sales: ['فروش', 'درامد', 'درآمد', 'گردش مالی', 'حاشیه سود', 'sales', 'revenue', 'income', 'turnover', 'margin'],
  attention: ['توجه', 'اولویت', 'فوری', 'مهم‌ترین', 'مهمترین', 'ریسک', 'بحرانی', 'تمرکز امروز', 'نیاز به من', 'attention', 'priority', 'urgent', 'most important', 'risk', 'critical', 'needs me', 'focus on', 'top issue', 'biggest problem'],
  changed: ['چه تغییر', 'تغییری کرده', 'از اخرین', 'از آخرین', 'تازه چه', 'به‌روزرسانی', 'بروزرسانی', 'what changed', 'what has changed', 'since my last', 'since the last', 'latest update', 'what is new'],
  mapNode: ['مالک', 'مسئول', 'پاسخگو', 'وابستگ', 'ساختار', 'چه کسی', 'زیرمجموعه', 'who owns', 'owner of', 'accountable', 'depends on', 'dependency', 'dependencies', 'structure', 'reports to', 'responsible'],
  agent: ['عامل', 'داشبورد عامل', 'agent', 'dashboard'],
  decisions: ['تصمیم', 'گفتگو', 'پیام', 'بی‌جواب', 'بی جواب', 'حل نشده', 'حل‌نشده', 'پاسخ نداده', 'unresolved', 'decision', 'decisions', 'conversation', 'thread', 'message', 'unanswered', 'who needs to know', 'needs a reply'],
  evidence: ['شواهد', 'شاهد', 'مدرک', 'تحلیل', 'اطمینان', 'از کجا', 'چطور فهمید', 'evidence', 'insight', 'confidence', 'analysis', 'how do you know', 'how confident', 'prove', 'data behind'],
  plan: ['هدف', 'تعهد', 'برنامه', 'جهت', 'در خطر', 'چشم‌انداز', 'goal', 'goals', 'commitment', 'target', 'objective', 'direction', 'at risk', 'off track'],
  summary: ['خلاصه', 'مرور کلی', 'اتاق کنترل', 'وضعیت کلی', 'گزارش کلی', 'summary', 'summarize', 'summarise', 'overview', 'control room', 'brief', 'how are we doing'],
  explain: ['چیست', 'توضیح بده', 'توضیح', 'درباره', 'وضعیت', 'جزئیات', 'what is', 'explain', 'tell me about', 'status of', 'details of', 'describe'],
  pronoun: ['این', 'اون', 'آن', 'همین', 'همون', 'اینو', 'اینا', 'this', 'that', ' it', 'it?', 'its ', 'the same'],
  list: ['لیست', 'نشان بده', 'نمایش بده', 'کدام', 'چه چیزهایی', 'همه', 'list', 'show', 'which', 'all '],
} as const

/* ------------------------------------------------------------------ */
/* Engine context                                                      */
/* ------------------------------------------------------------------ */

type Engine = {
  input: AskInput
  fa: boolean
  q: string
  records: AskRecord[]
  byId: Map<string, AskRecord>
  s: (fa: string, en: string) => string
  n: (value: string | number) => string
  dyn: (value: string | undefined | null) => string
  stage: (value: string) => string
  status: (value: string) => string
  priority: (value: Priority) => string
}

const STAGE_KEYS: Record<string, string> = {
  پیشنهاد: 'stages.propose',
  'آماده‌سازی': 'stages.prepare',
  مجاز: 'stages.authorized',
  'در حال اجرا': 'stages.executing',
  مشاهده: 'stages.observe',
  'تایید شده': 'stages.approved',
  نتیجه: 'stages.outcome',
  یادگیری: 'stages.learn',
  بسته: 'stages.closed',
}

const STATUS_KEYS: Record<string, string> = {
  pending: 'status.pendingApproval',
  approved: 'status.approved',
  rejected: 'status.rejected',
  resolved: 'status.resolved',
  open: 'status.open',
  closed: 'status.closed',
  registered: 'status.open',
  assigned: 'status.active',
  awaiting_reply: 'status.pendingApproval',
  acknowledged: 'status.attention',
  active: 'status.active',
  attention: 'status.attention',
  idle: 'status.idle',
  danger: 'status.danger',
  warning: 'status.warning',
  success: 'status.success',
  info: 'status.info',
  'در مسیر': 'status.onTrack',
  'نیازمند اقدام': 'status.needsAction',
  فعال: 'status.active',
}

const PRIORITY_KEYS: Record<string, string> = {
  critical: 'priority.critical',
  high: 'priority.high',
  medium: 'priority.medium',
  low: 'priority.low',
}

const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

function buildEngine(input: AskInput): Engine {
  const fa = input.locale !== 'en'
  const { state, loc, t } = input

  const records: AskRecord[] = []
  const push = (
    kind: RecordKind,
    id: string,
    label: string,
    strongSources: (string | undefined)[],
    weakSources: (string | undefined)[] = [],
  ) => {
    records.push({
      kind,
      id,
      label,
      strong: tokensOf(id, ...strongSources),
      weak: tokensOf(...weakSources),
    })
  }

  for (const p of state.purchases) {
    push('purchase', p.id, loc(p.title, 'purchases', p.id, 'title'), [p.title], [p.workId, p.itemId, p.conversationId])
  }
  for (const tx of state.transactions) {
    push('transaction', tx.id, loc(tx.title, 'transactions', tx.id, 'title'), [tx.title], [tx.workId, tx.approvalId])
  }
  for (const c of state.correspondence) {
    push('correspondence', c.id, loc(c.title, 'correspondence', c.id, 'title'), [c.number, c.title], [c.workId, c.conversationId])
  }
  for (const inv of state.inventory) {
    push('inventory', inv.id, loc(inv.sku, 'inventory', inv.id, 'sku'), [inv.sku], [inv.purchaseRequestId, inv.workId])
  }
  for (const e of state.employees) {
    push('employee', e.id, loc(e.name, 'employees', e.id, 'name'), [e.name], [e.workId])
  }
  for (const w of state.workItems) {
    push('work', w.id, loc(w.title, 'workItems', w.id, 'title'), [w.title], [...w.linked, w.recordId, w.goalId])
  }
  for (const u of state.units) {
    push('unit', u.id, loc(u.name, 'units', u.id, 'name'), [u.name])
  }
  for (const a of state.agents) {
    push('agent', a.id, loc(a.name, 'agents', a.id, 'name'), [a.name], [a.unitId, ...a.decisionIds])
  }
  for (const g of state.goals) {
    push('goal', g.id, loc(g.title, 'goals', g.id, 'title'), [g.title], [...g.workIds])
  }
  for (const i of state.insights) {
    push('insight', i.id, loc(i.title, 'insights', i.id, 'title'), [i.title], [i.recordId, i.workId])
  }
  for (const th of state.threads) {
    push('thread', th.id, loc(th.title, 'threads', th.id, 'title'), [th.title], [th.relatedRecordId, th.relatedWork])
  }
  for (const al of state.alerts) {
    push('alert', al.id, loc(al.title, 'alerts', al.id, 'title'), [al.title], [al.recordId, al.workId])
  }
  for (const o of state.productionOrders) {
    push('productionOrder', o.id, o.id, [o.itemSku, o.soId], [o.workId, ...(o.materialBlockerIds || []), ...o.batchIds])
  }
  for (const b of state.productionBatches) {
    push('productionBatch', b.id, b.id, [b.qcRecordId], [b.workId, b.productionOrderId])
  }
  for (const s of state.settlements) {
    push('settlement', s.id, s.agentName, [s.task], [s.workId])
  }

  const byId = new Map<string, AskRecord>()
  for (const r of records) byId.set(r.id.toUpperCase(), r)

  const s = (faText: string, enText: string) => (fa ? faText : enText)
  const n = (value: string | number) => (fa ? toPersianDigits(value) : String(value))
  const dyn = (value: string | undefined | null) => {
    if (!value) return ''
    if (!fa && PERSIAN_RANGE.test(value)) return ''
    return value.trim()
  }
  const stage = (value: string) => {
    const key = STAGE_KEYS[value]
    if (key) return t(key)
    return dyn(value) || t('stages.executing')
  }
  const status = (value: string) => {
    const key = STATUS_KEYS[value]
    if (key) return t(key)
    return dyn(value) || t('status.open')
  }
  const priority = (value: Priority) => t(PRIORITY_KEYS[value] || 'priority.medium')

  return { input, fa, q: normalize(input.question), records, byId, s, n, dyn, stage, status, priority }
}

/* ------------------------------------------------------------------ */
/* Focus resolution                                                    */
/* ------------------------------------------------------------------ */

function resolveToken(e: Engine, token: string): AskRecord | null {
  const canonical = e.byId.get(token)
  if (canonical) return canonical
  const strong = e.records.filter((r) => r.strong.includes(token))
  if (strong.length) return pickByRank(strong)
  const weak = e.records.filter((r) => r.weak.includes(token))
  if (weak.length) return pickByRank(weak)
  return null
}

function pickByRank(candidates: AskRecord[]): AskRecord {
  return [...candidates].sort((a, b) => KIND_RANK.indexOf(a.kind) - KIND_RANK.indexOf(b.kind))[0]
}

function recordsMentionedIn(e: Engine, text: string): AskRecord[] {
  const spaced = text.replace(/\b([a-z]{2,})\s+(\d{2,})\b/gi, '$1-$2')
  const tokens = tokensOf(spaced)
  const found: AskRecord[] = []
  for (const token of tokens) {
    const record = resolveToken(e, token)
    if (record && !found.some((r) => r.id === record.id && r.kind === record.kind)) found.push(record)
  }
  return found
}

function recordFor(e: Engine, kind: string | undefined, id: string | undefined): AskRecord | null {
  if (!id) return null
  const upper = id.toUpperCase()
  if (kind) {
    const exact = e.records.find((r) => r.kind === kind && r.id.toUpperCase() === upper)
    if (exact) return exact
  }
  return e.byId.get(upper) || null
}

function focusOf(record: AskRecord): AskFocus {
  return { recordType: record.kind, recordId: record.id, label: record.label }
}

/* ------------------------------------------------------------------ */
/* Live-state lookups                                                  */
/* ------------------------------------------------------------------ */

function sortedAlerts(e: Engine): AlertItem[] {
  return [...e.input.openAlerts].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
}

function pendingPurchases(e: Engine) {
  return e.input.state.purchases.filter((p) => p.status === 'pending')
}

function pendingTransactions(e: Engine) {
  return e.input.state.transactions.filter((tx) => tx.status === 'pending')
}

function insightFor(e: Engine, id: string) {
  return e.input.state.insights.find((i) => i.recordId === id)
}

function unitName(e: Engine, unitId: string | undefined): string {
  if (!unitId) return ''
  const u = e.input.state.units.find((x) => x.id === unitId)
  return u ? e.dyn(e.input.loc(u.name, 'units', u.id, 'name')) : ''
}

/** The record that carries the open decision behind an alert (usually an ID the user knows). */
function decisionRecordFor(e: Engine, alert: AlertItem): AskRecord | null {
  const direct = recordFor(e, alert.recordType, alert.recordId)
  if (direct && isDecisionRecord(e, direct)) return direct

  if (alert.recordType === 'inventory') {
    const inv = e.input.state.inventory.find((i) => i.id === alert.recordId)
    if (inv?.purchaseRequestId) {
      const pr = recordFor(e, 'purchase', inv.purchaseRequestId)
      if (pr) return pr
    }
  }

  // Fall back to a pending approval that shares an ID with this alert's story
  // (matter, batch, shipment…), which is what the user can actually act on.
  const alertTokens = tokensOf(alert.title, alert.summary, alert.recordId, alert.workId)
  for (const candidate of [...pendingPurchases(e), ...pendingTransactions(e)]) {
    const kind: RecordKind = e.input.state.purchases.some((p) => p.id === candidate.id) ? 'purchase' : 'transaction'
    const w = e.input.state.workItems.find((x) => x.recordId === candidate.id || x.linked.includes(candidate.id))
    const candidateTokens = tokensOf(candidate.title, ...(w ? [w.title, ...w.linked] : []))
    if (candidateTokens.some((token) => alertTokens.includes(token))) {
      const record = recordFor(e, kind, candidate.id)
      if (record) return record
    }
  }

  const work = alert.workId ? recordFor(e, 'work', alert.workId) : null
  if (work) {
    const w = e.input.state.workItems.find((x) => x.id === work.id)
    if (w?.recordType && w.recordId) {
      const linked = recordFor(e, w.recordType, w.recordId)
      if (linked) return linked
    }
    return work
  }
  return direct
}

function isDecisionRecord(e: Engine, record: AskRecord): boolean {
  if (record.kind === 'purchase' || record.kind === 'transaction') return true
  if (record.kind === 'correspondence') {
    return e.input.state.correspondence.some((c) => c.id === record.id && c.status !== 'closed')
  }
  return false
}

/* ------------------------------------------------------------------ */
/* Composition helpers                                                 */
/* ------------------------------------------------------------------ */

function compose(...parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(' ')
}

function joinList(e: Engine, items: string[], conjunction: 'and' | 'or' = 'and'): string {
  const clean = items.filter(Boolean)
  if (!clean.length) return ''
  if (clean.length === 1) return clean[0]
  const separator = e.fa ? '، ' : ', '
  const last = clean[clean.length - 1]
  const joiner = conjunction === 'or' ? e.s(' یا ', ' or ') : e.s(' و ', ' and ')
  return `${clean.slice(0, -1).join(separator)}${joiner}${last}`
}

/** Business IDs read well in prose; internal slugs do not, so fall back to the label. */
function displayName(record: AskRecord): string {
  return /^[A-Z]/.test(record.id) ? record.id : record.label || record.id
}

/** English needs singular/plural agreement; Persian does not. */
function plural(e: Engine, count: number, faText: string, singular: string, pluralText: string): string {
  return e.fa ? faText : count === 1 ? singular : pluralText
}

function openActionLabel(e: Engine, kind: AskRecord['kind']): string {
  switch (kind) {
    case 'purchase':
      return e.s('مشاهده درخواست', 'View request')
    case 'transaction':
      return e.s('مشاهده پرداخت', 'View payment')
    case 'correspondence':
      return e.s('مشاهده مکاتبه', 'View correspondence')
    case 'inventory':
      return e.s('مشاهده موجودی', 'View inventory')
    case 'work':
      return e.s('مشاهده کار', 'View work')
    case 'employee':
      return e.s('مشاهده پرونده', 'View record')
    case 'alert':
      return e.s('مشاهده مورد', 'View item')
    case 'agent':
      return e.s('مشاهده عامل', 'View agent')
    case 'unit':
      return e.s('مشاهده واحد', 'View unit')
    default:
      return e.s('مشاهده جزئیات', 'View details')
  }
}

function openAction(e: Engine, record: AskRecord): AskAction {
  return {
    label: openActionLabel(e, record.kind),
    to: recordRoute(record.kind, record.id),
    run: 'open',
  }
}

function approveAction(e: Engine, kind: 'purchase' | 'transaction', id: string): AskAction {
  return {
    label: kind === 'purchase' ? e.s('تأیید درخواست', 'Approve request') : e.s('تأیید پرداخت', 'Approve payment'),
    run: kind === 'purchase' ? 'approve-purchase' : 'approve-transaction',
    payload: { id },
    to: recordRoute(kind, id),
  }
}


function followUpAction(e: Engine, record: AskRecord | null): AskAction {
  return {
    label: e.input.t('record.createFollowup'),
    run: 'create-followup',
    payload: {
      recordType: record?.kind || 'ask',
      recordId: record?.id || 'steve',
      label: record?.label || e.input.context?.label || '',
      unitId: (record && unitIdOf(e, record)) || e.input.state.units[0]?.id || 'unit-holding',
    },
  }
}

/** Best-effort owning unit for a record, used when filing follow-up work. */
function unitIdOf(e: Engine, record: AskRecord): string | undefined {
  const { state } = e.input
  switch (record.kind) {
    case 'purchase':
      return state.purchases.find((p) => p.id === record.id)?.unitId
    case 'transaction':
      return state.transactions.find((x) => x.id === record.id)?.unitId
    case 'employee':
      return state.employees.find((x) => x.id === record.id)?.unitId
    case 'work':
      return state.workItems.find((x) => x.id === record.id)?.unitId
    case 'alert':
      return state.alerts.find((x) => x.id === record.id)?.unitId
    case 'goal':
      return state.goals.find((x) => x.id === record.id)?.unitId
    case 'agent':
      return state.agents.find((x) => x.id === record.id)?.unitId
    case 'unit':
      return record.id
    default:
      return undefined
  }
}

/* ------------------------------------------------------------------ */
/* Per-record explainers                                               */
/* ------------------------------------------------------------------ */

type Explained = { text: string; actions: AskAction[]; rich?: AskRich }

function explainPurchase(e: Engine, id: string, angle: 'why' | 'next' | 'status'): Explained {
  const { loc } = e.input
  const pr = e.input.state.purchases.find((p) => p.id === id)
  if (!pr) return notFound(e, id)
  const noun = e.s(LEX.purchase.fa, LEX.purchase.en)
  const approver = e.dyn(loc(pr.approver, 'purchases', pr.id, 'approver'))
  const supplier = e.dyn(loc(pr.supplier, 'purchases', pr.id, 'supplier'))
  const amount = e.dyn(loc(pr.amountLabel, 'purchases', pr.id, 'amountLabel'))
  const due = e.dyn(loc(pr.due, 'purchases', pr.id, 'due'))
  const reason = e.dyn(loc(pr.reason, 'purchases', pr.id, 'reason'))
  const title = e.dyn(loc(pr.title, 'purchases', pr.id, 'title'))
  const work = e.input.state.workItems.find((w) => w.id === pr.workId)
  const alert = e.input.state.alerts.find((a) => (a.recordId === pr.id || a.recordId === pr.itemId) && a.status === 'open')
  const inv = e.input.state.inventory.find((i) => i.id === pr.itemId)

  const headline =
    pr.status === 'pending'
      ? e.s(
          `${pr.id} روی تصمیم شما متوقف است، نه روی داده: هنوز «${e.status('pending')}» است و تاییدکننده آن ${approver || 'مدیریت'} است.`,
          `${pr.id} is blocked on a decision, not on data: it is still ${e.status('pending').toLowerCase()} and the named approver is ${approver || 'management'}.`,
        )
      : pr.status === 'approved'
        ? e.s(
            `${pr.id} دیگر بلاکر نیست — تایید شده و تصمیم بسته شده است.`,
            `${pr.id} is no longer a blocker — it has been approved and the decision is closed.`,
          )
        : e.s(`${pr.id} رد شده و مسیر تامین آن باز نیست.`, `${pr.id} was rejected, so this supply route is closed.`)

  const context = compose(
    e.s(`این ${noun} «${title}» است`, `This ${noun} is “${title}”`),
    amount ? e.s(`به مبلغ ${amount}`, `for ${amount}`) : '',
    supplier ? e.s(`از ${supplier}`, `from ${supplier}`) : '',
    due ? e.s(`با مهلت ${due}.`, `due ${due}.`) : '.',
  ).replace(/\s+\./g, '.')

  const evidence =
    angle === 'why' && reason
      ? e.s(`دلیل ثبت آن: ${reason}`, `It was raised because: ${reason}`)
      : reason && pr.status === 'pending'
        ? e.s(`زمینه: ${reason}`, `Context: ${reason}`)
        : ''

  const linkage = compose(
    work
      ? e.s(
          `کار ${work.id} در مرحله «${e.stage(work.stage)}» است`,
          `Work ${work.id} sits at the ${e.stage(work.stage)} stage`,
        )
      : '',
    alert
      ? e.s(
          `و هشدار «${e.dyn(loc(alert.title, 'alerts', alert.id, 'title'))}» تا تعیین تکلیف آن باز می‌ماند.`,
          `and the alert “${e.dyn(loc(alert.title, 'alerts', alert.id, 'title'))}” stays open until this clears.`,
        )
      : work
        ? '.'
        : '',
  ).replace(/\s+\./g, '.')

  const next =
    pr.status === 'pending'
      ? e.s(
          `همین حالا تاییدش کنید یا رکورد را باز کنید تا شواهد را ببینید.`,
          `Approve it now, or open the record to review the evidence first.`,
        )
      : pr.status === 'approved' && inv
        ? e.s(
            `اقدام بعدی: پیگیری تا تکمیل روی «${e.dyn(loc(inv.sku, 'inventory', inv.id, 'sku'))}».`,
            `Next: follow “${e.dyn(loc(inv.sku, 'inventory', inv.id, 'sku'))}” through to completion.`,
          )
        : e.s(`اقدام بعدی: تعیین مسیر جایگزین تامین.`, `Next: decide on an alternative supply route.`)

  const actions: AskAction[] = []
  if (pr.status === 'pending') actions.push(approveAction(e, 'purchase', pr.id))
  actions.push(openAction(e, { kind: 'purchase', id: pr.id, label: title, strong: [], weak: [] }))
  if (work) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', work.id), run: 'open' })

  return { text: compose(headline, context, evidence, linkage, next), actions }
}

function explainTransaction(e: Engine, id: string, angle: 'why' | 'next' | 'status'): Explained {
  const { loc } = e.input
  const tx = e.input.state.transactions.find((x) => x.id === id)
  if (!tx) return notFound(e, id)
  const title = e.dyn(loc(tx.title, 'transactions', tx.id, 'title'))
  const amount = e.dyn(loc(tx.amountLabel, 'transactions', tx.id, 'amountLabel'))
  const category = e.dyn(loc(tx.category, 'transactions', tx.id, 'category'))
  const comparison = e.dyn(loc(tx.comparison, 'transactions', tx.id, 'comparison'))
  const period = e.dyn(loc(tx.period, 'transactions', tx.id, 'period'))
  const work = tx.workId ? e.input.state.workItems.find((w) => w.id === tx.workId) : undefined

  const headline =
    tx.status === 'pending'
      ? e.s(
          `${tx.id} در صف تایید مالی مانده و تا تصمیم شما پرداخت نمی‌شود.`,
          `${tx.id} is sitting in the finance approval queue and will not settle until you decide.`,
        )
      : tx.status === 'approved'
        ? e.s(`${tx.id} تایید شده و از صف تصمیم خارج است.`, `${tx.id} is approved and out of the decision queue.`)
        : e.s(`${tx.id} رد شده است.`, `${tx.id} was rejected.`)

  const context = compose(
    e.s(`«${title}»`, `“${title}”`),
    amount ? e.s(`به مبلغ ${amount}`, `for ${amount}`) : '',
    category ? e.s(`در دسته ${category}`, `under ${category}`) : '',
    period ? e.s(`برای ${period}.`, `covering ${period}.`) : '.',
  ).replace(/\s+\./g, '.')

  const evidenceItems = tx.evidence.map((x) => e.dyn(x)).filter(Boolean).slice(0, 2)
  const evidence = compose(
    comparison ? e.s(`مقایسه: ${comparison}`, `Comparison: ${comparison}`) : '',
    evidenceItems.length ? e.s(`شواهد پیوست: ${joinList(e, evidenceItems)}.`, `Supporting evidence: ${joinList(e, evidenceItems)}.`) : '',
  )

  const linkage = work
    ? e.s(
        `کار مرتبط ${work.id} در مرحله «${e.stage(work.stage)}» است.`,
        `The linked work ${work.id} is at the ${e.stage(work.stage)} stage.`,
      )
    : ''

  const next =
    tx.status === 'pending'
      ? angle === 'next'
        ? e.s(`اقدام بعدی: تایید پرداخت یا درخواست شواهد بیشتر از عامل مالی.`, `Next: approve the payment or ask the finance agent for more evidence.`)
        : e.s(`می‌توانید همین‌جا تایید کنید یا رکورد را برای بررسی شواهد باز کنید.`, `You can approve it here, or open the record to review the evidence.`)
      : e.s(`اقدام بعدی: پیگیری اثر آن در گزارش دوره.`, `Next: track its effect in the period report.`)

  const actions: AskAction[] = []
  if (tx.status === 'pending') actions.push(approveAction(e, 'transaction', tx.id))
  actions.push(openAction(e, { kind: 'transaction', id: tx.id, label: title, strong: [], weak: [] }))
  if (work) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', work.id), run: 'open' })

  return { text: compose(headline, context, evidence, linkage, next), actions }
}

function explainCorrespondence(e: Engine, id: string, _angle: 'why' | 'next' | 'status'): Explained {
  const { loc } = e.input
  const c = e.input.state.correspondence.find((x) => x.id === id)
  if (!c) return notFound(e, id)
  const title = e.dyn(loc(c.title, 'correspondence', c.id, 'title'))
  const from = e.dyn(loc(c.from, 'correspondence', c.id, 'from'))
  const owner = e.dyn(loc(c.owner, 'correspondence', c.id, 'owner'))
  const deadline = e.dyn(loc(c.deadline, 'correspondence', c.id, 'deadline'))
  const summary = e.dyn(loc(c.summary, 'correspondence', c.id, 'summary'))
  const work = e.input.state.workItems.find((w) => w.id === c.workId)

  const headline =
    c.status === 'closed'
      ? e.s(`${c.id} بسته شده و دیگر معوق نیست.`, `${c.id} is closed and no longer outstanding.`)
      : e.s(
          `${c.id} هنوز باز است و منتظر پاسخ ماست — وضعیت «${e.status(c.status)}».`,
          `${c.id} is still open and waiting on our reply — status ${e.status(c.status).toLowerCase()}.`,
        )

  const context = compose(
    e.s(`نامه شماره ${c.number} با موضوع «${title}»`, `Letter ${c.number}, “${title}”`),
    from ? e.s(`از ${from}`, `from ${from}`) : '',
    owner ? e.s(`و مسئول پیگیری ${owner}`, `owned by ${owner}`) : '',
    deadline ? e.s(`با مهلت ${deadline}.`, `with a ${deadline} deadline.`) : '.',
  ).replace(/\s+\./g, '.')

  const evidence = summary ? e.s(`خلاصه: ${summary}`, `Summary: ${summary}`) : ''
  const linkage = work
    ? e.s(
        `کار ${work.id} در مرحله «${e.stage(work.stage)}» این پاسخ را جلو می‌برد.`,
        `Work ${work.id} at the ${e.stage(work.stage)} stage carries this reply forward.`,
      )
    : ''
  const next =
    c.status === 'closed'
      ? e.s(`اقدام بعدی: بایگانی و ثبت نتیجه در سوابق.`, `Next: archive the outcome in the record history.`)
      : e.s(
          `اقدام بعدی: پیش‌نویس پاسخ را تایید کنید تا پرونده قبل از مهلت بسته شود.`,
          `Next: clear the draft reply so the case closes before the deadline.`,
        )

  const actions: AskAction[] = [openAction(e, { kind: 'correspondence', id: c.id, label: title, strong: [], weak: [] })]
  if (work) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', work.id), run: 'open' })
  if (c.conversationId) actions.push({ label: e.input.t('communication.openRecord'), to: `/communication?thread=${c.conversationId}`, run: 'open' })

  return { text: compose(headline, context, evidence, linkage, next), actions }
}

function explainInventory(e: Engine, id: string, _angle: 'why' | 'next' | 'status'): Explained {
  const { loc } = e.input
  const inv = e.input.state.inventory.find((x) => x.id === id)
  if (!inv) return notFound(e, id)
  const sku = e.dyn(loc(inv.sku, 'inventory', inv.id, 'sku'))
  const unit = e.dyn(loc(inv.unit, 'inventory', inv.id, 'unit'))
  const place = e.dyn(loc(inv.warehouse, 'inventory', inv.id, 'warehouse'))
  const days = (inv.onHand / Math.max(inv.avgDailyUse, 0.1)).toFixed(1)
  const pr = inv.purchaseRequestId ? e.input.state.purchases.find((p) => p.id === inv.purchaseRequestId) : undefined
  const alert = e.input.state.alerts.find((a) => a.recordId === inv.id && a.status === 'open')

  const headline =
    inv.status === 'danger'
      ? e.s(
          `«${sku}» بحرانی است: ${e.n(inv.onHand)} ${unit} در دسترس در برابر نقطه سفارش ${e.n(inv.reorder)}.`,
          `“${sku}” is critical: ${e.n(inv.onHand)} ${unit} on hand against a reorder point of ${e.n(inv.reorder)}.`,
        )
      : inv.status === 'warning'
        ? e.s(
            `«${sku}» به نقطه سفارش نزدیک شده: ${e.n(inv.onHand)} ${unit} در برابر ${e.n(inv.reorder)}.`,
            `“${sku}” is close to its reorder point: ${e.n(inv.onHand)} ${unit} against ${e.n(inv.reorder)}.`,
          )
        : e.s(
            `«${sku}» در وضعیت پایدار است با ${e.n(inv.onHand)} ${unit} موجودی.`,
            `“${sku}” is healthy with ${e.n(inv.onHand)} ${unit} on hand.`,
          )

  const context = e.s(
    `با مصرف میانگین ${e.n(inv.avgDailyUse)} ${unit} در روز، پوشش تقریبی ${e.n(days)} روز است${place ? ` (${place})` : ''}.`,
    `At an average draw of ${e.n(inv.avgDailyUse)} ${unit} per day that is about ${e.n(days)} days of cover${place ? ` (${place})` : ''}.`,
  )

  const evidence = pr
    ? e.s(
        `${pr.id} برای تامین آن ثبت شده و اکنون «${e.status(pr.status)}» است.`,
        `${pr.id} was raised to cover it and is currently ${e.status(pr.status).toLowerCase()}.`,
      )
    : alert
      ? e.s(
          `هشدار باز «${e.dyn(loc(alert.title, 'alerts', alert.id, 'title'))}» به این قلم وصل است.`,
          `The open alert “${e.dyn(loc(alert.title, 'alerts', alert.id, 'title'))}” is attached to this item.`,
        )
      : ''

  const next =
    pr && pr.status === 'pending'
      ? e.s(`اقدام بعدی: تایید ${pr.id} تا پیش از اتمام پوشش، شکاف بسته شود.`, `Next: approve ${pr.id} to close the gap before cover runs out.`)
      : inv.status === 'success'
        ? e.s(`اقدام لازم نیست؛ فقط نقطه سفارش را در بازبینی بعدی مرور کنید.`, `No action needed; just revisit the reorder point at the next review.`)
        : e.s(`اقدام بعدی: ثبت درخواست تامین یا بازبینی نقطه سفارش.`, `Next: raise a supply request or revise the reorder point.`)

  const actions: AskAction[] = [openAction(e, { kind: 'inventory', id: inv.id, label: sku, strong: [], weak: [] })]
  if (pr && pr.status === 'pending') actions.unshift(approveAction(e, 'purchase', pr.id))
  else if (pr) actions.push(openAction(e, { kind: 'purchase', id: pr.id, label: pr.id, strong: [], weak: [] }))

  return { text: compose(headline, context, evidence, next), actions, rich: 'inventory' }
}

function explainEmployee(e: Engine, id: string): Explained {
  const { loc } = e.input
  const emp = e.input.state.employees.find((x) => x.id === id)
  if (!emp) return notFound(e, id)
  const name = e.dyn(loc(emp.name, 'employees', emp.id, 'name'))
  const role = e.dyn(loc(emp.role, 'employees', emp.id, 'role'))
  const work = emp.workId ? e.input.state.workItems.find((w) => w.id === emp.workId) : undefined

  const headline = emp.lateTodayMinutes
    ? e.s(
        `${name} (${role}) امروز ${e.n(emp.lateTodayMinutes)} دقیقه تاخیر داشته است.`,
        `${name} (${role}) was ${e.n(emp.lateTodayMinutes)} minutes late today.`,
      )
    : e.s(`${name} (${role}) امروز بدون تاخیر ثبت شده است.`, `${name} (${role}) has no delay logged today.`)

  const context = e.s(
    `نرخ حضور به‌موقع این نفر ${e.n(emp.attendanceRate)} درصد است.`,
    `Their on-time attendance rate is ${e.n(emp.attendanceRate)}%.`,
  )
  const linkage = work
    ? e.s(`پیگیری در کار ${work.id} («${e.stage(work.stage)}») ثبت شده است.`, `Follow-up is tracked on work ${work.id} (${e.stage(work.stage)}).`)
    : ''
  const next = emp.lateTodayMinutes
    ? e.s(`اقدام بعدی: گفتگوی سرپرست شیفت و ثبت نتیجه در پرونده.`, `Next: have the shift supervisor talk to them and log the outcome.`)
    : e.s(`اقدام خاصی لازم نیست.`, `No action is needed right now.`)

  return {
    text: compose(headline, context, linkage, next),
    actions: [openAction(e, { kind: 'employee', id: emp.id, label: name, strong: [], weak: [] })],
  }
}

function explainWork(e: Engine, id: string, angle: 'why' | 'next' | 'status'): Explained {
  const { loc } = e.input
  const w = e.input.state.workItems.find((x) => x.id === id)
  if (!w) return notFound(e, id)
  const title = e.dyn(loc(w.title, 'workItems', w.id, 'title'))
  const owner = e.dyn(loc(w.owner, 'workItems', w.id, 'owner'))
  const description = e.dyn(loc(w.description, 'workItems', w.id, 'description'))
  const goal = w.goalId ? e.input.state.goals.find((g) => g.id === w.goalId) : undefined
  const linked = w.recordType && w.recordId ? recordFor(e, w.recordType, w.recordId) : null

  const headline = e.s(
    `کار ${w.id} «${title}» در مرحله «${e.stage(w.stage)}» با اولویت ${e.priority(w.priority)} است.`,
    `Work ${w.id} “${title}” is at the ${e.stage(w.stage)} stage with ${e.priority(w.priority).toLowerCase()} priority.`,
  )
  const context = compose(
    owner ? e.s(`مالک آن ${owner} است.`, `${owner} owns it.`) : '',
    description ? e.s(description, description) : '',
  )
  const linkage = linked
    ? e.s(
        `به ${linked.id} وصل است و پیشرفت آن به همان رکورد گره خورده.`,
        `It is linked to ${linked.id}, so progress depends on that record.`,
      )
    : ''
  const goalLine = goal
    ? e.s(
        `این کار هدف «${e.dyn(loc(goal.title, 'goals', goal.id, 'title'))}» را با پیشرفت ${e.n(goal.progress)}٪ تغذیه می‌کند.`,
        `It feeds the goal “${e.dyn(loc(goal.title, 'goals', goal.id, 'title'))}”, currently ${e.n(goal.progress)}% complete.`,
      )
    : ''
  const next =
    angle === 'next'
      ? e.s(`اقدام بعدی: مرحله را جلو ببرید یا رکورد وصل‌شده را تعیین تکلیف کنید.`, `Next: advance the stage, or clear the linked record first.`)
      : e.s(`برای پیشروی، رکورد مرتبط را باز کنید.`, `Open the linked record to move it forward.`)

  const actions: AskAction[] = [{ label: e.input.t('communication.openWork'), to: recordRoute('work', w.id), run: 'open' }]
  if (linked) actions.push(openAction(e, linked))

  return { text: compose(headline, context, linkage, goalLine, next), actions }
}

function explainUnit(e: Engine, id: string): Explained {
  const { loc } = e.input
  const u = e.input.state.units.find((x) => x.id === id)
  if (!u) return notFound(e, id)
  const name = e.dyn(loc(u.name, 'units', u.id, 'name'))
  const kind = e.dyn(loc(u.kind, 'units', u.id, 'kind'))
  const owner = e.dyn(loc(u.owner, 'units', u.id, 'owner'))
  const kpiLabel = e.dyn(loc(u.kpiLabel, 'units', u.id, 'kpiLabel'))
  const kpiValue = e.dyn(loc(u.kpiValue, 'units', u.id, 'kpiValue'))
  const openUnitAlerts = e.input.state.alerts.filter((a) => a.unitId === u.id && a.status === 'open')
  const openWork = e.input.state.workItems.filter((w) => w.unitId === u.id && w.stage !== 'بسته')
  const agent = e.input.state.agents.find((a) => a.id === u.agentId)

  const headline = e.s(
    `${name} (${kind}) را ${owner || 'مدیریت واحد'} اداره می‌کند و شاخص اصلی آن ${kpiLabel}: ${kpiValue} است.`,
    `${name} (${kind}) is run by ${owner || 'the unit lead'}, and its headline metric is ${kpiLabel}: ${kpiValue}.`,
  )
  const context = openUnitAlerts.length
    ? e.s(
        `${e.n(openUnitAlerts.length)} هشدار باز دارد؛ مهم‌ترین آن «${e.dyn(loc(openUnitAlerts[0].title, 'alerts', openUnitAlerts[0].id, 'title'))}» است.`,
        `It has ${e.n(openUnitAlerts.length)} ${plural(e, openUnitAlerts.length, '', 'open alert', 'open alerts')}; the most pressing is “${e.dyn(loc(openUnitAlerts[0].title, 'alerts', openUnitAlerts[0].id, 'title'))}”.`,
      )
    : e.s(`هیچ هشدار بازی روی این واحد نیست.`, `No open alerts sit on this unit.`)
  const workLine = e.s(
    `${e.n(openWork.length)} کار فعال روی این واحد در جریان است.`,
    `${e.n(openWork.length)} ${plural(e, openWork.length, '', 'work item is', 'work items are')} active on it.`,
  )
  const agentLine = agent
    ? e.s(
        `عامل مسئول آن ${e.dyn(loc(agent.name, 'agents', agent.id, 'name'))} با وضعیت «${e.status(agent.status)}» است.`,
        `Its agent is ${e.dyn(loc(agent.name, 'agents', agent.id, 'name'))}, currently ${e.status(agent.status).toLowerCase()}.`,
      )
    : ''

  const actions: AskAction[] = [openAction(e, { kind: 'unit', id: u.id, label: name, strong: [], weak: [] })]
  if (agent) actions.push({ label: e.input.t('actions.openAgent'), to: recordRoute('agent', agent.id), run: 'open' })
  if (openUnitAlerts[0]) {
    const target = recordFor(e, openUnitAlerts[0].recordType, openUnitAlerts[0].recordId)
    if (target) actions.push(openAction(e, target))
  }

  return { text: compose(headline, context, workLine, agentLine), actions }
}

function explainAgent(e: Engine, id: string): Explained {
  const { loc } = e.input
  const a = e.input.state.agents.find((x) => x.id === id)
  if (!a) return notFound(e, id)
  const name = e.dyn(loc(a.name, 'agents', a.id, 'name'))
  const domain = e.dyn(loc(a.domain, 'agents', a.id, 'domain'))
  const summary = e.dyn(loc(a.summary, 'agents', a.id, 'summary'))
  const kpi = a.kpis[0]
  const openDecisions = a.decisionIds.filter((d) => {
    const pr = e.input.state.purchases.find((p) => p.id === d)
    if (pr) return pr.status === 'pending'
    const tx = e.input.state.transactions.find((x) => x.id === d)
    if (tx) return tx.status === 'pending'
    const c = e.input.state.correspondence.find((x) => x.id === d)
    if (c) return c.status !== 'closed'
    return true
  })
  const openRisks = a.riskIds.filter((r) => e.input.state.alerts.some((al) => al.id === r && al.status === 'open'))

  const headline = e.s(
    `${name} مسئول ${domain} است و اکنون وضعیت «${e.status(a.status)}» دارد.`,
    `${name} covers ${domain} and is currently ${e.status(a.status).toLowerCase()}.`,
  )
  const context = summary
  const metrics = compose(
    kpi
      ? e.s(
          `شاخص اصلی آن ${e.dyn(loc(kpi.label, 'agents', a.id, `kpi.${kpi.id}.label`)) || e.dyn(kpi.label)}: ${e.dyn(kpi.value)} است.`,
          `Its headline metric is ${e.dyn(loc(kpi.label, 'agents', a.id, `kpi.${kpi.id}.label`)) || e.dyn(kpi.label)}: ${e.dyn(kpi.value)}.`,
        )
      : '',
    e.s(
      `${e.n(openDecisions.length)} تصمیم باز و ${e.n(openRisks.length)} ریسک باز روی میز آن است.`,
      `It is holding ${e.n(openDecisions.length)} ${plural(e, openDecisions.length, '', 'open decision', 'open decisions')} and ${e.n(openRisks.length)} ${plural(e, openRisks.length, '', 'open risk', 'open risks')}.`,
    ),
  )
  const next = openDecisions.length
    ? e.s(
        `اقدام بعدی: ${openDecisions[0]} را تعیین تکلیف کنید تا صف این عامل باز شود.`,
        `Next: clear ${openDecisions[0]} to unblock this agent's queue.`,
      )
    : e.s(`تصمیم بازی برای شما ندارد؛ فقط پایش ادامه دارد.`, `It holds no decision for you right now; monitoring continues.`)

  const actions: AskAction[] = [{ label: e.input.t('actions.openAgent'), to: recordRoute('agent', a.id), run: 'open' }]
  const first = openDecisions[0] ? e.byId.get(openDecisions[0].toUpperCase()) : null
  if (first) actions.push(openAction(e, first))

  return { text: compose(headline, context, metrics, next), actions }
}

function explainGoal(e: Engine, id: string): Explained {
  const { loc } = e.input
  const g = e.input.state.goals.find((x) => x.id === id)
  if (!g) return notFound(e, id)
  const title = e.dyn(loc(g.title, 'goals', g.id, 'title'))
  const owner = e.dyn(loc(g.owner, 'goals', g.id, 'owner'))
  const target = e.dyn(loc(g.target, 'goals', g.id, 'target'))
  const due = e.dyn(loc(g.due, 'goals', g.id, 'due'))
  const risk = e.dyn(loc(g.risk || '', 'goals', g.id, 'risk'))
  const works = e.input.state.workItems.filter((w) => g.workIds.includes(w.id))

  const headline = e.s(
    `هدف «${title}» با پیشرفت ${e.n(g.progress)}٪ در وضعیت «${e.status(g.status)}» است.`,
    `The goal “${title}” is ${e.n(g.progress)}% complete and currently ${e.status(g.status).toLowerCase()}.`,
  )
  const context = compose(
    owner ? e.s(`مالک آن ${owner} است`, `${owner} owns it`) : '',
    target ? e.s(`با هدف ${target}`, `against a target of ${target}`) : '',
    due ? e.s(`تا ${due}.`, `by ${due}.`) : '.',
  ).replace(/\s+\./g, '.')
  const riskLine = risk ? e.s(`ریسک فعال: ${risk}.`, `Live risk: ${risk}.`) : ''
  const workLine = works.length
    ? e.s(
        `${e.n(works.length)} کار آن را جلو می‌برد؛ نزدیک‌ترین ${works[0].id} در مرحله «${e.stage(works[0].stage)}».`,
        `${e.n(works.length)} ${plural(e, works.length, '', 'work item carries', 'work items carry')} it; the nearest is ${works[0].id} at the ${e.stage(works[0].stage)} stage.`,
      )
    : ''
  const next = risk
    ? e.s(`اقدام بعدی: همین ریسک را ببندید تا پیشرفت آزاد شود.`, `Next: close that risk to release progress.`)
    : e.s(`اقدام بعدی: کار پیشرو را یک مرحله جلو ببرید.`, `Next: advance the leading work item by one stage.`)

  const actions: AskAction[] = [{ label: e.input.t('nav.plan'), to: '/plan', run: 'open' }]
  if (works[0]) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', works[0].id), run: 'open' })

  return { text: compose(headline, context, riskLine, workLine, next), actions }
}

function explainInsight(e: Engine, id: string): Explained {
  const { loc } = e.input
  const i = e.input.state.insights.find((x) => x.id === id)
  if (!i) return notFound(e, id)
  const title = e.dyn(loc(i.title, 'insights', i.id, 'title'))
  const summary = e.dyn(loc(i.summary, 'insights', i.id, 'summary'))
  const recommendation = e.dyn(loc(i.recommendation, 'insights', i.id, 'recommendation'))
  const impact = e.dyn(loc(i.impact, 'insights', i.id, 'impact'))
  const confidence = e.dyn(loc(i.confidence, 'insights', i.id, 'confidence'))
  const evidence = i.evidence.map((x) => e.dyn(x)).filter(Boolean).slice(0, 3)
  const linked = i.recordType && i.recordId ? recordFor(e, i.recordType, i.recordId) : null

  const headline = e.s(`«${title}» — ${summary}`, `“${title}” — ${summary}`)
  const evidenceLine = evidence.length
    ? e.s(`این نتیجه بر پایه ${joinList(e, evidence)} است.`, `That reads from ${joinList(e, evidence)}.`)
    : ''
  const confidenceLine = compose(
    confidence ? e.s(`سطح اطمینان: ${confidence}.`, `Confidence: ${confidence}.`) : '',
    impact ? e.s(`اثر: ${impact}.`, `Impact: ${impact}.`) : '',
  )
  const next = recommendation ? e.s(`پیشنهاد اجرایی: ${recommendation}`, `Recommended action: ${recommendation}`) : ''

  const actions: AskAction[] = [{ label: e.input.t('nav.intelligence'), to: '/intelligence', run: 'open' }]
  if (linked) actions.push(openAction(e, linked))

  return { text: compose(headline, evidenceLine, confidenceLine, next), actions }
}

function explainThread(e: Engine, id: string): Explained {
  const { loc } = e.input
  const th = e.input.state.threads.find((x) => x.id === id)
  if (!th) return notFound(e, id)
  const title = e.dyn(loc(th.title, 'threads', th.id, 'title'))
  const preview = e.dyn(loc(th.preview, 'threads', th.id, 'preview'))
  const linked = th.relatedRecordType && th.relatedRecordId ? recordFor(e, th.relatedRecordType, th.relatedRecordId) : null

  const headline = th.unread
    ? e.s(
        `گفتگوی «${title}» ${e.n(th.unread)} پیام خوانده‌نشده دارد.`,
        `The conversation “${title}” has ${e.n(th.unread)} unread ${plural(e, th.unread, '', 'message', 'messages')}.`,
      )
    : e.s(`گفتگوی «${title}» خوانده شده است.`, `The conversation “${title}” is fully read.`)
  const context = preview ? e.s(`آخرین پیام: ${preview}`, `Latest message: ${preview}`) : ''
  const linkage = linked ? e.s(`به ${linked.id} گره خورده است.`, `It is tied to ${linked.id}.`) : ''
  const next = e.s(`اقدام بعدی: پاسخ بدهید یا از دل آن یک کار پیگیری بسازید.`, `Next: reply, or turn it into a follow-up work item.`)

  const actions: AskAction[] = [{ label: e.input.t('communication.openRecord'), to: recordRoute('thread', th.id), run: 'open' }]
  if (linked) actions.push(openAction(e, linked))

  return { text: compose(headline, context, linkage, next), actions }
}

function explainAlert(e: Engine, id: string): Explained {
  const { loc } = e.input
  const al = e.input.state.alerts.find((x) => x.id === id)
  if (!al) return notFound(e, id)
  const target = recordFor(e, al.recordType, al.recordId)
  if (target) {
    const inner = explainRecord(e, target, 'why')
    return {
      text: compose(
        e.s(
          `هشدار «${e.dyn(loc(al.title, 'alerts', al.id, 'title'))}» با اولویت ${e.priority(al.priority)} باز است.`,
          `The alert “${e.dyn(loc(al.title, 'alerts', al.id, 'title'))}” is open at ${e.priority(al.priority).toLowerCase()} priority.`,
        ),
        inner.text,
      ),
      actions: inner.actions,
    }
  }
  return {
    text: e.s(
      `هشدار «${e.dyn(loc(al.title, 'alerts', al.id, 'title'))}» باز است: ${e.dyn(loc(al.summary, 'alerts', al.id, 'summary'))}`,
      `The alert “${e.dyn(loc(al.title, 'alerts', al.id, 'title'))}” is open: ${e.dyn(loc(al.summary, 'alerts', al.id, 'summary'))}`,
    ),
    actions: [],
  }
}

function notFound(e: Engine, id: string): Explained {
  return {
    text: e.s(
      `رکوردی با شناسه ${id} در وضعیت فعلی پیدا نکردم. شناسه دیگری بدهید یا از فهرست موارد باز شروع کنیم.`,
      `I cannot find ${id} in the current state. Give me another ID, or start from the open items list.`,
    ),
    actions: [{ label: e.input.t('today.workQueue'), to: '/work', run: 'open' }],
  }
}

function explainRecord(e: Engine, record: AskRecord, angle: 'why' | 'next' | 'status'): Explained {
  switch (record.kind) {
    case 'purchase':
      return explainPurchase(e, record.id, angle)
    case 'transaction':
      return explainTransaction(e, record.id, angle)
    case 'correspondence':
      return explainCorrespondence(e, record.id, angle)
    case 'inventory':
      return explainInventory(e, record.id, angle)
    case 'employee':
      return explainEmployee(e, record.id)
    case 'work':
      return explainWork(e, record.id, angle)
    case 'unit':
      return explainUnit(e, record.id)
    case 'agent':
      return explainAgent(e, record.id)
    case 'goal':
      return explainGoal(e, record.id)
    case 'insight':
      return explainInsight(e, record.id)
    case 'thread':
      return explainThread(e, record.id)
    case 'alert':
      return explainAlert(e, record.id)
    case 'productionOrder':
      return explainProductionOrder(e, record.id, angle)
    case 'productionBatch':
      return explainProductionBatch(e, record.id)
    case 'settlement':
      return explainSettlement(e, record.id, angle)
    default:
      return notFound(e, record.id)
  }
}

function explainProductionOrder(e: Engine, id: string, angle: 'why' | 'next' | 'status'): Explained {
  const o = e.input.state.productionOrders.find((x) => x.id === id)
  if (!o) return notFound(e, id)
  const stageLabel = productionStageLabel(o.stage, !e.fa)
  const batches = e.input.state.productionBatches.filter((b) => o.batchIds.includes(b.id))
  const materials = (o.materialBlockerIds || [])
    .map((mid) => e.input.state.inventory.find((i) => i.id === mid))
    .filter((x): x is (typeof e.input.state.inventory)[number] => Boolean(x))

  const headline = o.blocker
    ? e.s(
        `${o.id} در مرحله «${stageLabel}» متوقف است: ${e.dyn(o.blocker)}`,
        `${o.id} is stalled at the ${stageLabel} stage: ${e.dyn(o.blocker)}`,
      )
    : e.s(
        `${o.id} در مرحله «${stageLabel}» است و بلاکری ندارد.`,
        `${o.id} is at the ${stageLabel} stage with no blocker.`,
      )

  const context = e.s(
    `سفارش ${e.n(o.quantity)} ${e.dyn(o.unit)} از «${e.dyn(o.itemSku)}»${o.soId ? ` برای ${o.soId}` : ''} با مهلت ${e.dyn(o.dueDate)}.`,
    `An order for ${e.n(o.quantity)} ${e.dyn(o.unit)} of “${e.dyn(o.itemSku)}”${o.soId ? ` for ${o.soId}` : ''}, due ${e.dyn(o.dueDate)}.`,
  )

  const batchLine = batches.length
    ? e.s(
        `بچ‌های آن: ${joinList(e, batches.map((b) => `${b.id} (${qcStatusLabel(b.qcStatus, false)})`))}.`,
        `Its batches: ${joinList(e, batches.map((b) => `${b.id} (${qcStatusLabel(b.qcStatus, true)})`))}.`,
      )
    : ''

  const materialLine = materials.length
    ? e.s(
        `این تاخیر به کسری «${joinList(e, materials.map((m) => e.dyn(m!.sku)))}» وابسته است.`,
        `This delay is tied to a shortage of ${joinList(e, materials.map((m) => e.dyn(m!.sku)))}.`,
      )
    : ''

  const next =
    angle === 'next'
      ? o.stage === 'hold'
        ? e.s(`اقدام بعدی: بلاکر را رفع و دستور را از Hold آزاد کنید.`, `Next: clear the blocker and release the order from hold.`)
        : o.stage === 'shipment'
          ? e.s(`این دستور ارسال شده و اقدام دیگری لازم نیست.`, `This order has shipped; no further action is needed.`)
          : e.s(`اقدام بعدی: دستور را به مرحله بعد منتقل کنید.`, `Next: advance the order to its next stage.`)
      : e.s(`برای جزئیات، داشبورد تولید را باز کنید.`, `Open the Production dashboard for full detail.`)

  const actions: AskAction[] = [{ label: e.input.t('actions.openAgent'), to: recordRoute('productionOrder', o.id), run: 'open' }]
  if (o.workId) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', o.workId), run: 'open' })

  return { text: compose(headline, context, batchLine, materialLine, next), actions }
}

function explainProductionBatch(e: Engine, id: string): Explained {
  const b = e.input.state.productionBatches.find((x) => x.id === id)
  if (!b) return notFound(e, id)
  const order = b.productionOrderId ? e.input.state.productionOrders.find((o) => o.id === b.productionOrderId) : undefined

  const headline = e.s(
    `${b.id} روی ${e.dyn(b.press)} با وضعیت کیفیت «${qcStatusLabel(b.qcStatus, false)}» است.`,
    `${b.id} ran on ${e.dyn(b.press)} and is currently ${qcStatusLabel(b.qcStatus, true).toLowerCase()}.`,
  )
  const context = e.dyn(b.note)
  const qcLine = b.qcRecordId
    ? e.s(`برگه کیفیت مرتبط: ${b.qcRecordId}.`, `Related QC record: ${b.qcRecordId}.`)
    : ''
  const orderLine = order
    ? e.s(
        `این بچ بخشی از دستور تولید ${order.id} («${e.dyn(order.itemSku)}») است.`,
        `This batch belongs to production order ${order.id} (“${e.dyn(order.itemSku)}”).`,
      )
    : ''
  const next =
    b.qcStatus === 'quarantined' || b.qcStatus === 'failed'
      ? e.s(`اقدام بعدی: بازآزمون نمونه و تعیین تکلیف ترخیص یا ضایعات.`, `Next: retest the sample and decide release or scrap.`)
      : e.s(`اقدام خاصی لازم نیست.`, `No further action is needed.`)

  const actions: AskAction[] = [{ label: e.input.t('actions.openAgent'), to: recordRoute('productionBatch', b.id), run: 'open' }]
  if (b.workId) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', b.workId), run: 'open' })

  return { text: compose(headline, context, qcLine, orderLine, next), actions }
}

function explainSettlement(e: Engine, id: string, angle: 'why' | 'next' | 'status'): Explained {
  const s = e.input.state.settlements.find((x) => x.id === id)
  if (!s) return notFound(e, id)
  const statusLabel = settlementLabel(s.status, !e.fa)

  const headline = e.s(
    `${s.id} برای «${e.dyn(s.agentName)}» در وضعیت «${statusLabel}» است.`,
    `${s.id} for “${e.dyn(s.agentName)}” is currently ${statusLabel.toLowerCase()}.`,
  )
  const context = e.s(
    `وظیفه: ${e.dyn(s.task)} — مصوب ${e.n(s.approvedAmount)} م، پرداخت‌شده ${e.n(s.paidAmount)} م، مانده ${e.n(s.outstandingAmount)} م.`,
    `Task: ${e.dyn(s.task)} — approved ${e.n(s.approvedAmount)}M, paid ${e.n(s.paidAmount)}M, outstanding ${e.n(s.outstandingAmount)}M.`,
  )
  const evidence = angle === 'why' ? e.s(`شواهد: ${e.dyn(s.evidence)}.`, `Evidence: ${e.dyn(s.evidence)}.`) : ''
  const next =
    s.status === 'pending_confirmation' || s.status === 'submitted'
      ? e.s(`اقدام بعدی: تایید تخصیص تا آماده تسویه شود.`, `Next: confirm the assignment so it is ready for settlement.`)
      : (s.status === 'ready_for_settlement' || s.status === 'partially_settled') && s.outstandingAmount > 0
        ? e.s(`اقدام بعدی: ثبت پرداخت مانده ${e.n(s.outstandingAmount)} م.`, `Next: settle the outstanding ${e.n(s.outstandingAmount)}M.`)
        : e.s(`اقدام دیگری لازم نیست.`, `No further action is needed.`)

  const actions: AskAction[] = [{ label: e.input.t('actions.openAgent'), to: recordRoute('settlement', s.id), run: 'open' }]
  if (s.workId) actions.push({ label: e.input.t('communication.openWork'), to: recordRoute('work', s.workId), run: 'open' })

  return { text: compose(headline, context, evidence, next), actions }
}

/* ------------------------------------------------------------------ */
/* Cross-record answers                                                */
/* ------------------------------------------------------------------ */

function answerAttention(e: Engine, scopeUnitId?: string): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const all = sortedAlerts(e).filter((a) => !scopeUnitId || a.unitId === scopeUnitId)
  if (!all.length) {
    const pending = [...pendingPurchases(e), ...pendingTransactions(e)]
    if (!pending.length) {
      return {
        text: e.s(
          `هیچ هشدار باز یا تایید معلقی در وضعیت فعلی نیست. تمرکز امروز می‌تواند روی جلو بردن کارهای در جریان باشد.`,
          `No open alerts and no pending approvals in the current state. Today's focus can shift to advancing work already in motion.`,
        ),
        actions: [{ label: e.input.t('today.workQueue'), to: '/work', run: 'open' }],
        focus: null,
      }
    }
    const first = pending[0]
    return {
      text: e.s(
        `هشدار بازی نمانده، اما ${first.id} هنوز منتظر تصمیم شماست (${e.dyn(first.amountLabel)}).`,
        `No alerts are open, but ${first.id} still waits on your decision (${e.dyn(first.amountLabel)}).`,
      ),
      actions: [openAction(e, { kind: 'purchase', id: first.id, label: first.id, strong: [], weak: [] })],
      focus: { recordType: 'purchase', recordId: first.id, label: first.id },
    }
  }

  const top = all[0]
  const decision = decisionRecordFor(e, top)
  const topTitle = e.dyn(loc(top.title, 'alerts', top.id, 'title'))
  const topSummary = e.dyn(loc(top.summary, 'alerts', top.id, 'summary'))
  const unit = unitName(e, top.unitId)

  const headline = e.s(
    `در صدر صف شما «${topTitle}» است — اولویت ${e.priority(top.priority)}${unit ? ` در ${unit}` : ''}.`,
    `Top of your queue is “${topTitle}” — ${e.priority(top.priority).toLowerCase()} priority${unit ? ` in ${unit}` : ''}.`,
  )
  const context = topSummary
  // Skip the decision line when it adds nothing: same record as the alert, or already named in the summary.
  const decisionLine = decision && decision.id !== top.recordId && !topSummary.includes(decision.id)
    ? e.s(
        `تصمیم باز روی آن ${decision.id} است (${liveStatusOf(e, decision)}).`,
        `The open decision on it is ${decision.id} (${liveStatusOf(e, decision)}).`,
      )
    : ''

  const rest = restOfQueue(e, all)

  const next = decision && (decision.kind === 'purchase' || decision.kind === 'transaction')
    ? e.s(
        `سریع‌ترین اقدام: ${decision.id} را تعیین تکلیف کنید تا بزرگ‌ترین ریسک بسته شود.`,
        `Fastest move: clear ${decision.id} to close the biggest risk first.`,
      )
    : e.s(`سریع‌ترین اقدام: همین مورد را باز کنید و مسیر بستنش را انتخاب کنید.`, `Fastest move: open this item and pick a route to close it.`)

  const actions: AskAction[] = []
  if (decision) {
    if (decision.kind === 'purchase' && isPending(e, decision)) actions.push(approveAction(e, 'purchase', decision.id))
    if (decision.kind === 'transaction' && isPending(e, decision)) actions.push(approveAction(e, 'transaction', decision.id))
    actions.push(openAction(e, decision))
  }
  const target = recordFor(e, top.recordType, top.recordId)
  if (target && (!decision || target.id !== decision.id)) actions.push(openAction(e, target))

  return {
    text: compose(headline, context, decisionLine, rest, next),
    actions,
    focus: decision ? focusOf(decision) : target ? focusOf(target) : null,
  }
}

/** "3 other items are open: A and B." / "… open, including A and B." when the list is long. */
function restOfQueue(e: Engine, all: AlertItem[]): string {
  const remaining = all.length - 1
  if (remaining < 1) return ''
  const names = all.slice(1, 3).map((a) => e.dyn(e.input.loc(a.title, 'alerts', a.id, 'title'))).filter(Boolean)
  if (!names.length) return ''
  const listed = joinList(e, names)
  if (remaining === 1) {
    return e.s(`یک مورد باز دیگر هم هست: ${listed}.`, `One other item is open: ${listed}.`)
  }
  return remaining > names.length
    ? e.s(
        `${e.n(remaining)} مورد باز دیگر هم هست، از جمله ${listed}.`,
        `${e.n(remaining)} other ${plural(e, remaining, '', 'item is', 'items are')} open, including ${listed}.`,
      )
    : e.s(
        `${e.n(remaining)} مورد باز دیگر هم هست: ${listed}.`,
        `${e.n(remaining)} other ${plural(e, remaining, '', 'item is', 'items are')} open: ${listed}.`,
      )
}

function isPending(e: Engine, record: AskRecord): boolean {
  if (record.kind === 'purchase') return e.input.state.purchases.some((p) => p.id === record.id && p.status === 'pending')
  if (record.kind === 'transaction') return e.input.state.transactions.some((tx) => tx.id === record.id && tx.status === 'pending')
  return false
}

function liveStatusOf(e: Engine, record: AskRecord): string {
  if (record.kind === 'purchase') {
    const pr = e.input.state.purchases.find((p) => p.id === record.id)
    return pr ? e.status(pr.status).toLowerCase() : ''
  }
  if (record.kind === 'transaction') {
    const tx = e.input.state.transactions.find((x) => x.id === record.id)
    return tx ? e.status(tx.status).toLowerCase() : ''
  }
  if (record.kind === 'correspondence') {
    const c = e.input.state.correspondence.find((x) => x.id === record.id)
    return c ? e.status(c.status).toLowerCase() : ''
  }
  if (record.kind === 'work') {
    const w = e.input.state.workItems.find((x) => x.id === record.id)
    return w ? e.stage(w.stage).toLowerCase() : ''
  }
  if (record.kind === 'inventory') {
    const inv = e.input.state.inventory.find((x) => x.id === record.id)
    return inv ? e.status(inv.status).toLowerCase() : ''
  }
  if (record.kind === 'goal') {
    const g = e.input.state.goals.find((x) => x.id === record.id)
    return g ? e.status(g.status).toLowerCase() : ''
  }
  return e.status('open').toLowerCase()
}

function answerPending(e: Engine): Explained & { focus: AskFocus | null } {
  const prs = pendingPurchases(e)
  const txs = pendingTransactions(e)
  if (!prs.length && !txs.length) {
    return {
      text: e.s(
        `هیچ تاییدی در صف شما نیست — همه درخواست‌ها و پرداخت‌ها تعیین تکلیف شده‌اند.`,
        `Your approval queue is empty — every request and payment has been decided.`,
      ),
      actions: [{ label: e.input.t('today.workQueue'), to: '/work', run: 'open' }],
      focus: null,
    }
  }
  const items = [
    ...prs.map((p) => `${p.id} (${e.dyn(e.input.loc(p.amountLabel, 'purchases', p.id, 'amountLabel'))})`),
    ...txs.map((x) => `${x.id} (${e.dyn(e.input.loc(x.amountLabel, 'transactions', x.id, 'amountLabel'))})`),
  ]
  const first = prs[0] || txs[0]
  const firstKind: 'purchase' | 'transaction' = prs[0] ? 'purchase' : 'transaction'
  const oldest = prs[0]
    ? e.dyn(e.input.loc(prs[0].reason, 'purchases', prs[0].id, 'reason'))
    : e.dyn(e.input.loc(txs[0].comparison, 'transactions', txs[0].id, 'comparison'))

  return {
    text: compose(
      e.s(
        `${e.n(items.length)} تصمیم در صف تایید شماست: ${joinList(e, items)}.`,
        `${e.n(items.length)} ${plural(e, items.length, '', 'decision is', 'decisions are')} waiting on you: ${joinList(e, items)}.`,
      ),
      oldest ? e.s(`فوری‌ترین ${first.id} است — ${oldest}`, `The most urgent is ${first.id} — ${oldest}`) : '',
      e.s(
        `تا این‌ها باز بمانند، کارهای وصل‌شده در همان مرحله متوقف می‌مانند.`,
        `While these stay open, the work items attached to them cannot advance.`,
      ),
      e.s(`می‌توانید ${first.id} را همین‌جا تایید کنید.`, `You can approve ${first.id} right here.`),
    ),
    actions: [approveAction(e, firstKind, first.id), openAction(e, { kind: firstKind, id: first.id, label: first.id, strong: [], weak: [] })],
    rich: 'approvals',
    focus: { recordType: firstKind, recordId: first.id, label: first.id },
  }
}

function answerInventory(e: Engine): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const critical = e.input.state.inventory.filter((i) => i.status === 'danger')
  const watch = e.input.state.inventory.filter((i) => i.status === 'warning')
  const target = critical[0] || watch[0] || e.input.state.inventory[0]
  if (!target) {
    return { text: e.s('قلمی برای پایش موجودی ثبت نشده است.', 'No inventory items are tracked in this state.'), actions: [], focus: null }
  }
  const detail = explainInventory(e, target.id, 'status')
  const spread = e.s(
    `در مجموع ${e.n(critical.length)} قلم بحرانی و ${e.n(watch.length)} قلم نزدیک نقطه سفارش داریم.`,
    `Across the board, ${e.n(critical.length)} ${plural(e, critical.length, '', 'item is', 'items are')} critical and ${e.n(watch.length)} ${plural(e, watch.length, '', 'is', 'are')} near their reorder point.`,
  )
  return {
    text: compose(detail.text, spread),
    actions: detail.actions,
    rich: 'inventory',
    focus: { recordType: 'inventory', recordId: target.id, label: e.dyn(loc(target.sku, 'inventory', target.id, 'sku')) },
  }
}

function answerWork(e: Engine): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const open = e.input.state.workItems.filter((w) => w.stage !== 'بسته' && w.stage !== 'یادگیری')
  const blocked = open.filter((w) => {
    if (w.recordType === 'purchase') return e.input.state.purchases.some((p) => p.id === w.recordId && p.status === 'pending')
    if (w.recordType === 'transaction') return e.input.state.transactions.some((tx) => tx.id === w.recordId && tx.status === 'pending')
    if (w.recordType === 'correspondence') return e.input.state.correspondence.some((c) => c.id === w.recordId && c.status !== 'closed')
    return false
  })
  const ranked = [...open].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  const lead = blocked[0] || ranked[0]
  if (!lead) {
    return { text: e.s('کار بازی در جریان نیست.', 'No work items are in motion.'), actions: [], focus: null }
  }
  const leadTitle = e.dyn(loc(lead.title, 'workItems', lead.id, 'title'))
  const linked = lead.recordType && lead.recordId ? recordFor(e, lead.recordType, lead.recordId) : null

  return {
    text: compose(
      blocked.length
        ? e.s(
            `${e.n(blocked.length)} کار روی تصمیم باز گیر کرده؛ مهم‌ترین آن ${lead.id} «${leadTitle}» است.`,
            `${e.n(blocked.length)} ${plural(e, blocked.length, '', 'work item is', 'work items are')} stuck on an open decision; the most important is ${lead.id} “${leadTitle}”.`,
          )
        : e.s(
            `بالاترین اولویت باز، کار ${lead.id} «${leadTitle}» است.`,
            `The highest-priority open item is work ${lead.id} “${leadTitle}”.`,
          ),
      e.s(
        `اکنون در مرحله «${e.stage(lead.stage)}» با اولویت ${e.priority(lead.priority)} و مالکیت ${e.dyn(loc(lead.owner, 'workItems', lead.id, 'owner'))} است.`,
        `It is at the ${e.stage(lead.stage)} stage, ${e.priority(lead.priority).toLowerCase()} priority, owned by ${e.dyn(loc(lead.owner, 'workItems', lead.id, 'owner'))}.`,
      ),
      linked
        ? e.s(
            `تا ${linked.id} (${liveStatusOf(e, linked)}) تعیین تکلیف نشود، این کار جلو نمی‌رود.`,
            `It cannot advance until ${linked.id} (${liveStatusOf(e, linked)}) is decided.`,
          )
        : '',
      e.s(
        `در مجموع ${e.n(open.length)} کار باز در کارتابل است.`,
        `In total ${e.n(open.length)} ${plural(e, open.length, '', 'work item is', 'work items are')} open in the queue.`,
      ),
    ),
    actions: [
      { label: e.input.t('communication.openWork'), to: recordRoute('work', lead.id), run: 'open' },
      ...(linked ? [openAction(e, linked)] : []),
    ],
    focus: linked ? focusOf(linked) : { recordType: 'work', recordId: lead.id, label: leadTitle },
  }
}

function answerSales(e: Engine): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const revenue = e.input.state.transactions.filter((tx) => tx.status === 'approved').sort((a, b) => b.amount - a.amount)[0]
  const revenueUnit = revenue ? e.input.state.units.find((u) => u.id === revenue.unitId) : undefined
  const growthInsight = e.input.state.insights.find((i) => i.severity === 'success') || e.input.state.insights[0]
  if (!revenue) {
    return { text: e.s('تراکنش درآمدی ثبت‌شده‌ای در وضعیت فعلی نیست.', 'No booked revenue transactions exist in the current state.'), actions: [], focus: null }
  }
  return {
    text: compose(
      e.s(
        `بزرگ‌ترین رقم ثبت‌شده ${revenue.id} «${e.dyn(loc(revenue.title, 'transactions', revenue.id, 'title'))}» به مبلغ ${e.dyn(loc(revenue.amountLabel, 'transactions', revenue.id, 'amountLabel'))} است.`,
        `The largest booked figure is ${revenue.id} “${e.dyn(loc(revenue.title, 'transactions', revenue.id, 'title'))}” at ${e.dyn(loc(revenue.amountLabel, 'transactions', revenue.id, 'amountLabel'))}.`,
      ),
      revenueUnit
        ? e.s(
            `این رقم از ${e.dyn(loc(revenueUnit.name, 'units', revenueUnit.id, 'name'))} می‌آید و شاخص آن ${e.dyn(loc(revenueUnit.kpiLabel, 'units', revenueUnit.id, 'kpiLabel'))}: ${e.dyn(loc(revenueUnit.kpiValue, 'units', revenueUnit.id, 'kpiValue'))} است.`,
            `It comes from ${e.dyn(loc(revenueUnit.name, 'units', revenueUnit.id, 'name'))}, whose headline metric is ${e.dyn(loc(revenueUnit.kpiLabel, 'units', revenueUnit.id, 'kpiLabel'))}: ${e.dyn(loc(revenueUnit.kpiValue, 'units', revenueUnit.id, 'kpiValue'))}.`,
          )
        : '',
      e.s(`روند: ${e.dyn(loc(revenue.comparison, 'transactions', revenue.id, 'comparison'))}`, `Trend: ${e.dyn(loc(revenue.comparison, 'transactions', revenue.id, 'comparison'))}`),
      growthInsight
        ? e.s(
            `پیشنهاد مرتبط: ${e.dyn(loc(growthInsight.recommendation, 'insights', growthInsight.id, 'recommendation'))}`,
            `Related recommendation: ${e.dyn(loc(growthInsight.recommendation, 'insights', growthInsight.id, 'recommendation'))}`,
          )
        : '',
    ),
    actions: [
      openAction(e, { kind: 'transaction', id: revenue.id, label: revenue.id, strong: [], weak: [] }),
      { label: e.input.t('nav.intelligence'), to: '/intelligence', run: 'open' },
    ],
    focus: { recordType: 'transaction', recordId: revenue.id, label: revenue.id },
  }
}

function answerDecisions(e: Engine): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const unread = e.input.state.threads.filter((th) => th.unread > 0)
  const lead = unread[0] || e.input.state.threads[0]
  if (!lead) {
    return { text: e.s('گفتگوی بازی ثبت نشده است.', 'No conversations are recorded.'), actions: [], focus: null }
  }
  const linked = lead.relatedRecordType && lead.relatedRecordId ? recordFor(e, lead.relatedRecordType, lead.relatedRecordId) : null
  const openDecisions = [...pendingPurchases(e), ...pendingTransactions(e)].map((x) => x.id)

  return {
    text: compose(
      unread.length
        ? e.s(
            `${e.n(unread.length)} گفتگو منتظر شماست؛ داغ‌ترین آن «${e.dyn(loc(lead.title, 'threads', lead.id, 'title'))}» با ${e.n(lead.unread)} پیام خوانده‌نشده است.`,
            `${e.n(unread.length)} ${plural(e, unread.length, '', 'conversation is', 'conversations are')} waiting on you; the hottest is “${e.dyn(loc(lead.title, 'threads', lead.id, 'title'))}” with ${e.n(lead.unread)} unread ${plural(e, lead.unread, '', 'message', 'messages')}.`,
          )
        : e.s(
            `پیام خوانده‌نشده‌ای نیست؛ آخرین گفتگو «${e.dyn(loc(lead.title, 'threads', lead.id, 'title'))}» بود.`,
            `Nothing is unread; the latest conversation was “${e.dyn(loc(lead.title, 'threads', lead.id, 'title'))}”.`,
          ),
      e.s(`آخرین پیام: ${e.dyn(loc(lead.preview, 'threads', lead.id, 'preview'))}`, `Latest message: ${e.dyn(loc(lead.preview, 'threads', lead.id, 'preview'))}`),
      linked
        ? e.s(
            `تصمیم باز پشت آن ${linked.id} است (${liveStatusOf(e, linked)}).`,
            `The open decision behind it is ${linked.id} (${liveStatusOf(e, linked)}).`,
          )
        : '',
      openDecisions.length
        ? e.s(
            `در کل ${joinList(e, openDecisions)} هنوز تصمیم نگرفته‌اند.`,
            `Overall, ${joinList(e, openDecisions)} still ${plural(e, openDecisions.length, '', 'has', 'have')} no decision.`,
          )
        : e.s(`تصمیم مالی بازی باقی نمانده است.`, `No financial decisions remain open.`),
    ),
    actions: [
      { label: e.input.t('communication.openRecord'), to: recordRoute('thread', lead.id), run: 'open' },
      ...(linked ? [openAction(e, linked)] : []),
    ],
    focus: linked ? focusOf(linked) : null,
  }
}

function answerEvidence(e: Engine, focus: AskRecord | null): Explained & { focus: AskFocus | null } {
  const scoped = focus ? insightFor(e, focus.id) : null
  const ranked = [...e.input.state.insights].sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
  const insight = scoped || ranked[0]
  if (!insight) {
    return { text: e.s('تحلیلی ثبت نشده است.', 'No insights are recorded.'), actions: [], focus: null }
  }
  const detail = explainInsight(e, insight.id)
  return { ...detail, focus: { recordType: 'insight', recordId: insight.id, label: insight.title } }
}

function severityRank(severity: string): number {
  return ['danger', 'warning', 'info', 'success', 'neutral'].indexOf(severity)
}

function answerPlan(e: Engine): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const atRisk = e.input.state.goals.filter((g) => g.risk || g.status === 'نیازمند اقدام' || g.status === 'Needs action')
  const ranked = [...e.input.state.goals].sort((a, b) => a.progress - b.progress)
  const goal = atRisk[0] || ranked[0]
  if (!goal) {
    return { text: e.s('هدفی ثبت نشده است.', 'No goals are recorded.'), actions: [], focus: null }
  }
  const detail = explainGoal(e, goal.id)
  const others = atRisk.length > 1
    ? e.s(
        `${e.n(atRisk.length - 1)} تعهد دیگر هم در ریسک است: ${joinList(e, atRisk.slice(1, 3).map((g) => e.dyn(loc(g.title, 'goals', g.id, 'title'))))}.`,
        `${e.n(atRisk.length - 1)} other ${plural(e, atRisk.length - 1, '', 'commitment is', 'commitments are')} also at risk: ${joinList(e, atRisk.slice(1, 3).map((g) => e.dyn(loc(g.title, 'goals', g.id, 'title'))))}.`,
      )
    : ''
  return { text: compose(detail.text, others), actions: detail.actions, focus: { recordType: 'goal', recordId: goal.id, label: goal.title } }
}

function answerSummary(e: Engine): Explained & { focus: AskFocus | null } {
  const alerts = sortedAlerts(e)
  const prs = pendingPurchases(e)
  const txs = pendingTransactions(e)
  const primaryUnit = e.input.state.units.find((u) => u.id !== 'unit-holding') || e.input.state.units[0]
  const decisions = [...prs.map((p) => p.id), ...txs.map((x) => x.id)]

  return {
    text: compose(
      e.s(
        `تصویر کلی: ${e.n(alerts.length)} هشدار باز و ${e.n(decisions.length)} تصمیم منتظر شما.`,
        `Overall picture: ${e.n(alerts.length)} open ${plural(e, alerts.length, '', 'alert', 'alerts')} and ${e.n(decisions.length)} ${plural(e, decisions.length, '', 'decision', 'decisions')} waiting on you.`,
      ),
      primaryUnit
        ? e.s(
            `شاخص پیشرو ${e.dyn(e.input.loc(primaryUnit.kpiLabel, 'units', primaryUnit.id, 'kpiLabel'))}: ${e.dyn(e.input.loc(primaryUnit.kpiValue, 'units', primaryUnit.id, 'kpiValue'))} در ${e.dyn(e.input.loc(primaryUnit.name, 'units', primaryUnit.id, 'name'))} است.`,
            `The leading metric is ${e.dyn(e.input.loc(primaryUnit.kpiLabel, 'units', primaryUnit.id, 'kpiLabel'))}: ${e.dyn(e.input.loc(primaryUnit.kpiValue, 'units', primaryUnit.id, 'kpiValue'))} at ${e.dyn(e.input.loc(primaryUnit.name, 'units', primaryUnit.id, 'name'))}.`,
          )
        : '',
      decisions.length
        ? e.s(`تصمیم‌های باز: ${joinList(e, decisions)}.`, `Open decisions: ${joinList(e, decisions)}.`)
        : e.s(`تصمیم بازی نمانده است.`, `No decisions remain open.`),
      alerts[0]
        ? e.s(
            `بزرگ‌ترین ریسک «${e.dyn(e.input.loc(alerts[0].title, 'alerts', alerts[0].id, 'title'))}» است و اول باید بسته شود.`,
            `The biggest risk is “${e.dyn(e.input.loc(alerts[0].title, 'alerts', alerts[0].id, 'title'))}”, and it should close first.`,
          )
        : '',
    ),
    actions: [
      { label: e.input.t('actions.openAgent'), to: '/agents', run: 'open' },
      ...(prs[0] ? [approveAction(e, 'purchase', prs[0].id)] : txs[0] ? [approveAction(e, 'transaction', txs[0].id)] : []),
    ],
    rich: 'control-room',
    focus: prs[0] ? { recordType: 'purchase', recordId: prs[0].id, label: prs[0].id } : null,
  }
}

function answerChanged(e: Engine): Explained & { focus: AskFocus | null } {
  const feed = e.input.state.activityFeed.slice(0, 3)
  if (!feed.length) return answerAttention(e)
  const lines = feed.map((a) => `${a.time} — ${e.dyn(e.input.loc(a.text, 'activityFeed', a.id, 'text'))}`).filter(Boolean)
  const last = feed.find((a) => a.recordType && a.recordId)
  const target = last ? recordFor(e, last.recordType, last.recordId) : null
  const openDecisions = pendingPurchases(e).length + pendingTransactions(e).length
  const closedNote = openDecisions
    ? e.s(
        `${e.n(openDecisions)} تصمیم هنوز منتظر شماست.`,
        `${e.n(openDecisions)} ${plural(e, openDecisions, '', 'decision is', 'decisions are')} still waiting on you.`,
      )
    : e.s(
        `تصمیم‌های اصلی خرید و پرداخت در صف شما بسته شده‌اند.`,
        `The main purchase and payment decisions in your queue are closed.`,
      )
  return {
    text: compose(
      e.s(`از آخرین بازبینی این‌ها ثبت شده:`, `Since your last review, this is what landed:`),
      lines.join(e.s(' · ', ' · ')),
      target
        ? e.s(
            `تازه‌ترین رکورد تغییر‌یافته ${displayName(target)} است (${liveStatusOf(e, target)}).`,
            `The most recently touched record is ${displayName(target)} (${liveStatusOf(e, target)}).`,
          )
        : '',
      closedNote,
    ),
    actions: target ? [openAction(e, target)] : [{ label: e.input.t('today.workQueue'), to: '/work', run: 'open' }],
    focus: target ? focusOf(target) : null,
  }
}

function answerVisual(e: Engine): Explained & { focus: AskFocus | null } {
  const { loc } = e.input
  const feeds = e.input.state.visualFeeds || []
  const feed = feeds.find((f) => f.status === 'attention') || feeds[0]
  if (!feed) {
    return {
      text: e.s('در این دمو نمای تصویری فعالی ثبت نشده است.', 'No visual feed is registered in this demo state.'),
      actions: [],
      focus: null,
    }
  }
  const target = feed.recordType && feed.recordId ? recordFor(e, feed.recordType, feed.recordId) : null
  return {
    text: compose(
      e.s(
        `آخرین نمای ثبت‌شده «${e.dyn(loc(feed.title, 'visualFeeds', feed.id, 'title'))}» در ${e.dyn(loc(feed.location, 'visualFeeds', feed.id, 'location'))} ساعت ${feed.time} است.`,
        `The latest captured view is “${e.dyn(loc(feed.title, 'visualFeeds', feed.id, 'title'))}” at ${e.dyn(loc(feed.location, 'visualFeeds', feed.id, 'location'))}, ${feed.time}.`,
      ),
      e.s(
        `این نما فقط شاهد تصویری است — کنترل دوربین در این دمو مدل نشده است.`,
        `This is visual evidence only — camera control is not modelled in this demo.`,
      ),
      target ? e.s(`به رکورد ${target.id} وصل است.`, `It is attached to record ${target.id}.`) : '',
      e.s(`اقدام بعدی: نما را باز کنید و در صورت نیاز کار پیگیری بسازید.`, `Next: open the view and raise a follow-up if it needs one.`),
    ),
    actions: [
      { label: e.input.t('nav.agents'), to: '/agents?lane=cameras', run: 'open' },
      ...(target ? [openAction(e, target)] : []),
    ],
    focus: target ? focusOf(target) : null,
  }
}

function answerMapNode(e: Engine, focus: AskRecord | null): Explained & { focus: AskFocus | null } {
  let unitId: string | undefined
  if (focus?.kind === 'unit') unitId = focus.id
  else if (focus?.kind === 'agent') unitId = e.input.state.agents.find((a) => a.id === focus.id)?.unitId
  if (!unitId) {
    const worst = sortedAlerts(e)[0]
    unitId = worst?.unitId || e.input.state.units[1]?.id || e.input.state.units[0]?.id
  }
  if (!unitId) return { text: e.s('ساختاری ثبت نشده است.', 'No structure is recorded.'), actions: [], focus: null }
  const detail = explainUnit(e, unitId)
  const dependents = e.input.state.mapNodes.filter((n) => n.parent && n.unitId === unitId)
  const line = dependents.length
    ? e.s(
        `${e.n(dependents.length)} نود دیگر به آن وصل است.`,
        `${e.n(dependents.length)} other ${plural(e, dependents.length, '', 'node hangs', 'nodes hang')} off it.`,
      )
    : ''
  return { text: compose(detail.text, line), actions: detail.actions, focus: { recordType: 'unit', recordId: unitId, label: unitId } }
}

function answerAgentOverview(e: Engine, focus: AskRecord | null): Explained & { focus: AskFocus | null } {
  let agentId: string | undefined
  if (focus?.kind === 'agent') agentId = focus.id
  else if (focus?.kind === 'unit') agentId = e.input.state.units.find((u) => u.id === focus.id)?.agentId
  if (!agentId) {
    const needsAttention = e.input.state.agents.find((a) => a.status === 'attention')
    agentId = needsAttention?.id || e.input.state.agents[0]?.id
  }
  if (!agentId) return { text: e.s('عاملی ثبت نشده است.', 'No agents are recorded.'), actions: [], focus: null }
  const detail = explainAgent(e, agentId)
  return { ...detail, focus: { recordType: 'agent', recordId: agentId, label: agentId } }
}

function answerApprove(e: Engine, focus: AskRecord | null): Explained & { focus: AskFocus | null } {
  const candidates = [...pendingPurchases(e), ...pendingTransactions(e)]
  if (focus && (focus.kind === 'purchase' || focus.kind === 'transaction')) {
    if (!isPending(e, focus)) {
      const detail = explainRecord(e, focus, 'status')
      return {
        text: compose(
          e.s(
            `${focus.id} دیگر در صف تایید نیست — وضعیت فعلی آن «${liveStatusOf(e, focus)}» است.`,
            `${focus.id} is not in the approval queue anymore — its current status is ${liveStatusOf(e, focus)}.`,
          ),
          detail.text,
        ),
        actions: detail.actions,
        focus: focusOf(focus),
      }
    }
    const detail = explainRecord(e, focus, 'status')
    return {
      text: compose(
        e.s(
          `آماده تایید ${focus.id} هستم — پیش از زدن دکمه، این نکات را ببینید.`,
          `Ready to approve ${focus.id} — check these points before you confirm.`,
        ),
        detail.text,
      ),
      actions: detail.actions,
      focus: focusOf(focus),
    }
  }
  if (candidates.length === 1) {
    const only = candidates[0]
    const kind: 'purchase' | 'transaction' = e.input.state.purchases.some((p) => p.id === only.id) ? 'purchase' : 'transaction'
    const record = recordFor(e, kind, only.id)
    if (record) return answerApprove(e, record)
  }
  if (candidates.length > 1) {
    return {
      text: e.s(
        `کدام‌یک را تایید کنم؟ ${joinList(e, candidates.map((c) => c.id))} همگی منتظر تصمیم شما هستند.`,
        `Which one should I approve? ${joinList(e, candidates.map((c) => c.id))} are all waiting on your decision.`,
      ),
      actions: candidates.slice(0, 3).map((c) =>
        openAction(e, { kind: e.input.state.purchases.some((p) => p.id === c.id) ? 'purchase' : 'transaction', id: c.id, label: c.id, strong: [], weak: [] }),
      ),
      focus: null,
    }
  }
  return answerPending(e)
}

function answerFollowUp(e: Engine, focus: AskRecord | null): Explained & { focus: AskFocus | null } {
  const label = focus?.label || e.input.context?.label || ''
  return {
    text: compose(
      focus
        ? e.s(
            `یک کار پیگیری برای ${focus.id} «${label}» می‌سازم و در کارتابل ثبت می‌شود.`,
            `I will open a follow-up work item for ${focus.id} “${label}” and file it in the work queue.`,
          )
        : e.s(
            `یک کار پیگیری برای موضوع فعلی می‌سازم و در کارتابل ثبت می‌شود.`,
            `I will open a follow-up work item for the current topic and file it in the work queue.`,
          ),
      e.s(
        `کار در مرحله «${e.stage('پیشنهاد')}» ایجاد می‌شود تا مالک و مهلت را خودتان تعیین کنید.`,
        `It is created at the ${e.stage('پیشنهاد')} stage so you can set the owner and the due date.`,
      ),
      e.s(`برای ساخت، دکمه زیر را بزنید.`, `Use the button below to create it.`),
    ),
    actions: [followUpAction(e, focus), { label: e.input.t('today.workQueue'), to: '/work', run: 'open' }],
    focus: focus ? focusOf(focus) : null,
  }
}

function answerOpen(e: Engine, focus: AskRecord | null): Explained & { focus: AskFocus | null } {
  if (!focus) {
    return {
      text: e.s(
        `کدام رکورد را باز کنم؟ یک شناسه بدهید یا از موارد باز شروع کنیم.`,
        `Which record should I open? Give me an ID, or start from the open items.`,
      ),
      actions: [{ label: e.input.t('today.workQueue'), to: '/work', run: 'open' }],
      focus: null,
    }
  }
  return {
    text: e.s(
      `${focus.id} «${focus.label}» را باز می‌کنم — وضعیت فعلی «${liveStatusOf(e, focus)}».`,
      `Opening ${focus.id} “${focus.label}” — current status ${liveStatusOf(e, focus)}.`,
    ),
    actions: [openAction(e, focus)],
    focus: focusOf(focus),
  }
}

function answerAmbiguous(e: Engine, options: AskRecord[]): Explained & { focus: AskFocus | null } {
  const ids = options.slice(0, 4).map((o) => o.id)
  return {
    text: e.s(
      `منظورتان ${joinList(e, ids, 'or')} است؟ بگویید کدام‌یک تا دقیق پاسخ بدهم.`,
      `Do you mean ${joinList(e, ids, 'or')}? Tell me which one and I will answer precisely.`,
    ),
    actions: options.slice(0, 4).map((o) => openAction(e, o)),
    focus: null,
  }
}

/* ------------------------------------------------------------------ */
/* Intent detection                                                    */
/* ------------------------------------------------------------------ */

function detectIntent(e: Engine, hasExplicitId: boolean, hasPronoun: boolean): Intent {
  const q = e.q
  if (hasAny(q, WORDS.followUp)) return 'follow-up'
  if (hasAny(q, WORDS.approve) && !hasAny(q, WORDS.list)) return 'approve'
  if (hasAny(q, WORDS.blocked)) return 'why'
  if (hasAny(q, WORDS.why)) return 'why'
  if (hasAny(q, WORDS.next)) return 'next'
  if (hasAny(q, WORDS.open) && (hasExplicitId || hasPronoun)) return 'open'
  if (hasAny(q, WORDS.visual)) return 'visual'
  if (hasAny(q, WORDS.pending)) return 'pending'
  if (hasAny(q, WORDS.inventory)) return 'inventory'
  if (hasAny(q, WORDS.work)) return 'work'
  if (hasAny(q, WORDS.sales)) return 'sales'
  if (hasAny(q, WORDS.changed)) return 'changed'
  if (hasAny(q, WORDS.plan)) return 'plan'
  if (hasAny(q, WORDS.attention)) return 'attention'
  if (hasAny(q, WORDS.mapNode)) return 'map-node'
  if (hasAny(q, WORDS.evidence)) return 'evidence'
  if (hasAny(q, WORDS.decisions)) return 'decisions'
  if (hasAny(q, WORDS.agent)) return 'agent'
  if (hasAny(q, WORDS.summary)) return 'summary'
  if (hasAny(q, WORDS.explain)) return 'explain'
  return 'explain'
}

function pageIntent(pathname: string): Intent {
  if (pathname.startsWith('/plan')) return 'plan'
  if (pathname.startsWith('/work')) return 'work'
  if (pathname.startsWith('/map')) return 'map-node'
  if (pathname.startsWith('/agents')) return 'agent'
  if (pathname.startsWith('/communication')) return 'decisions'
  if (pathname.startsWith('/intelligence')) return 'evidence'
  if (pathname.startsWith('/records')) return 'explain'
  return 'attention'
}

/** "Why is this blocked?" with nothing in focus still has a subject: the topic asked about, or the page. */
function fallbackIntent(e: Engine): Intent {
  const q = e.q
  if (hasAny(q, WORDS.inventory)) return 'inventory'
  if (hasAny(q, WORDS.work)) return 'work'
  if (hasAny(q, WORDS.sales)) return 'sales'
  if (hasAny(q, WORDS.plan)) return 'plan'
  if (hasAny(q, WORDS.pending)) return 'pending'
  if (hasAny(q, WORDS.decisions)) return 'decisions'
  if (hasAny(q, WORDS.evidence)) return 'evidence'
  if (hasAny(q, WORDS.agent)) return 'agent'
  if (hasAny(q, WORDS.mapNode)) return 'map-node'
  const page = pageIntent(e.input.pathname)
  return page === 'explain' ? 'attention' : page
}

const SINGLE_FOCUS_INTENTS: Intent[] = ['why', 'next', 'open', 'approve', 'explain', 'follow-up']

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function answerForIntent(e: Engine, intent: Intent, focus: AskRecord | null): Explained & { focus?: AskFocus | null } {
  switch (intent) {
    case 'follow-up':
      return answerFollowUp(e, focus)
    case 'approve':
      return answerApprove(e, focus)
    case 'open':
      return answerOpen(e, focus)
    case 'why':
      return focus
        ? { ...explainRecord(e, focus, 'why'), focus: focusOf(focus) }
        : answerForIntent(e, fallbackIntent(e), null)
    case 'next':
      return focus
        ? { ...explainRecord(e, focus, 'next'), focus: focusOf(focus) }
        : answerForIntent(e, fallbackIntent(e), null)
    case 'visual':
      return answerVisual(e)
    case 'pending':
      return answerPending(e)
    case 'inventory':
      return focus && focus.kind === 'inventory'
        ? { ...explainInventory(e, focus.id, 'status'), focus: focusOf(focus) }
        : answerInventory(e)
    case 'work':
      return focus && focus.kind === 'work'
        ? { ...explainWork(e, focus.id, 'status'), focus: focusOf(focus) }
        : answerWork(e)
    case 'sales':
      return answerSales(e)
    case 'attention':
      return answerAttention(e, focus?.kind === 'unit' ? focus.id : undefined)
    case 'changed':
      return answerChanged(e)
    case 'map-node':
      return answerMapNode(e, focus)
    case 'agent':
      return answerAgentOverview(e, focus)
    case 'decisions':
      return answerDecisions(e)
    case 'evidence':
      return answerEvidence(e, focus)
    case 'plan':
      return focus && focus.kind === 'goal'
        ? { ...explainGoal(e, focus.id), focus: focusOf(focus) }
        : answerPlan(e)
    case 'summary':
      return answerSummary(e)
    default:
      return focus
        ? { ...explainRecord(e, focus, 'status'), focus: focusOf(focus) }
        : answerAttention(e)
  }
}

function scrubAskReply(reply: AskReply, input: AskInput): AskReply {
  const map = buildIdTitleMap(input.state, input.locale, input.loc)
  const scrub = (text: string) => scrubVisibleIds(text, map)
  return {
    ...reply,
    text: scrub(reply.text),
    actions: reply.actions?.map((a) => ({ ...a, label: scrub(a.label) })),
    focus: reply.focus
      ? {
          ...reply.focus,
          label: scrub(reply.focus.label) || (input.locale === 'en' ? 'Business record' : 'رکورد کسب‌وکار'),
        }
      : reply.focus,
  }
}

export function resolveAskSteve(input: AskInput): AskReply {
  const e = buildEngine(input)

  if (!input.question.trim()) {
    const fallback = answerAttention(e)
    return scrubAskReply(
      { text: fallback.text, actions: fallback.actions, rich: fallback.rich, focus: fallback.focus },
      input,
    )
  }

  const mentioned = recordsMentionedIn(e, input.question)
  const hasPronoun = hasAny(` ${e.q} `, WORDS.pronoun)
  let intent = detectIntent(e, mentioned.length > 0, hasPronoun)

  // Focus: explicit ID → page context → conversation memory.
  let focus: AskRecord | null = mentioned[0] || null
  if (!focus) focus = recordFor(e, input.context?.recordType, input.context?.recordId)
  if (!focus && input.lastFocus) focus = recordFor(e, input.lastFocus.recordType, input.lastFocus.recordId)
  if (!focus) {
    for (let i = input.history.length - 1; i >= 0; i -= 1) {
      const found = recordsMentionedIn(e, input.history[i].text)
      if (found.length) {
        focus = found[0]
        break
      }
    }
  }

  if (mentioned.length > 1 && SINGLE_FOCUS_INTENTS.includes(intent)) {
    const reply = answerAmbiguous(e, mentioned)
    return scrubAskReply({ text: reply.text, actions: reply.actions, focus: null }, input)
  }

  // A bare "explain" with nothing to explain becomes the page's natural question.
  if (intent === 'explain' && !focus) intent = pageIntent(input.pathname)

  const result = answerForIntent(e, intent, focus)

  return scrubAskReply(
    {
      text: result.text,
      actions: result.actions.length ? result.actions : undefined,
      rich: result.rich,
      focus: result.focus ?? (focus ? focusOf(focus) : null),
    },
    input,
  )
}

/* ------------------------------------------------------------------ */
/* Contextual prompts                                                  */
/* ------------------------------------------------------------------ */

export function askSteveDefaultPrompts(args: {
  pathname: string
  locale: 'fa' | 'en'
  state: DemoState
  context: AskContextInput
  openAlerts: AlertItem[]
}): string[] {
  const { pathname, locale, state, context, openAlerts } = args
  const fa = locale !== 'en'
  const s = (faText: string, enText: string) => (fa ? faText : enText)

  const recordMatch = pathname.match(/^\/records\/[^/]+\/([^/?#]+)/)
  const workMatch = pathname.match(/^\/work\/([^/?#]+)/)
  const focusId = recordMatch?.[1] || workMatch?.[1] || context?.recordId
  const idMap = buildIdTitleMap(state, locale)
  const titleOf = (id: string) => idMap.get(id) || (fa ? 'این مورد' : 'this item')

  if (focusId) {
    const title = titleOf(focusId)
    return [
      s(`چرا ${title} بلاک شده؟`, `Why is ${title} blocked?`),
      s(`مرحله بعدی ${title} چیست؟`, `What is the next step on ${title}?`),
      s(`اگر ${title} رد شود چه می‌شود؟`, `What happens if ${title} is rejected?`),
      s(`${title} به چه چیزی وصل است؟`, `What is ${title} linked to?`),
    ]
  }

  if (pathname.startsWith('/plan')) {
    const risky = state.goals.find((g) => g.risk)
    const riskyTitle = risky ? titleOf(risky.id) : ''
    return [
      s('کدام تعهد در خطر است؟', 'Which commitment is at risk?'),
      s('جهت کسب‌وکار الان چیست؟', 'What is our direction right now?'),
      risky
        ? s(`چرا هدف «${riskyTitle}» عقب افتاده؟`, `Why is goal “${riskyTitle}” behind?`)
        : s('کدام هدف کمترین پیشرفت را دارد؟', 'Which goal has the least progress?'),
      s('چه چیزی جلوی اهداف این ماه را گرفته؟', 'What is blocking this month’s goals?'),
    ]
  }

  if (pathname.startsWith('/work')) {
    return [
      s('کدام کار بلاک شده؟', 'Which work item is blocked?'),
      s('کدام کار بیشترین اولویت را دارد؟', 'Which work item is the highest priority?'),
      s('چه کاری منتظر تصمیم من است؟', 'Which work is waiting on my decision?'),
      s('مرحله بعدی کار پیشرو چیست؟', 'What is the next step on the leading item?'),
    ]
  }

  if (pathname.startsWith('/map')) {
    return [
      s('مالک این نود کیست؟', 'Who owns this node?'),
      s('چه چیزهایی به این واحد وابسته‌اند؟', 'What depends on this unit?'),
      s('کدام واحد بیشترین ریسک را دارد؟', 'Which unit carries the most risk?'),
      s('عامل این نود چه وضعیتی دارد؟', 'What is the agent on this node doing?'),
    ]
  }

  if (pathname.startsWith('/agents')) {
    return [
      s('این عامل الان روی چه چیزی تمرکز دارد؟', 'What is this agent focused on?'),
      s('تصمیم‌های باز این عامل چیست؟', 'What open decisions does this agent hold?'),
      s('کدام عامل نیازمند توجه است؟', 'Which agent needs attention?'),
      s('ریسک‌های باز این عامل را بگو', 'What open risks does this agent carry?'),
    ]
  }

  if (pathname.startsWith('/communication')) {
    return [
      s('کدام تصمیم هنوز حل نشده؟', 'Which decisions are still unresolved?'),
      s('کدام گفتگو منتظر پاسخ من است؟', 'Which conversation is waiting on me?'),
      s('چه کسی باید بعد پاسخ بدهد؟', 'Who needs to respond next?'),
      s('تصمیم باز پشت این گفتگو چیست؟', 'What open decision sits behind this thread?'),
    ]
  }

  if (pathname.startsWith('/intelligence')) {
    return [
      s('شواهد این تحلیل چیست؟', 'Explain the evidence behind this insight'),
      s('چقدر به این نتیجه مطمئنی و چرا؟', 'How confident are you, and why?'),
      s('کدام تحلیل بیشترین اثر را دارد؟', 'Which insight has the biggest impact?'),
      s('پیشنهاد اجرایی تو چیست؟', 'What action do you recommend?'),
    ]
  }

  const topAlert = [...openAlerts].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0]
  const pending = state.purchases.find((p) => p.status === 'pending') || state.transactions.find((tx) => tx.status === 'pending')
  return [
    s('امروز چه چیزی نیاز به توجه من دارد؟', 'What needs my attention today?'),
    s('از آخرین بازبینی چه تغییری کرده؟', 'What changed since my last review?'),
    pending
      ? s(`چرا ${titleOf(pending.id)} هنوز باز است؟`, `Why is ${titleOf(pending.id)} still open?`)
      : s('چه تصمیمی منتظر من است؟', 'Which decision is waiting on me?'),
    topAlert
      ? s('سه اقدام پیشنهادی امروز چیست؟', 'What are the three best actions right now?')
      : s('وضعیت کلی کسب‌وکار را خلاصه کن', 'Summarize the overall business state'),
  ]
}
