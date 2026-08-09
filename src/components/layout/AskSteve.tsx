import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Mic,
  Minimize2,
  Pin,
  Plus,
  Search,
  Send,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { appConfig } from '../../config'
import { useDemo } from '../../domain/store'
import { getEnConfig } from '../../i18n/enContent'
import { Ltr, useLocale } from '../../i18n/LocaleProvider'
import { cn } from '../../lib/utils'
import { useAskSteve, type AskContext } from './AskSteveContext'

type ChatMsg = {
  id: string
  role: 'user' | 'steve'
  text: string
  rich?: 'control-room' | 'approvals' | 'inventory'
  actions?: { label: string; to?: string; run?: () => void }[]
}

function buildThreads(locale: 'fa' | 'en') {
  const faList = (appConfig as { askDefaultPrompts?: string[] }).askDefaultPrompts || []
  const enList = (getEnConfig().askPrompts as string[] | undefined) || []
  const source = locale === 'en' ? (enList.length ? enList : faList) : (faList.length ? faList : enList)
  return source.slice(0, 5).map((seed, i) => ({
    id: `t${i + 1}`,
    title: seed.length > 42 ? `${seed.slice(0, 40)}…` : seed,
    seed,
  }))
}

const FA_PATH_PROMPTS = {
  map: ['مهم‌ترین ریسک این نود چیست؟', 'KPIهای این واحد را توضیح بده', 'کارهای باز را نشان بده', 'داشبورد عامل را باز کن'],
  agents: ['خلاصه وضعیت این عامل چیست؟', 'تاییدهای باز را لیست کن', 'ریسک‌های باز را بگو'],
  work: ['کدام کار اولویت بالاتری دارد؟', 'مرحله بعدی این کار چیست؟'],
  purchaseFallback: ['این درخواست چرا ایجاد شده؟', 'آیا موجودی واقعاً بحرانی است؟', 'هزینه را با خرید قبلی مقایسه کن', 'اگر رد شود چه تاخیری می‌افتد؟'],
  defaultFallback: [
    'امروز چه چیزی نیاز به توجه من دارد؟',
    'درخواست‌های منتظر تأیید را نشان بده',
    'وضعیت موجودی را بررسی کن',
    'سه اقدام پیشنهادی برای امروز چیست؟',
  ],
} as const

const EN_PATH_PROMPTS = {
  map: ['What is the top risk on this node?', 'Explain this unit’s KPIs', 'Show open work items', 'Open the agent dashboard'],
  agents: ['Summarize this agent’s status', 'List open approvals', 'What open risks remain?'],
  work: ['Which work item is highest priority?', 'What is the next stage for this work?'],
  purchaseFallback: [
    'Why was this request created?',
    'Is inventory actually critical?',
    'Compare cost with the previous purchase',
    'What delay if it is rejected?',
  ],
} as const

function hasAny(q: string, needles: string[]) {
  const lower = q.toLowerCase()
  return needles.some((n) => lower.includes(n.toLowerCase()))
}

function defaultPrompts(pathname: string, ctx: AskContext | null, locale: 'fa' | 'en'): string[] {
  if (locale === 'en' && ctx?.promptsEn?.length) return ctx.promptsEn
  if (locale !== 'en' && ctx?.prompts?.length) return ctx.prompts

  const enPrompts = (getEnConfig().askPrompts as string[] | undefined) || []
  const configured = (appConfig as { askDefaultPrompts?: string[] }).askDefaultPrompts

  if (pathname.startsWith('/records/purchase')) {
    if (locale === 'en') return enPrompts.slice(0, 4).length ? enPrompts.slice(0, 4) : [...EN_PATH_PROMPTS.purchaseFallback]
    return configured?.slice(0, 4) || [...FA_PATH_PROMPTS.purchaseFallback]
  }
  if (pathname.startsWith('/map')) {
    return locale === 'en' ? [...EN_PATH_PROMPTS.map] : [...FA_PATH_PROMPTS.map]
  }
  if (pathname.startsWith('/agents')) {
    return locale === 'en' ? [...EN_PATH_PROMPTS.agents] : [...FA_PATH_PROMPTS.agents]
  }
  if (pathname.startsWith('/work')) {
    return locale === 'en' ? [...EN_PATH_PROMPTS.work] : [...FA_PATH_PROMPTS.work]
  }
  if (locale === 'en') return enPrompts.length ? enPrompts : [...EN_PATH_PROMPTS.purchaseFallback]
  return configured || [...FA_PATH_PROMPTS.defaultFallback]
}

