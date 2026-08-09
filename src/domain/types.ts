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
  | { type: 'SHOW_TOAST'; text: string }
  | { type: 'CLEAR_TOAST' }
