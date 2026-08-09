import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { deepEnsureEnglish } from '../i18n/ensureEnglish'
import { nextProductionStage } from './agentDashboards'
import { initialState, withExpandedWork } from './seed'
import type { DemoAction, DemoState, WorkStage } from './types'

const stages: WorkStage[] = ['پیشنهاد', 'آماده‌سازی', 'مجاز', 'در حال اجرا', 'مشاهده', 'تایید شده', 'نتیجه', 'یادگیری', 'بسته']

function stamp() {
  return new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

function pushActivity(state: DemoState, text: string, unit?: string, recordType?: string, recordId?: string): DemoState {
  return {
    ...state,
    activityFeed: [
      { id: `act-${Date.now()}`, time: stamp(), text, unit, recordType, recordId },
      ...state.activityFeed,
    ],
    toast: text,
  }
}

function setWorkStage(state: DemoState, workId: string, stage: WorkStage, updated = stamp()): DemoState {
  return {
    ...state,
    workItems: state.workItems.map((w) => (w.id === workId ? { ...w, stage, updated } : w)),
  }
}

function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    case 'SHOW_TOAST':
      return { ...state, toast: action.text }

    case 'APPROVE_PURCHASE': {
      const pr = state.purchases.find((p) => p.id === action.id)
      if (!pr || pr.status !== 'pending') return state
      let next = {
        ...state,
        purchases: state.purchases.map((p) =>
          p.id === action.id
            ? {
                ...p,
                status: 'approved' as const,
                activity: [...p.activity, { id: `pra-${Date.now()}`, time: stamp(), text: 'درخواست توسط مدیرعامل تایید شد.' }],
              }
            : p,
        ),
        inventory: state.inventory.map((inv) =>
          inv.id === pr.itemId
            ? { ...inv, status: 'warning' as const, history: [{ date: 'امروز', delta: 0, note: 'خرید تایید شد — در انتظار ورود' }, ...inv.history] }
            : inv,
        ),
        alerts: state.alerts.map((a) =>
          a.recordId === pr.itemId || a.workId === pr.workId ? { ...a, status: 'resolved' as const, title: `${a.title} · تامین تایید شد` } : a,
        ),
      }
      next = setWorkStage(next, pr.workId, 'تایید شده')
      next = pushActivity(next, `درخواست ${pr.id} تایید شد.`, 'انبار', 'purchase', pr.id)
      // sync finance agent activity
      next = {
        ...next,
        agents: next.agents.map((ag) =>
          ag.id === 'agent-fin' || ag.id === 'agent-wh'
            ? {
                ...ag,
                activity: [{ id: `aa-${Date.now()}`, time: stamp(), text: `تایید ${pr.id}` }, ...ag.activity],
                status: ag.id === 'agent-wh' ? 'active' : ag.status,
              }
            : ag,
        ),
        threads: next.threads.map((t) =>
          t.relatedRecordId === pr.id
            ? {
                ...t,
                preview: `${pr.id} تایید شد.`,
                messages: [
                  ...t.messages,
                  { id: `m-${Date.now()}`, from: 'استیو', body: `وضعیت ${pr.id} به «تایید شده» تغییر کرد.`, time: stamp(), linkType: 'purchase', linkId: pr.id, linkLabel: 'مشاهده درخواست' },
                ],
              }
            : t,
        ),
      }
      return next
    }

    case 'REJECT_PURCHASE': {
      const pr = state.purchases.find((p) => p.id === action.id)
      if (!pr || pr.status !== 'pending') return state
      let next = {
        ...state,
        purchases: state.purchases.map((p) =>
          p.id === action.id
            ? {
                ...p,
                status: 'rejected' as const,
                activity: [...p.activity, { id: `pra-${Date.now()}`, time: stamp(), text: 'درخواست رد شد.' }],
              }
            : p,
        ),
      }
      next = setWorkStage(next, pr.workId, 'نتیجه')
      return pushActivity(next, `درخواست ${pr.id} رد شد.`, 'انبار', 'purchase', pr.id)
    }

    case 'APPROVE_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.id)
      if (!tx || tx.status !== 'pending') return state
      let next = {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, status: 'approved' as const } : t)),
        alerts: state.alerts.map((a) => (a.recordId === tx.id ? { ...a, status: 'resolved' as const } : a)),
      }
      if (tx.workId) next = setWorkStage(next, tx.workId, 'تایید شده')
      next = pushActivity(next, `تراکنش ${tx.id} تایید شد.`, 'مالی', 'transaction', tx.id)
      next = {
        ...next,
        agents: next.agents.map((ag) =>
          ag.id === 'agent-fin'
            ? { ...ag, activity: [{ id: `aa-${Date.now()}`, time: stamp(), text: `تایید ${tx.id}` }, ...ag.activity], status: 'active' }
            : ag,
        ),
      }
      return next
    }

    case 'REJECT_TRANSACTION': {
      const tx = state.transactions.find((t) => t.id === action.id)
      if (!tx || tx.status !== 'pending') return state
      let next = {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, status: 'rejected' as const } : t)),
      }
      if (tx.workId) next = setWorkStage(next, tx.workId, 'نتیجه')
      return pushActivity(next, `تراکنش ${tx.id} رد شد.`, 'مالی', 'transaction', tx.id)
    }

    case 'ACK_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.id ? { ...a, status: 'acknowledged' as const } : a)),
        toast: 'هشدار تایید مشاهده شد.',
      }

    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.id ? { ...a, status: 'resolved' as const } : a)),
        toast: 'هشدار بسته شد.',
      }

    case 'CREATE_FOLLOWUP': {
      const id = `work-follow-${Date.now()}`
      const item = {
        id,
        title: action.payload.title,
        type: 'پیگیری',
        stage: 'پیشنهاد' as WorkStage,
        owner: action.payload.owner,
        unitId: action.payload.unitId,
        priority: 'medium' as const,
        updated: stamp(),
        description: `ایجادشده از ${action.payload.fromRecordType}:${action.payload.fromRecordId}`,
        linked: [action.payload.fromRecordId],
        recordType: action.payload.fromRecordType,
        recordId: action.payload.fromRecordId,
      }
      let next = { ...state, workItems: [item, ...state.workItems] }
      next = pushActivity(next, `کار پیگیری «${item.title}» ایجاد شد.`, undefined, 'work', id)
      return next
    }

    case 'ADVANCE_WORK': {
      const w = state.workItems.find((x) => x.id === action.id)
      if (!w) return state
      const idx = stages.indexOf(w.stage)
      const nextStage = stages[Math.min(idx + 1, stages.length - 1)]
      return setWorkStage(
        pushActivity(state, `کار «${w.title}» به مرحله ${nextStage} منتقل شد.`, undefined, 'work', w.id),
        w.id,
        nextStage,
      )
    }

    case 'SEND_MESSAGE': {
      if (!action.body.trim()) return state
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                updated: stamp(),
                preview: action.body,
                messages: [...t.messages, { id: `m-${Date.now()}`, from: 'مهندس آرش آریا', body: action.body, time: stamp() }],
              }
            : t,
        ),
        toast: 'پیام ارسال شد.',
      }
    }

    case 'CREATE_TASK_FROM_THREAD': {
      const t = state.threads.find((x) => x.id === action.threadId)
      if (!t) return state
      return reducer(state, {
        type: 'CREATE_FOLLOWUP',
        payload: {
          title: `پیگیری گفتگو: ${t.title}`,
          unitId: 'unit-holding',
          fromRecordType: t.relatedRecordType || 'thread',
          fromRecordId: t.relatedRecordId || t.id,
          owner: 'مهندس آرش آریا',
        },
      })
    }

    case 'MARK_THREAD_READ':
      return {
        ...state,
        threads: state.threads.map((t) => (t.id === action.threadId ? { ...t, unread: 0 } : t)),
      }

    case 'CLOSE_CORRESPONDENCE': {
      const c = state.correspondence.find((x) => x.id === action.id)
      if (!c) return state
      let next = {
        ...state,
        correspondence: state.correspondence.map((x) =>
          x.id === action.id
            ? {
                ...x,
                status: 'closed' as const,
                history: [...x.history, { id: `ch-${Date.now()}`, time: stamp(), text: 'پاسخ ارسال و پرونده بسته شد (دمو).' }],
              }
            : x,
        ),
        alerts: state.alerts.map((a) => (a.recordId === c.id ? { ...a, status: 'resolved' as const } : a)),
      }
      next = setWorkStage(next, c.workId, 'تایید شده')
      return pushActivity(next, `مکاتبه ${c.number} بسته شد.`, 'مکاتبات', 'correspondence', c.id)
    }

    case 'CONFIRM_SETTLEMENT': {
      const s = state.settlements.find((x) => x.id === action.id)
      if (!s || (s.status !== 'pending_confirmation' && s.status !== 'submitted')) return state
      return pushActivity(
        {
          ...state,
          settlements: state.settlements.map((x) =>
            x.id === action.id
              ? { ...x, status: 'ready_for_settlement', confirmation: 'تایید مدیریت', completion: x.completion || 'تایید شد' }
              : x,
          ),
        },
        `تخصیص ${s.id} تایید و آماده تسویه شد.`,
        'مالی و تسویه',
        'work',
        s.workId || s.id,
      )
    }

    case 'MARK_SETTLEMENT_PAID': {
      const s = state.settlements.find((x) => x.id === action.id)
      if (!s) return state
      const pay = action.amount ?? s.outstandingAmount
      const paid = Math.min(s.approvedAmount, s.paidAmount + pay)
      const outstanding = Math.max(0, s.approvedAmount - paid)
      return pushActivity(
        {
          ...state,
          settlements: state.settlements.map((x) =>
            x.id === action.id
              ? {
                  ...x,
                  paidAmount: paid,
                  outstandingAmount: outstanding,
                  status: outstanding === 0 ? 'settled' : 'partially_settled',
                }
              : x,
          ),
        },
        `پرداخت ${s.id} ثبت شد — مانده ${outstanding} میلیون تومان.`,
        'مالی و تسویه',
        'work',
        s.workId || s.id,
      )
    }

    case 'ADVANCE_PRODUCTION_ORDER': {
      const o = state.productionOrders.find((x) => x.id === action.id)
      if (!o || o.stage === 'shipment') return state
      const stage = nextProductionStage(o.stage)
      let next = {
        ...state,
        productionOrders: state.productionOrders.map((x) =>
          x.id === action.id
            ? { ...x, stage, status: stage === 'shipment' || stage === 'finished_goods' ? ('success' as const) : x.status, blocker: stage === 'production' ? undefined : x.blocker }
            : x,
        ),
      }
      return pushActivity(next, `دستور تولید ${o.id} به مرحله «${stage}» منتقل شد.`, 'تولید', 'work', o.workId || o.id)
    }

    case 'RELEASE_PRODUCTION_HOLD': {
      const o = state.productionOrders.find((x) => x.id === action.id)
      if (!o || o.stage !== 'hold') return state
      const next = {
        ...state,
        productionOrders: state.productionOrders.map((x) => (x.id === action.id ? { ...x, stage: 'production' as const, status: 'warning' as const, blocker: undefined } : x)),
      }
      return pushActivity(next, `دستور تولید ${o.id} از Hold آزاد و به تولید بازگشت.`, 'تولید', 'work', o.workId || o.id)
    }

    case 'SET_BATCH_QC': {
      const b = state.productionBatches.find((x) => x.id === action.id)
      if (!b) return state
      let next: DemoState = {
        ...state,
        productionBatches: state.productionBatches.map((x) => (x.id === action.id ? { ...x, qcStatus: action.qcStatus } : x)),
      }
      if (action.qcStatus === 'passed' && b.productionOrderId) {
        next = {
          ...next,
          productionOrders: next.productionOrders.map((o) => (o.id === b.productionOrderId ? { ...o, stage: 'finished_goods', status: 'success' } : o)),
          inventory: next.inventory.map((inv) =>
            inv.id === 'inv-fg-8842'
              ? { ...inv, onHand: inv.onHand + b.quantity, history: [{ date: 'امروز', delta: b.quantity, note: `ترخیص QC بچ ${b.id}` }, ...inv.history] }
              : inv,
          ),
        }
      }
      if (action.qcStatus === 'quarantined' && b.productionOrderId) {
        next = {
          ...next,
          productionOrders: next.productionOrders.map((o) =>
            o.id === b.productionOrderId ? { ...o, stage: 'hold', status: 'danger', blocker: `بچ ${b.id} قرنطینه شد — منتظر بازآزمون` } : o,
          ),
        }
      }
      return pushActivity(next, `وضعیت کیفیت بچ ${b.id} به «${action.qcStatus}» تغییر کرد.`, 'کیفیت', 'work', b.workId || b.id)
    }

    case 'RECEIVE_INCOMING_SUPPLY': {
      const inv = state.inventory.find((x) => x.id === action.id)
      if (!inv || !inv.incomingQty) return state
      const next = {
        ...state,
        inventory: state.inventory.map((x) =>
          x.id === action.id
            ? {
                ...x,
                onHand: x.onHand + x.incomingQty!,
                incomingQty: 0,
                incomingEta: undefined,
                status: x.onHand + x.incomingQty! >= x.reorder ? ('success' as const) : ('warning' as const),
                history: [{ date: 'امروز', delta: x.incomingQty || 0, note: 'ورود کالای در راه ثبت شد' }, ...x.history],
              }
            : x,
        ),
        alerts: state.alerts.map((a) => (a.recordId === action.id ? { ...a, status: 'resolved' as const } : a)),
      }
      return pushActivity(next, `ورود موجودی ${inv.sku} ثبت شد.`, 'انبار', 'inventory', inv.id)
    }

    default:
      return state
  }
}

type Ctx = {
  state: DemoState
  dispatch: React.Dispatch<DemoAction>
  openAlerts: DemoState['alerts']
  recordPath: (type: string, id: string) => string
}

const DemoContext = createContext<Ctx | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => withExpandedWork(initialState))
  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      openAlerts: state.alerts.filter((a) => a.status === 'open'),
      recordPath: (type, id) => `/records/${type}/${id}`,
    }),
    [state],
  )
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  const { locale } = useLocale()
  const state = useMemo(() => {
    if (locale !== 'en') return ctx.state
    return deepEnsureEnglish(ctx.state)
  }, [ctx.state, locale])
  const openAlerts = useMemo(() => state.alerts.filter((a) => a.status === 'open'), [state.alerts])
  return useMemo(() => ({ ...ctx, state, openAlerts }), [ctx, state, openAlerts])
}

/** Pure reducer export for engine/state verification harnesses. */
export { reducer as demoReducer }
