import type { AgentProfile, DashboardKind, DemoState, ProductionStage } from './types'

export type DashboardSurface =
  | 'ops'
  | 'cameras-events'
  | 'settlement-table'
  | 'match-split'
  | 'pipeline'
  | 'matter-list'
  | 'case-workspace'
  | 'line-status'
  | 'material-deps'
  | 'stock-table'
  | 'request-fulfill'
  | 'commercial-pipeline'
  | 'contract-lifecycle'

export function dashboardKindOf(agent: AgentProfile): DashboardKind {
  return agent.dashboardKind || 'generic'
}

export function surfaceFor(kind: DashboardKind): DashboardSurface {
  switch (kind) {
    case 'inspection':
      return 'cameras-events'
    case 'settlement':
    case 'finance-settlement':
      return 'settlement-table'
    case 'crm':
      return 'match-split'
    case 'deals':
      return 'pipeline'
    case 'matters':
      return 'matter-list'
    case 'advisory':
      return 'case-workspace'
    case 'production':
    case 'line-control':
      return 'line-status'
    case 'supply':
    case 'procurement':
      return 'material-deps'
    case 'inventory':
      return 'stock-table'
    case 'customer-supply':
      return 'request-fulfill'
    case 'inquiries':
      return 'commercial-pipeline'
    case 'contracts':
      return 'contract-lifecycle'
    default:
      return 'ops'
  }
}

const PIN_KEY = 'steve.agentDashboards.pins'
const RECENT_KEY = 'steve.agentDashboards.recent'

/** Demo seed when local history is empty — never leave Pinned/Recent blank for presentation. */
const DEFAULT_RECENT_IDS = ['agent-fuel', 'agent-proc', 'agent-fin', 'agent-wh']

function pinDefaults(agents: AgentProfile[]): string[] {
  const pinned = agents.filter((a) => a.pinDefault).map((a) => a.id)
  return pinned.length ? pinned : agents.slice(0, 2).map((a) => a.id)
}

export function readPinned(agents: AgentProfile[]): string[] {
  const fallback = pinDefaults(agents)
  try {
    const raw = localStorage.getItem(PIN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length) {
        const valid = parsed.filter((id) => agents.some((a) => a.id === id))
        return valid.length ? valid : fallback
      }
    }
  } catch {
    /* ignore */
  }
  return fallback
}

export function writePinned(ids: string[]) {
  localStorage.setItem(PIN_KEY, JSON.stringify(ids))
}

export function readRecent(agents?: AgentProfile[]): string[] {
  const known = new Set((agents || []).map((a) => a.id))
  const seed = (agents ? DEFAULT_RECENT_IDS.filter((id) => known.has(id)) : DEFAULT_RECENT_IDS).slice(0, 4)
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed) || !parsed.length) return seed
    const valid = agents ? parsed.filter((id) => known.has(id)) : parsed
    return valid.length ? valid : seed
  } catch {
    return seed
  }
}

export function pushRecent(id: string, agents?: AgentProfile[]) {
  const next = [id, ...readRecent(agents).filter((x) => x !== id)].slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

const PRODUCTION_STAGE_ORDER: ProductionStage[] = ['planning', 'materials', 'production', 'qc', 'hold', 'finished_goods', 'shipment']

export function nextProductionStage(stage: ProductionStage): ProductionStage {
  const idx = PRODUCTION_STAGE_ORDER.indexOf(stage)
  if (idx < 0 || stage === 'hold') return 'production'
  return PRODUCTION_STAGE_ORDER[Math.min(idx + 1, PRODUCTION_STAGE_ORDER.length - 1)]
}

export function productionStageLabel(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    planning: ['برنامه‌ریزی', 'Planning'],
    materials: ['تامین مواد', 'Materials'],
    production: ['تولید', 'Production'],
    qc: ['کنترل کیفیت', 'QC'],
    hold: ['Hold / اصلاح', 'Hold / rework'],
    finished_goods: ['محصول نهایی', 'Finished goods'],
    shipment: ['ارسال', 'Shipment'],
  }
  const row = map[stage]
  return row ? (en ? row[1] : row[0]) : stage
}

export function qcStatusLabel(status: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    pending: ['در انتظار آزمون', 'Pending test'],
    passed: ['ترخیص‌شده', 'Passed'],
    failed: ['مردود', 'Failed'],
    quarantined: ['قرنطینه', 'Quarantined'],
  }
  const row = map[status]
  return row ? (en ? row[1] : row[0]) : status
}

export function settlementLabel(status: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    assigned: ['تخصیص‌شده', 'Assigned'],
    in_progress: ['در حال انجام', 'In progress'],
    submitted: ['ارسال‌شده', 'Submitted'],
    pending_confirmation: ['منتظر تایید', 'Pending confirmation'],
    confirmed: ['تاییدشده', 'Confirmed'],
    needs_rework: ['نیاز به اصلاح', 'Needs rework'],
    ready_for_settlement: ['آماده تسویه', 'Ready for settlement'],
    partially_settled: ['تسویه ناقص', 'Partially settled'],
    settled: ['تسویه‌شده', 'Settled'],
  }
  const row = map[status]
  return row ? (en ? row[1] : row[0]) : status
}

export function productionStats(state: DemoState) {
  const orders = state.productionOrders
  const open = orders.filter((o) => o.stage !== 'shipment')
  const onHold = orders.filter((o) => o.stage === 'hold')
  const inQc = orders.filter((o) => o.stage === 'qc')
  const atRisk = orders.filter((o) => o.status === 'danger' || o.status === 'warning')
  const quarantined = state.productionBatches.filter((b) => b.qcStatus === 'quarantined')
  return { open: open.length, onHold: onHold.length, inQc: inQc.length, atRisk: atRisk.length, quarantined: quarantined.length }
}

export function supplyStats(state: DemoState) {
  const shortages = state.inventory.filter((i) => i.status === 'danger' || i.status === 'warning')
  const critical = state.inventory.filter((i) => i.status === 'danger')
  const openPurchases = state.purchases.filter((p) => p.status === 'pending')
  const incoming = state.inventory.filter((i) => (i.incomingQty || 0) > 0)
  const affectedOrders = new Set(state.inventory.flatMap((i) => i.affectedOrderIds || []))
  return { shortages: shortages.length, critical: critical.length, openPurchases: openPurchases.length, incoming: incoming.length, affectedOrders: affectedOrders.size }
}

export function settlementStats(state: DemoState) {
  const open = state.settlements.filter((s) => s.status !== 'settled')
  const awaiting = state.settlements.filter((s) => s.status === 'pending_confirmation' || s.status === 'submitted')
  const ready = state.settlements.filter((s) => s.status === 'ready_for_settlement')
  const outstanding = state.settlements.reduce((n, s) => n + s.outstandingAmount, 0)
  return { open: open.length, awaiting: awaiting.length, ready: ready.length, outstanding }
}
