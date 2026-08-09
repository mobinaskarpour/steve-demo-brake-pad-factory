export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'resolved'
export type WorkStage =
  | 'پیشنهاد'
  | 'آماده‌سازی'
  | 'مجاز'
  | 'در حال اجرا'
  | 'مشاهده'
  | 'تایید شده'
  | 'نتیجه'
  | 'یادگیری'
  | 'بسته'

export interface ActivityEvent {
  id: string
  time: string
  text: string
  unit?: string
  recordId?: string
  recordType?: string
}

export interface BusinessUnit {
  id: string
  name: string
  kind: string
  owner: string
  agentId: string
  status: StatusTone
  kpiLabel: string
  kpiValue: string
  alert?: string
  summary: string
  imageSrc?: string
}

export interface InventoryItem {
  id: string
  sku: string
  warehouse: string
  onHand: number
  reorder: number
  unit: string
  avgDailyUse: number
  lastUpdate: string
  status: StatusTone
  purchaseRequestId?: string
  workId?: string
  alertId?: string
  history: { date: string; delta: number; note: string }[]
  imageSrc?: string
  /** Supply-dashboard fields: how much production needs vs what is inbound */
  requiredQty?: number
  incomingQty?: number
  incomingEta?: string
  supplier?: string
  /** Production orders blocked or slowed by a shortage of this material */
  affectedOrderIds?: string[]
}

export interface PurchaseRequest {
  id: string
  title: string
  status: ApprovalStatus
  unitId: string
  requester: string
  approver: string
  supplier: string
  amount: number
  amountLabel: string
  quantity: number
  itemId: string
  reason: string
  due: string
  workId: string
  conversationId?: string
  createdAt: string
  activity: ActivityEvent[]
}

export interface Transaction {
  id: string
  title: string
  amount: number
  amountLabel: string
  unitId: string
  category: string
  period: string
  status: ApprovalStatus
  evidence: string[]
  comparison: string
  approvalId?: string
  workId?: string
  agentId: string
}

export interface Employee {
  id: string
  name: string
  role: string
  unitId: string
  lateTodayMinutes?: number
  attendanceRate: number
  history: { date: string; status: string; note?: string }[]
  workId?: string
  alertId?: string
}

export interface Correspondence {
  id: string
  number: string
  title: string
  from: string
  to: string
  status: 'registered' | 'assigned' | 'awaiting_reply' | 'closed'
  deadline: string
  owner: string
  summary: string
  workId: string
  conversationId: string
  history: ActivityEvent[]
  demoNote: string
}

export interface AlertItem {
  id: string
  title: string
  summary: string
  unitId: string
  priority: Priority
  type: string
  time: string
  status: 'open' | 'resolved' | 'acknowledged'
  recordType: 'inventory' | 'purchase' | 'transaction' | 'employee' | 'correspondence' | 'work' | 'unit'
  recordId: string
  workId?: string
}

export interface Goal {
  id: string
  title: string
  owner: string
  progress: number
  target: string
  due: string
  status: string
  unitId: string
  initiativeIds: string[]
  workIds: string[]
  risk?: string
}

export interface Initiative {
  id: string
  title: string
  goalId: string
  status: string
  workIds: string[]
}

export interface WorkItem {
  id: string
  title: string
  type: string
  stage: WorkStage
  owner: string
  unitId: string
  priority: Priority
  updated: string
  description: string
  linked: string[]
  recordType?: string
  recordId?: string
  goalId?: string
  conversationId?: string
}

export interface Message {
  id: string
  from: string
  body: string
  time: string
  linkType?: string
  linkId?: string
  linkLabel?: string
  imageSrc?: string
  imageCaption?: string
}

export interface Thread {
  id: string
  title: string
  channel: string
  participants: string[]
  unread: number
  updated: string
  preview: string
  relatedWork?: string
  relatedRecordType?: string
  relatedRecordId?: string
  messages: Message[]
}

/** Operational Agent Dashboard responsibility — Steve shell stays the same; content packs differ. */
export type DashboardKind =
  | 'generic'
  | 'inspection'
  | 'settlement'
  | 'crm'
  | 'deals'
  | 'matters'
  | 'advisory'
  | 'production'
  | 'supply'
  | 'finance-settlement'
  | 'inventory'
  | 'customer-supply'
  | 'procurement'
  | 'line-control'
  | 'inquiries'
  | 'contracts'

export interface AgentProfile {
  id: string
  name: string
  role: string
  domain: string
  unitId: string
  status: 'active' | 'attention' | 'idle'
  mastery: number
  alignment: number
  summary: string
  kpis: { id: string; label: string; value: string; delta: number; hint: string }[]
  workIds: string[]
  riskIds: string[]
  decisionIds: string[]
  systems: string[]
  activity: ActivityEvent[]
  /** Named customer operational dashboard kind */
  dashboardKind?: DashboardKind
  /** Pin on Agent Dashboard hub by default */
  pinDefault?: boolean
}

