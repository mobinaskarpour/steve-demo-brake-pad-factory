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

export function readPinned(agents: AgentProfile[]): string[] {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length) return parsed.filter((id) => agents.some((a) => a.id === id))
    }
  } catch {
    /* ignore */
  }
  return agents.filter((a) => a.pinDefault).map((a) => a.id)
}

export function writePinned(ids: string[]) {
  localStorage.setItem(PIN_KEY, JSON.stringify(ids))
}

export function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function pushRecent(id: string) {
  const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, 8)
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
