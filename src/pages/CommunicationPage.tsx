import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { SearchField } from '../components/ui/SearchField'
import { PageHero } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { toPersianDigits } from '../lib/format'
import { ChevronLeft, ChevronRight, Paperclip, Send } from 'lucide-react'
import { cn } from '../lib/utils'
import { Ltr, useLocale } from '../i18n/LocaleProvider'
import { scrubWithState } from '../domain/displayRecord'
import { getEnConfig } from '../i18n/enContent'

export function CommunicationPage() {
  const { state, dispatch, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const question = locale === 'en' ? enCfg.communicationQuestion || appConfig.communicationQuestion : appConfig.communicationQuestion
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(params.get('thread') || state.threads[0]?.id)
  const [draft, setDraft] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  useEffect(() => {
    const thread = params.get('thread')
    if (thread) setActiveId(thread)
  }, [params])

  useEffect(() => {
    if (activeId) dispatch({ type: 'MARK_THREAD_READ', threadId: activeId })
  }, [activeId, dispatch])

  const filtered = useMemo(
    () =>
      state.threads.filter((th) => {
        if (!query) return true
        const title = loc(th.title, 'threads', th.id, 'title')
        const preview = loc(th.preview, 'threads', th.id, 'preview')
        const channel = loc(th.channel, 'threads', th.id, 'channel')
        return title.includes(query) || preview.includes(query) || channel.includes(query) || th.title.includes(query)
      }),
    [query, state.threads, loc],
  )
  const active = state.threads.find((th) => th.id === activeId) ?? filtered[0]
  const unread = state.threads.reduce((n, th) => n + th.unread, 0)

  return (
    <div className="steve-page space-y-4">
      <PageHero
        title={t('communication.title')}
        subtitle={question}
        actions={
          <button type="button" className="steve-action is-primary" onClick={() => setComposerOpen(true)}>
            + {t('actions.newChat')}
          </button>
        }
      />

      {composerOpen ? (
        <div className="steve-surface flex flex-wrap items-end gap-2 p-4">
          <div className="min-w-[220px] flex-1">
            <div className="mb-1 text-[11px] text-[var(--color-steve-text-faint)]">{t('communication.threadTitle')}</div>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-10 w-full rounded-xl border border-[var(--color-steve-border)] bg-[var(--color-steve-page)] px-3 text-[13px]" placeholder={t('communication.threadPlaceholder')} />
          </div>
          <button
            type="button"
            className="rounded-xl bg-[var(--color-steve-green)] px-4 py-2.5 text-[13px] text-white"
            onClick={() => {
              if (!newTitle.trim()) return
              dispatch({
                type: 'CREATE_FOLLOWUP',
                payload: {
                  title: t('communication.newChatWork', { title: newTitle.trim() }),
                  unitId: 'unit-holding',
                  fromRecordType: 'thread',
                  fromRecordId: 'new',
                  owner: 'مهندس امینی',
                },
              })
              setComposerOpen(false)
              setNewTitle('')
              navigate('/work')
            }}
          >
            {t('actions.createAndGo')}
          </button>
          <button type="button" className="rounded-xl border border-[var(--color-steve-border)] px-4 py-2.5 text-[13px]" onClick={() => setComposerOpen(false)}>
            {t('actions.cancel')}
          </button>
        </div>
      ) : null}

      <div className="grid gap-0 overflow-hidden rounded-[14px] border border-[var(--color-steve-border)] lg:grid-cols-[320px_1fr]">
        <section className="border-e border-[var(--color-steve-border)] bg-[var(--color-steve-surface)]">
          <div className="border-b border-[var(--color-steve-border)] px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="text-[14px]">{t('communication.threads')}</div>
              <span className="text-[12px] text-[var(--color-steve-gold)]">{t('communication.unread', { count: d(unread) })}</span>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder={t('communication.search')} />
          </div>
          <div className="max-h-[62vh] overflow-y-auto">
            {filtered.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setActiveId(th.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-[var(--color-steve-border-soft)] px-4 py-3.5 text-start transition',
                  active?.id === th.id ? 'bg-[var(--color-steve-green-dim)]' : 'hover:bg-[var(--color-steve-elevated)]',
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-steve-border)] text-[11px] text-[var(--color-steve-gold)]">
                  {loc(th.channel, 'threads', th.id, 'channel').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[13px]">{loc(th.title, 'threads', th.id, 'title')}</div>
                    {th.unread > 0 ? <span className="rounded-[8px] bg-[var(--color-steve-green)] px-1.5 text-[10px] text-white">{d(th.unread)}</span> : null}
                  </div>
                  <div className="mt-1 truncate text-[12px] text-[var(--color-steve-text-muted)]">{loc(th.preview, 'threads', th.id, 'preview')}</div>
                  <div className="mt-1 text-[11px] text-[var(--color-steve-text-faint)]">{th.updated}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex min-h-[70vh] flex-col bg-[var(--color-steve-page)]">
          {active ? (
            <>
              <div className="border-b border-[var(--color-steve-border)] px-5 py-4">
                <div className="text-[18px] font-light">{loc(active.title, 'threads', active.id, 'title')}</div>
                <div className="mt-1 text-[12px] text-[var(--color-steve-text-faint)]">
                  {t('communication.headerMeta', {
                    channel: loc(active.channel, 'threads', active.id, 'channel'),
                    count: d(active.participants.length),
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.relatedRecordType && active.relatedRecordId ? (
                    <Link to={recordPath(active.relatedRecordType, active.relatedRecordId)} className="steve-action is-primary">
                      {t('communication.openRecord')}
                    </Link>
                  ) : null}
                  {active.relatedWork ? (
                    <Link to={`/work/${active.relatedWork}`} className="steve-action">
                      {t('communication.openWork')}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="steve-action"
                    onClick={() => {
                      dispatch({ type: 'CREATE_TASK_FROM_THREAD', threadId: active.id })
                      navigate('/work')
                    }}
                  >
                    {t('communication.createFromThread')}
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {active.messages.map((m) => (
                  <div key={m.id} className={m.from.includes('امینی') ? 'flex justify-start' : 'flex justify-end'}>
                    <div className={cn('max-w-[78%] px-3.5 py-2.5', m.from.includes('امینی') ? 'rounded-2xl rounded-se-md bg-[var(--color-steve-green-dim)]' : 'rounded-2xl rounded-ss-md bg-[var(--color-steve-elevated)]')}>
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className={m.from.includes('عامل') || m.from.includes('استیو') ? 'text-[var(--color-steve-green-bright)]' : ''}>{m.from}</span>
                        <span className="text-[var(--color-steve-text-faint)]">{m.time}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{scrubWithState(m.body, state, locale === 'en' ? 'en' : 'fa', loc)}</p>
                      {m.imageSrc ? (
                        <button
                          type="button"
                          className="mt-2 block w-full overflow-hidden rounded-xl border border-[var(--color-steve-border)]"
                          onClick={() => (m.linkType && m.linkId ? navigate(recordPath(m.linkType, m.linkId)) : undefined)}
                        >
                          <img src={m.imageSrc} alt={m.imageCaption || t('communication.imageAlt')} className="aspect-[16/9] w-full object-cover" loading="lazy" />
                          {m.imageCaption ? <div className="px-2.5 py-1.5 text-[11px] text-[var(--color-steve-text-faint)]">{m.imageCaption}</div> : null}
                        </button>
                      ) : null}
                      {m.linkType && m.linkId ? (
                        <button type="button" className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--color-steve-gold)]" onClick={() => navigate(recordPath(m.linkType!, m.linkId!))}>
                          {scrubWithState(m.linkLabel || t('communication.viewLink'), state, locale === 'en' ? 'en' : 'fa', loc)} <Chevron size={12} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-steve-border)] px-4 py-3">
                <div className="flex items-center gap-2 rounded-md border border-[var(--color-steve-border)] bg-[var(--color-steve-surface)] px-2 py-1.5">
                  <button
                    type="button"
                    className="rounded-md p-2 text-[var(--color-steve-text-faint)]"
                    title={t('communication.attachHint')}
                    onClick={() => {
                      if (active.relatedRecordId) setDraft((prev) => `${prev} [پیوند:${active.relatedRecordId}]`.trim())
                    }}
                  >
                    <Paperclip size={15} />
                  </button>
                  <input
                    className="h-9 flex-1 bg-transparent px-2 text-[13px] outline-none"
                    placeholder={t('communication.write')}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && draft.trim()) {
                        dispatch({ type: 'SEND_MESSAGE', threadId: active.id, body: draft.trim() })
                        setDraft('')
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--color-steve-green)] text-white disabled:opacity-40"
                    disabled={!draft.trim()}
                    onClick={() => {
                      dispatch({ type: 'SEND_MESSAGE', threadId: active.id, body: draft.trim() })
                      setDraft('')
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  )
}