/** Planning → Materials → Production → QC → Hold/Rework → Finished Goods → Shipment */
export type ProductionStage = 'planning' | 'materials' | 'production' | 'qc' | 'hold' | 'finished_goods' | 'shipment'

export interface ProductionOrder {
  id: string
  soId?: string
  itemSku: string
  quantity: number
  unit: string
  stage: ProductionStage
  press?: string
  batchIds: string[]
  dueDate: string
  status: StatusTone
  blocker?: string
  /** Inventory items whose shortage is holding this order back */
  materialBlockerIds?: string[]
  workId?: string
}

export interface ProductionBatch {
  id: string
  productionOrderId?: string
  press: string
  stage: string
  qcStatus: 'pending' | 'passed' | 'failed' | 'quarantined'
  qcRecordId?: string
  quantity: number
  unit: string
  startedAt: string
  note: string
  workId?: string
}

export type SettlementStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'pending_confirmation'
  | 'confirmed'
  | 'needs_rework'
  | 'ready_for_settlement'
  | 'partially_settled'
  | 'settled'

export interface SettlementAssignment {
  id: string
  agentName: string
  unitId: string
  unitLabel: string
  task: string
  assignedDate: string
  dueDate: string
  completion: string
  evidence: string
  confirmation: string
  approvedAmount: number
  paidAmount: number
  outstandingAmount: number
  status: SettlementStatus
  workId?: string
}

export interface MapNode {
  id: string
  label: string
  type: 'holding' | 'unit' | 'function' | 'agent' | 'system'
  parent?: string
  status?: StatusTone
  meta?: string
  unitId?: string
  agentId?: string
}

export interface Insight {
  id: string
  title: string
  category: string
  severity: StatusTone
  summary: string
  evidence: string[]
  recommendation: string
  period: string
  impact: string
  confidence: string
  recordType?: string
  recordId?: string
  workId?: string
}

export interface CalendarEvent {
  id: string
  title: string
  time: string
  date: string
  type: string
  workId?: string
  unitId?: string
}

export interface VisualFeed {
  id: string
  title: string
  location: string
  src: string
  status: 'live' | 'snapshot' | 'attention'
  time: string
  unitId?: string
  recordType?: string
  recordId?: string
  alertId?: string
}

export interface DemoState {
  brief: {
    dateLabel: string
    greeting: string
    paragraphs: string[]
    lines: { label: string; text: string }[]
  }
  units: BusinessUnit[]
  inventory: InventoryItem[]
  purchases: PurchaseRequest[]
  transactions: Transaction[]
  employees: Employee[]
  correspondence: Correspondence[]
  alerts: AlertItem[]
  goals: Goal[]
  initiatives: Initiative[]
  workItems: WorkItem[]
  threads: Thread[]
  agents: AgentProfile[]
  mapNodes: MapNode[]
  insights: Insight[]
  calendarEvents: CalendarEvent[]
  activityFeed: ActivityEvent[]
  fuelSeries: { day: string; benzine: number; gasoil: number }[]
  visualFeeds: VisualFeed[]
  productionOrders: ProductionOrder[]
  productionBatches: ProductionBatch[]
  settlements: SettlementAssignment[]
  toast?: string | null
}

export type DemoAction =
  | { type: 'APPROVE_PURCHASE'; id: string }
  | { type: 'REJECT_PURCHASE'; id: string }
  | { type: 'APPROVE_TRANSACTION'; id: string }
  | { type: 'REJECT_TRANSACTION'; id: string }
  | { type: 'ACK_ALERT'; id: string }
  | { type: 'RESOLVE_ALERT'; id: string }
  | { type: 'CREATE_FOLLOWUP'; payload: { title: string; unitId: string; fromRecordType: string; fromRecordId: string; owner: string } }
  | { type: 'ADVANCE_WORK'; id: string }
  | { type: 'SEND_MESSAGE'; threadId: string; body: string }
  | { type: 'CREATE_TASK_FROM_THREAD'; threadId: string }
  | { type: 'MARK_THREAD_READ'; threadId: string }
  | { type: 'CLOSE_CORRESPONDENCE'; id: string }
  | { type: 'CONFIRM_SETTLEMENT'; id: string }
  | { type: 'MARK_SETTLEMENT_PAID'; id: string; amount?: number }
  | { type: 'ADVANCE_PRODUCTION_ORDER'; id: string }
  | { type: 'RELEASE_PRODUCTION_HOLD'; id: string }
  | { type: 'SET_BATCH_QC'; id: string; qcStatus: ProductionBatch['qcStatus'] }
  | { type: 'RECEIVE_INCOMING_SUPPLY'; id: string }
  | { type: 'SHOW_TOAST'; text: string }
  | { type: 'CLEAR_TOAST' }