export function AskSteveRoot() {
  const { t } = useTranslation()
  const { locale, isRtl, loc, dir } = useLocale()
  const { mode, setMode, expand, collapse, focus, context, safeAreaPx } = useAskSteve()
  const { state, dispatch, recordPath, openAlerts } = useDemo()
  const navigate = useNavigate()
  const location = useLocation()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [thread, setThread] = useState('t1')
  const [threadQuery, setThreadQuery] = useState('')
  const [pinned, setPinned] = useState(false)

  const threads = useMemo(() => buildThreads(locale), [locale])
  const visibleThreads = threads.filter((th) => !threadQuery || th.title.toLowerCase().includes(threadQuery.toLowerCase()))

  const prompts = useMemo(() => defaultPrompts(location.pathname, context, locale), [location.pathname, context, locale])
  const open = mode !== 'collapsed'
  const enCfg = getEnConfig() as Record<string, string>
  const brandName = locale === 'en' ? enCfg.brandName || appConfig.brandName : appConfig.brandName
  const scopeLabel = locale === 'en' ? enCfg.scopeLabel || appConfig.scopeLabel : appConfig.scopeLabel
  const trendTitle = locale === 'en' ? enCfg.trendTitle || appConfig.trendTitle : appConfig.trendTitle
  const followUpOwner = locale === 'en' ? enCfg.userName || appConfig.user.name : appConfig.user.name

  useEffect(() => {
    document.documentElement.style.setProperty('--steve-ask-safe', `${safeAreaPx}px`)
  }, [safeAreaPx])

  useEffect(() => {
    if (!open) return
    setMessages([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ? 'o' : 'c', context?.label, location.pathname, locale])

  function answer(q: string): ChatMsg {
    if (hasAny(q, ['تصویر', 'پایش', 'دوربین', 'نمای', 'عکس', 'رسانه', 'visual', 'camera', 'monitoring', 'feed', 'photo', 'media'])) {
      const feed = state.visualFeeds?.[0]
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: feed
          ? t('ask.replyVisual', {
              title: loc(feed.title, 'visualFeeds', feed.id, 'title'),
              location: loc(feed.location, 'visualFeeds', feed.id, 'location'),
              time: feed.time,
            })
          : t('ask.replyNoVisual'),
        actions: [
          ...(feed?.recordType && feed.recordId
            ? [{ label: t('communication.openRecord'), to: recordPath(feed.recordType, feed.recordId) }]
            : []),
          { label: t('ask.openMonitoring'), to: '/agents?lane=cameras' },
          ...(feed ? [{ label: t('ask.viewFeed'), to: feed.unitId ? recordPath('unit', feed.unitId) : '/agents' }] : []),
        ],
      }
    }

    if (hasAny(q, ['اتاق کنترل', 'کنترل اجرایی', 'خلاصه', 'control room', 'executive', 'summary', 'summarize'])) {
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: t('ask.replyControlRoom'),
        rich: 'control-room',
        actions: [
          { label: t('ask.openFullDashboard'), to: '/agents' },
          { label: t('ask.approveId', { id: 'TX-442' }), to: recordPath('transaction', 'TX-442') },
        ],
      }
    }
    if (hasAny(q, ['موجودی', 'انبار', 'بحرانی', 'inventory', 'warehouse', 'stock', 'sku', 'reorder'])) {
      const inv = state.inventory.find((i) => i.status === 'danger') || state.inventory[0]
      const days = (inv.onHand / Math.max(inv.avgDailyUse, 0.1)).toFixed(1)
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: t('ask.replyInventory', {
          sku: inv.sku,
          onHand: inv.onHand,
          unit: inv.unit,
          avg: inv.avgDailyUse,
          days,
          pr: inv.purchaseRequestId || '',
        }),
        rich: 'inventory',
        actions: [
          { label: t('record.inventory'), to: recordPath('inventory', inv.id) },
          ...(inv.purchaseRequestId ? [{ label: t('ask.openRequest'), to: recordPath('purchase', inv.purchaseRequestId) }] : []),
        ],
      }
    }
    if (hasAny(q, ['توجه', 'مهم', 'ریسک', 'attention', 'important', 'risk', 'priority', 'needs me'])) {
      const top = openAlerts[0]
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: top
          ? t('ask.replyPriority', {
              title: loc(top.title, 'alerts', top.id, 'title'),
              summary: loc(top.summary, 'alerts', top.id, 'summary'),
            })
          : t('ask.replyNoCritical'),
        actions: top
          ? [{ label: t('actions.view'), to: recordPath(top.recordType, top.recordId) }]
          : [{ label: t('today.workQueue'), to: '/work' }],
      }
    }
    if (hasAny(q, ['فروش', 'جایگاه', 'sales', 'station', 'fuel', 'zabol'])) {
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: t('ask.replySales'),
        actions: [
          { label: t('ask.fuelUnit'), to: recordPath('unit', 'unit-fuel') },
          { label: t('nav.intelligence'), to: '/intelligence' },
        ],
      }
    }
    if (hasAny(q, ['تأیید', 'تایید', 'درخواست', 'approval', 'approve', 'request', 'purchase', 'pending'])) {
      const pending = state.purchases.filter((p) => p.status === 'pending')
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: pending.length
          ? t('ask.replyPending', { list: pending.map((p) => `${p.id} (${p.amountLabel})`).join(locale === 'en' ? ', ' : '، ') })
          : t('ask.replyNoPending'),
        rich: 'approvals',
        actions: pending[0]
          ? [
              { label: t('today.openId', { id: pending[0].id }), to: recordPath('purchase', pending[0].id) },
              {
                label: t('ask.approveId', { id: pending[0].id }),
                run: () => {
                  dispatch({ type: 'APPROVE_PURCHASE', id: pending[0].id })
                  collapse()
                  navigate(recordPath('purchase', pending[0].id))
                },
              },
            ]
          : [],
      }
    }
    if (hasAny(q, ['داشبورد', 'عامل', 'dashboard', 'agent'])) {
      const agentId = context?.recordId?.startsWith('agent') ? context.recordId : 'agent-wh'
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: t('ask.replyAgentDash'),
        actions: [{ label: t('actions.openAgent'), to: `/agents?agent=${agentId}` }],
      }
    }
    if (hasAny(q, ['پیگیری', 'ایجاد کار', 'follow up', 'follow-up', 'create task', 'create work'])) {
      const topic = context?.label || t('ask.currentTopic')
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: t('ask.replyFollowUp'),
        actions: [
          {
            label: t('ask.createFollowUp'),
            run: () => {
              dispatch({
                type: 'CREATE_FOLLOWUP',
                payload: {
                  title: t('ask.followUpTitle', { label: topic }),
                  unitId: 'unit-holding',
                  fromRecordType: context?.recordType || 'ask',
                  fromRecordId: context?.recordId || 'steve',
                  owner: followUpOwner,
                },
              })
              collapse()
              navigate('/work')
            },
          },
        ],
      }
    }
    if (hasAny(q, ['چرا', 'why']) && (context?.recordType === 'purchase' || hasAny(q, ['درخواست', 'request', 'purchase', 'pr-']))) {
      const pr = state.purchases.find((p) => p.id === (context?.recordId || 'PR-184')) || state.purchases[0]
      return {
        id: `s-${Date.now()}`,
        role: 'steve',
        text: pr
          ? t('ask.replyWhy', { id: pr.id, reason: loc(pr.reason, 'purchases', pr.id, 'reason') })
          : t('ask.notFound'),
        actions: pr ? [{ label: t('today.openId', { id: pr.id }), to: recordPath('purchase', pr.id) }] : [],
      }
    }
    return {
      id: `s-${Date.now()}`,
      role: 'steve',
      text: t('ask.fallback'),
      actions: prompts.slice(0, 2).map((p) => ({ label: p.slice(0, 28), run: () => send(p) })),
    }
  }

  function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q) return
    if (mode === 'collapsed') expand()
    const reply = answer(q)
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: q }, reply])
    setInput('')
  }

  function runAction(a: { label: string; to?: string; run?: () => void }) {
    if (a.run) a.run()
    else if (a.to) {
      collapse()
      navigate(a.to)
    }
  }

  const panelHeightPx = mode === 'focused' ? Math.min(Math.round(window.innerHeight * 0.82), 780) : Math.min(Math.round(window.innerHeight * 0.58), 580)
  const chevronFlip = cn(!isRtl && 'scale-x-[-1]')

  return (
    <div
      className="ask-steve-root pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 md:px-8"
      style={{ paddingBottom: 12 }}
      dir={dir}
    >
      <div className={cn('pointer-events-auto flex w-full flex-col items-stretch', open && 'ask-steve-shell-open')} style={{ maxWidth: 'min(1080px, 100%)' }}>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.section
              key="ask-panel"
              initial={{ height: 0, opacity: 0.9 }}
              animate={{ height: panelHeightPx, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="ask-steve-panel flex min-h-0 flex-col overflow-hidden text-start"
              style={{ height: panelHeightPx }}
            >
              <div className="flex min-h-0 flex-1">
                <aside className="hidden w-[220px] shrink-0 flex-col border-e border-[var(--color-steve-border)] bg-[#141310] sm:flex">
                  <div className="flex items-center justify-between gap-2 px-3 py-3">
                    <div className="text-[13px] text-[var(--color-steve-text)]">{t('shell.askSteve')}</div>
                    <button type="button" className="inline-flex items-center gap-1 text-[11px] text-[var(--color-steve-green-bright)]" onClick={() => setMessages([])}>
                      <Plus size={12} /> {t('actions.newChat')}
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
                    {visibleThreads.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          setThread(th.id)
                          setMessages([])
                          if (th.seed) send(th.seed)
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[12px]',
                          thread === th.id ? 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-text)]' : 'text-[var(--color-steve-text-muted)] hover:bg-[var(--color-steve-elevated)]',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', thread === th.id ? 'bg-[var(--color-steve-green-bright)]' : 'bg-[#3a3832]')} />
                        <span className="truncate">{th.title}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[var(--color-steve-border)] p-2">
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--color-steve-border)] bg-[var(--color-steve-page)] px-2.5 py-2 text-[11px] text-[var(--color-steve-text-faint)]">
                      <Search size={12} />
                      <input
                        value={threadQuery}
                        onChange={(e) => setThreadQuery(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-start text-[11px] outline-none placeholder:text-[var(--color-steve-text-faint)]"
                        placeholder={t('ask.searchThreads')}
                      />
                    </div>
                  </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                  <header className="flex items-center justify-between gap-3 border-b border-[var(--color-steve-border)] px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--color-steve-text)] sm:hidden">{t('shell.askSteve')}</div>
                      {context ? (
                        <div className="truncate text-[12px] text-[var(--color-steve-gold)]">
                          {t('ask.context')}: {context.label}
                          {context.kind ? ` · ${context.kind}` : ''}
                          {context.recordId ? (
                            <>
                              {' · '}
                              <Ltr>{context.recordId}</Ltr>
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-[12px] text-[var(--color-steve-text-faint)]">{scopeLabel}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {mode === 'expanded' ? (
                        <button type="button" className="rounded-lg px-2 py-1.5 text-[11px] text-[var(--color-steve-green-bright)]" onClick={focus}>
                          {t('actions.moreFocus')}
                        </button>
                      ) : (
                        <button type="button" className="rounded-lg p-1.5 text-[var(--color-steve-text-faint)] hover:bg-[var(--color-steve-elevated)]" onClick={() => setMode('expanded')} aria-label={t('actions.collapse')}>
                          <ChevronDown size={16} className={chevronFlip} />
                        </button>
                      )}
                      <button type="button" className="rounded-lg p-1.5 text-[var(--color-steve-text-faint)] hover:bg-[var(--color-steve-elevated)]" onClick={collapse} aria-label={t('actions.collapse')}>
                        <Minimize2 size={15} />
                      </button>
                      <button type="button" className="rounded-lg p-1.5 text-[var(--color-steve-text-faint)] hover:bg-[var(--color-steve-elevated)]" onClick={collapse} aria-label={t('actions.close')}>
                        <X size={16} />
                      </button>
                    </div>
                  </header>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {messages.length === 0 ? (
                      <EmptyPrompts prompts={prompts} onPick={send} />
                    ) : (
                      messages.map((m) => (
                        <div key={m.id} className={m.role === 'user' ? 'flex justify-start' : 'flex justify-end'}>
                          <div className={cn('max-w-[92%] space-y-3', m.role === 'user' ? 'w-auto' : 'w-full')}>
                            {m.role === 'user' ? (
                              <div className="rounded-2xl rounded-se-md bg-[var(--color-steve-green-dim)] px-3.5 py-2.5 text-[13px] leading-7">{m.text}</div>
                            ) : (
                              <>
                                <div className="text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{m.text}</div>
                                {m.rich === 'control-room' ? (
                                  <ControlRoomCard state={state} onAction={runAction} recordPath={recordPath} brandName={brandName} trendTitle={trendTitle} />
                                ) : null}
                                {m.rich === 'approvals' ? <ApprovalsCard state={state} onAction={runAction} recordPath={recordPath} /> : null}
                                {m.rich === 'inventory' ? <InventoryCard state={state} onAction={runAction} recordPath={recordPath} /> : null}
                                {m.actions?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {m.actions.map((a) => (
                                      <button key={a.label} type="button" onClick={() => runAction(a)} className="rounded-full border border-[var(--color-steve-brief-border)] px-3 py-1.5 text-[11px] text-[var(--color-steve-green-bright)]">
                                        {a.label}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-[var(--color-steve-border)] px-3 py-3">
                    {messages.length > 0 ? (
                      <div className="mb-1 flex gap-2 overflow-x-auto pb-1">
                        {prompts.map((p, i) => (
                          <button key={p} type="button" onClick={() => send(p)} className="ask-steve-prompt shrink-0">
                            <PromptIcon i={i} />
                            <span>{p}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-1 text-[11px] text-[var(--color-steve-text-faint)]">{t('ask.useBottom')}</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <div className="ask-steve-dock">
          <button type="button" className="ask-steve-dock-label" onClick={expand}>
            {t('shell.askSteve')}
          </button>
          <div className="ask-steve-dock-divider" />
          <input
            className="ask-steve-dock-input"
            placeholder={t('ask.placeholder')}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (mode === 'collapsed') expand()
            }}
            onFocus={expand}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
          />
          <div className="ask-steve-dock-actions">
            <button
              type="button"
              className="ask-steve-dock-icon"
              aria-label={t('ask.voiceUnavailable')}
              title={t('ask.voiceUnavailable')}
              onClick={() => {
                expand()
                setInput((v) => v || (locale === 'en' ? 'Summarize today’s status' : 'خلاصه وضعیت امروز را بگو'))
              }}
            >
              <Mic size={14} />
            </button>
            <button
              type="button"
              className="ask-steve-dock-icon"
              aria-label={t('actions.expand')}
              onClick={() => {
                if (mode === 'collapsed') expand()
                else if (mode === 'expanded') focus()
                else setMode('expanded')
              }}
            >
              <ArrowUpRight size={14} className={chevronFlip} />
            </button>
            <button
              type="button"
              className={cn('ask-steve-dock-icon', pinned && 'text-[var(--color-steve-green-bright)]')}
              aria-label={t('ask.pinPrompts')}
              title={pinned ? t('ask.pinned') : t('ask.pinPrompts')}
              onClick={() => {
                setPinned((p) => !p)
                expand()
              }}
            >
              <Pin size={14} />
            </button>
            {open ? (
              <button type="button" className="ask-steve-dock-icon" aria-label={t('actions.send')} onClick={() => send()} disabled={!input.trim()}>
                <Send size={13} className={chevronFlip} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyPrompts({ prompts, onPick }: { prompts: string[]; onPick: (p: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-[var(--color-steve-text-muted)]">{t('ask.suggestions')}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {prompts.map((p, i) => (
          <button key={p} type="button" onClick={() => onPick(p)} className="ask-steve-prompt justify-start text-start">
            <PromptIcon i={i} />
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PromptIcon({ i }: { i: number }) {
  const icons = [Shield, BarChart3, CheckCircle2, Users]
  const Icon = icons[i % icons.length]
  return <Icon size={14} className="shrink-0 text-[var(--color-steve-green-bright)]" />
}

function ControlRoomCard({
  state,
  onAction,
  recordPath,
  brandName,
  trendTitle,
}: {
  state: ReturnType<typeof useDemo>['state']
  onAction: (a: { label: string; to?: string; run?: () => void }) => void
  recordPath: (t: string, id: string) => string
  brandName: string
  trendTitle: string
}) {
  const { t } = useTranslation()
  const { loc } = useLocale()
  const pendingPurchases = state.purchases.filter((p) => p.status === 'pending')
  const pendingTx = state.transactions.filter((tx) => tx.status === 'pending')
  const openRisk = state.alerts.filter((a) => a.status === 'open').length
  const primaryUnit = state.units.find((u) => u.id !== 'unit-holding') || state.units[0]
  const topTx = pendingTx[0]
  const topPr = pendingPurchases[0]
  const systems = Array.from(new Set(state.agents.flatMap((a) => a.systems))).slice(0, 3)
  return (
    <div className="ask-rich-card">
      <div className="text-[12px] tracking-wide text-[var(--color-steve-gold)]">{t('ask.controlRoomTitle', { brand: brandName })}</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric
          label={primaryUnit ? loc(primaryUnit.kpiLabel, 'units', primaryUnit.id, 'kpiLabel') : t('today.primaryUnit')}
          value={primaryUnit ? loc(primaryUnit.kpiValue, 'units', primaryUnit.id, 'kpiValue') : '—'}
          tone="good"
        />
        <Metric label={t('agents.needsAttention')} value={String(openRisk)} tone="bad" />
        <Metric label={t('today.pendingApprovals')} value={String(pendingPurchases.length + pendingTx.length)} tone="good" />
      </div>
      <div className="mt-3 h-16 rounded-lg border border-[var(--color-steve-border)] bg-[#12110e] px-3 py-2">
        <div className="text-[10px] text-[var(--color-steve-text-faint)]">{trendTitle}</div>
        <svg viewBox="0 0 200 40" className="mt-1 h-8 w-full">
          <polyline fill="none" stroke="#3ecf8e" strokeWidth="2" points="0,28 30,24 60,26 90,18 120,20 150,12 180,14 200,8" />
        </svg>
      </div>
      <div className="mt-3 text-[12px] text-[var(--color-steve-warning)]">
        {topTx ? t('ask.txPending', { id: topTx.id }) : topPr ? t('ask.prOpen', { id: topPr.id }) : t('ask.noOpenApprovals')}
        {topPr && topTx ? t('ask.alsoQueued', { id: topPr.id }) : ''}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl border border-[var(--color-steve-border)] px-3 py-2 text-[12px]" onClick={() => onAction({ label: t('ask.openFullDashboard'), to: '/agents' })}>
          {t('ask.openFullDashboard')}
        </button>
        {topTx ? (
          <button type="button" className="rounded-xl bg-[var(--color-steve-green)] px-3 py-2 text-[12px] text-white" onClick={() => onAction({ label: t('ask.approveId', { id: topTx.id }), to: recordPath('transaction', topTx.id) })}>
            {t('today.openId', { id: topTx.id })}
          </button>
        ) : topPr ? (
          <button type="button" className="rounded-xl bg-[var(--color-steve-green)] px-3 py-2 text-[12px] text-white" onClick={() => onAction({ label: t('today.openId', { id: topPr.id }), to: recordPath('purchase', topPr.id) })}>
            {t('ask.openRequest')}
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[t('ask.confidenceHigh'), ...systems, t('today.workQueue')].map((chip) => (
          <span key={chip} className="rounded-full border border-[var(--color-steve-border)] px-2 py-0.5 text-[10px] text-[var(--color-steve-text-faint)]">
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function ApprovalsCard({
  state,
  onAction,
  recordPath,
}: {
  state: ReturnType<typeof useDemo>['state']
  onAction: (a: { label: string; to?: string; run?: () => void }) => void
  recordPath: (t: string, id: string) => string
}) {
  const pending = state.purchases.filter((p) => p.status === 'pending')
  return (
    <div className="ask-rich-card space-y-2">
      {pending.map((p) => (
        <button key={p.id} type="button" className="flex w-full items-center justify-between rounded-xl border border-[var(--color-steve-border)] px-3 py-2.5 text-start" onClick={() => onAction({ label: p.id, to: recordPath('purchase', p.id) })}>
          <span className="text-[13px]">
            <Ltr>{p.id}</Ltr>
          </span>
          <span className="text-[12px] text-[var(--color-steve-gold)]">{p.amountLabel}</span>
        </button>
      ))}
    </div>
  )
}

function InventoryCard({
  state,
  onAction,
  recordPath,
}: {
  state: ReturnType<typeof useDemo>['state']
  onAction: (a: { label: string; to?: string; run?: () => void }) => void
  recordPath: (t: string, id: string) => string
}) {
  const { t } = useTranslation()
  const inv = state.inventory.find((i) => i.status === 'danger') || state.inventory[0]
  const days = (inv.onHand / Math.max(inv.avgDailyUse, 0.1)).toFixed(1)
  return (
    <div className="ask-rich-card">
      <div className="text-[13px]">
        <Ltr>{inv.sku}</Ltr>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <Metric label={t('record.onHand')} value={`${inv.onHand}`} />
        <Metric label={t('ask.dailyUse')} value={`${inv.avgDailyUse}`} />
        <Metric label={t('record.eta')} value={t('ask.daysLeft', { days })} tone="bad" />
      </div>
      {inv.purchaseRequestId ? (
        <button type="button" className="mt-3 rounded-xl bg-[var(--color-steve-green)] px-3 py-2 text-[12px] text-white" onClick={() => onAction({ label: 'PR', to: recordPath('purchase', inv.purchaseRequestId!) })}>
          {t('today.openId', { id: inv.purchaseRequestId })}
        </button>
      ) : null}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-lg border border-[var(--color-steve-border)] bg-[#12110e] px-2.5 py-2">
      <div className="text-[10px] text-[var(--color-steve-text-faint)]">{label}</div>
      <div className={cn('mt-1 text-[13px]', tone === 'good' && 'text-[var(--color-steve-green-bright)]', tone === 'bad' && 'text-[var(--color-steve-danger)]')}>{value}</div>
    </div>
  )
}
