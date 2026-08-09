import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { deepEnsureEnglish } from '../i18n/ensureEnglish'
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
