import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { PageHero } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { priorityTone } from '../lib/labels'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { toPersianDigits } from '../lib/format'
import { useLocale } from '../i18n/LocaleProvider'
import { getEnConfig } from '../i18n/enContent'
import { buildIdTitleMap } from '../domain/displayRecord'

const STAGES_FA = ['پیشنهاد', 'آماده‌سازی', 'مجاز', 'در حال اجرا', 'مشاهده', 'تایید شده', 'نتیجه', 'یادگیری', 'بسته'] as const

export function WorkPage() {
  const { state, dispatch, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, loc, tStage, tPriority } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const question = locale === 'en' ? enCfg.workQuestion || appConfig.workQuestion : appConfig.workQuestion
  const [selectedId, setSelectedId] = useState(state.workItems[0]?.id)
  const [queryUnit, setQueryUnit] = useState('all')
  const [q, setQ] = useState('')
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  const unitOptions = useMemo(() => {
    const ids = Array.from(new Set(state.workItems.map((w) => w.unitId)))
    return ids.map((id) => {
      const u = state.units.find((x) => x.id === id)
      return { id, label: u ? loc(u.name, 'units', u.id, 'name') : id }
    })
  }, [state.workItems, state.units, loc])

  const filtered = state.workItems.filter((w) => {
    const unitOk = queryUnit === 'all' || w.unitId === queryUnit
    const title = loc(w.title, 'workItems', w.id, 'title')
    const type = loc(w.type, 'workItems', w.id, 'type')
    const owner = loc(w.owner, 'workItems', w.id, 'owner')
    const textOk = !q || title.includes(q) || type.includes(q) || owner.includes(q) || w.title.includes(q)
    return unitOk && textOk
  })
  const selected = filtered.find((w) => w.id === selectedId) ?? filtered[0]

  return (
    <div className="steve-page space-y-5">
      <PageHero
        title={t('work.title')}
        subtitle={question}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('work.search')}
              className="h-9 rounded-[8px] border border-[var(--color-line)] bg-[var(--color-elevated)] px-3 text-[12px]"
            />
            <select
              value={queryUnit}
              onChange={(e) => setQueryUnit(e.target.value)}
              className="h-9 rounded-[8px] border border-[var(--color-line)] bg-[var(--color-elevated)] px-3 text-[12px]"
            >
              <option value="all">{t('work.all')}</option>
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-[8px] bg-[var(--color-green)] px-3.5 py-2 text-[12px] text-white"
              onClick={() => {
                dispatch({
                  type: 'CREATE_FOLLOWUP',
                  payload: {
                    title: t('work.newFromQueue'),
                    unitId: state.units[0]?.id || 'unit-holding',
                    fromRecordType: 'work',
                    fromRecordId: 'manual',
                    owner: state.units[0]?.owner || 'مدیر',
                  },
                })
              }}
            >
              {t('actions.addWork')}
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="steve-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px]">{t('work.active')}</div>
            <div className="text-[12px] text-[var(--color-ink-faint)]">{t('work.items', { count: d(filtered.length) })}</div>
          </div>
          <div className="max-h-[62vh] space-y-2 overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-3 text-start transition',
                  selected?.id === item.id ? 'border-[var(--color-green-border)] bg-[var(--color-green-dim)]' : 'border-[var(--color-line-soft)] hover:bg-[var(--color-elevated)]',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={priorityTone[item.priority]}>{loc(item.type, 'workItems', item.id, 'type')}</Badge>
                  <Badge tone={item.stage.includes('تایید') ? 'success' : 'warning'}>{tStage(item.stage)}</Badge>
                </div>
                <div className="mt-2 text-[13px]">{loc(item.title, 'workItems', item.id, 'title')}</div>
                <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
                  {loc(item.owner, 'workItems', item.id, 'owner')} • {item.updated}
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className="steve-surface p-5">
            <div className="text-[11px] tracking-wide text-[var(--color-gold)]">{loc(selected.type, 'workItems', selected.id, 'type')}</div>
            <h2 className="mt-1 text-[22px] font-light">{loc(selected.title, 'workItems', selected.id, 'title')}</h2>
            <div className="mt-2 text-[12px] text-[var(--color-ink-faint)]">
              {(() => {
                const u = state.units.find((x) => x.id === selected.unitId)
                return u ? loc(u.name, 'units', u.id, 'name') : selected.unitId
              })()}{' '}
              • {loc(selected.owner, 'workItems', selected.id, 'owner')}
            </div>
            <p className="mt-3 text-[13px] leading-7 text-[var(--color-ink-soft)]">{loc(selected.description, 'workItems', selected.id, 'description')}</p>

            <div className="mt-5">
              <div className="mb-2 text-[12px] text-[var(--color-green-bright)]">{t('work.executionPath')}</div>
              <div className="flex flex-wrap gap-2">
                {STAGES_FA.map((s, idx) => {
                  const current = STAGES_FA.indexOf(selected.stage as (typeof STAGES_FA)[number])
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={cn('rounded-md px-2.5 py-1 text-[10px]', idx <= current ? 'bg-[var(--color-green-dim)] text-[var(--color-green-bright)]' : 'bg-[var(--color-elevated)] text-[var(--color-ink-faint)]')}>
                        {tStage(s)}
                      </div>
                      {idx < STAGES_FA.length - 1 ? <div className="h-px w-3 bg-[var(--color-line)]" /> : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="rounded-xl bg-[var(--color-green)] px-3 py-2 text-[12px] text-white" onClick={() => dispatch({ type: 'ADVANCE_WORK', id: selected.id })}>
                {t('work.advanceStage')}
              </button>
              {selected.recordType && selected.recordId ? (
                <button type="button" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-[12px]" onClick={() => navigate(recordPath(selected.recordType!, selected.recordId!))}>
                  {t('work.openRelated')}
                </button>
              ) : null}
              {selected.conversationId ? (
                <Link to={`/communication?thread=${selected.conversationId}`} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-[12px]">
                  {t('work.conversation')}
                </Link>
              ) : null}
              <Link to={`/work/${selected.id}`} className="rounded-xl border border-[var(--color-gold)] px-3 py-2 text-[12px] text-[var(--color-gold)]">
                {t('work.fullDetails')}
              </Link>
            </div>

            <div className="mt-5 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3 border-b border-[var(--color-line-soft)] py-2">
                <span className="text-[var(--color-ink-faint)]">{t('work.priority')}</span>
                <span>{tPriority(selected.priority)}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-[var(--color-line-soft)] py-2">
                <span className="text-[var(--color-ink-faint)]">{t('work.links')}</span>
                <span className="text-end text-[12px]">
                  {(() => {
                    const idMap = buildIdTitleMap(state, locale === 'en' ? 'en' : 'fa', loc)
                    const labels = selected.linked
                      .map((x) => idMap.get(x))
                      .filter((label): label is string => Boolean(label))
                    return labels.length
                      ? labels.map((label, i) => (
                          <span key={`${label}-${i}`}>
                            {i > 0 ? ' · ' : ''}
                            {label}
                          </span>
                        ))
                      : '—'
                  })()}
                </span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export function WorkDetailPage() {
  const { id } = useParams()
  const { state, dispatch, recordPath } = useDemo()
  const { t } = useTranslation()
  const { isRtl, loc, tStage, tPriority } = useLocale()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  const item = state.workItems.find((w) => w.id === id)
  if (!item) {
    return (
      <div className="steve-surface p-6">
        {t('work.notFound')}
        <Link to="/work" className="mt-3 flex items-center gap-1 text-[var(--color-gold)]">
          <BackIcon size={14} /> {t('record.back')}
        </Link>
      </div>
    )
  }
  return (
    <div className="steve-page space-y-4">
      <Link to="/work" className="inline-flex items-center gap-1 text-[13px] text-[var(--color-gold)]">
        <BackIcon size={14} /> {t('work.backToWork')}
      </Link>
      <div className="steve-surface p-5">
        <h1 className="text-[28px] font-light">{loc(item.title, 'workItems', item.id, 'title')}</h1>
        <p className="mt-3 text-[13px] leading-7 text-[var(--color-ink-soft)]">{loc(item.description, 'workItems', item.id, 'description')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={priorityTone[item.priority]}>{tStage(item.stage)}</Badge>
          <Badge>{tPriority(item.priority)}</Badge>
          <button type="button" className="rounded-[8px] bg-[var(--color-green)] px-3 py-1.5 text-[12px] text-white" onClick={() => dispatch({ type: 'ADVANCE_WORK', id: item.id })}>
            {t('work.advanceStage')}
          </button>
          {item.recordType && item.recordId ? (
            <Link to={recordPath(item.recordType, item.recordId)} className="steve-action">
              {t('work.relatedRecord')}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
