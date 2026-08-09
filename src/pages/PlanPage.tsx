import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { PageHero, Segmented } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { toPersianDigits } from '../lib/format'
import { AlertTriangle, ChevronLeft, ChevronRight, Compass } from 'lucide-react'
import { useLocale } from '../i18n/LocaleProvider'
import { getEnConfig } from '../i18n/enContent'

export function PlanPage() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc, tStatus } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const brand = locale === 'en' ? enCfg.brandName || appConfig.brandName : appConfig.brandName
  const question = locale === 'en' ? enCfg.planQuestion || appConfig.planQuestion : appConfig.planQuestion
  const [view, setView] = useState('overview')
  const seasons = [t('plan.seasonCurrent'), t('plan.seasonNext'), t('plan.seasonYear')]
  const [season, setSeason] = useState(seasons[0])
  const [agenda, setAgenda] = useState('agenda')
  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  return (
    <div className="steve-page space-y-5">
      <PageHero
        title={t('plan.title')}
        subtitle={question}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'overview', label: t('plan.overview') },
                { id: 'calendar', label: t('plan.calendar') },
              ]}
            />
            <select value={season} onChange={(e) => setSeason(e.target.value)} className="rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] px-3 py-1.5 text-[12px]">
              {seasons.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-full border border-[var(--color-green-border)] px-3 py-1.5 text-[12px] text-[var(--color-green-bright)]"
              onClick={() => navigate('/work')}
            >
              {t('plan.addItem')}
            </button>
          </div>
        }
      />

      {view === 'overview' ? (
        <>
          <section className="steve-card-accent p-5 md:p-6">
            <div className="mb-3 flex items-center gap-2 text-[13px]">
              <Compass size={16} className="text-[var(--color-green-bright)]" />
              {t('plan.direction', { season })}
            </div>
            <p className="max-w-4xl text-[18px] leading-9 font-light">{t('plan.directionBody', { brand })}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="success">{t('status.approved')}</Badge>
              <Badge>{t('plan.directionVer')}</Badge>
              <Badge>{t('plan.goalsArch')}</Badge>
              <Badge>{t('plan.horizon')}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-[var(--color-ink-faint)]">
                {t('plan.stats', {
                  goals: d(state.goals.length),
                  initiatives: d(state.initiatives.length),
                  protected: d(2),
                })}
              </span>
              <button type="button" className="inline-flex items-center gap-1 text-[var(--color-gold)]" onClick={() => navigate('/map')}>
                {t('plan.viewOnMap')} <Chevron size={14} />
              </button>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="min-w-0 pt-1">
              <div className="mb-2 px-1 text-[14px]">{t('plan.activeGoals')}</div>
              {state.goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="flex w-full items-center gap-3 border-b border-[var(--color-line-soft)] px-1 py-3.5 text-start last:border-b-0"
                  onClick={() => navigate(g.workIds[0] ? `/work/${g.workIds[0]}` : '/work')}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-dim)] text-[11px] text-[var(--color-green-bright)]">{d(g.progress)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">{loc(g.title, 'goals', g.id, 'title')}</div>
                    <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
                      {t('plan.goalMeta', { owner: loc(g.owner, 'goals', g.id, 'owner'), target: loc(g.target, 'goals', g.id, 'target') })}
                      {g.risk ? t('plan.goalRisk', { risk: loc(g.risk, 'goals', g.id, 'risk') }) : ''}
                    </div>
                    <div className="mt-2 h-1 max-w-[180px] overflow-hidden rounded-full bg-[var(--color-elevated)]">
                      <div className={g.progress < 50 ? 'h-full bg-[var(--color-warning)]' : 'h-full bg-[var(--color-green)]'} style={{ width: `${Math.min(g.progress, 100)}%` }} />
                    </div>
                  </div>
                  <Badge tone={g.progress < 50 ? 'danger' : 'success'}>{tStatus(g.status) === g.status ? loc(g.status, 'goals', g.id, 'status') : tStatus(g.status)}</Badge>
                </button>
              ))}
            </section>

            <section className="steve-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[14px]">{t('plan.next30')}</div>
                <Segmented
                  value={agenda}
                  onChange={setAgenda}
                  options={[
                    { id: 'agenda', label: t('plan.agenda') },
                    { id: 'cal', label: t('plan.calView') },
                  ]}
                />
              </div>
              {agenda === 'agenda' ? (
                <div className="relative space-y-4">
                  <div className="absolute top-1 bottom-1 inset-inline-end-[7px] w-px bg-[var(--color-line)]" />
                  {state.calendarEvents.map((e) => (
                    <button key={e.id} type="button" className="relative flex w-full gap-3 pe-4 text-start" onClick={() => navigate(e.workId ? `/work/${e.workId}` : '/work')}>
                      <div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-green-bright)]" />
                      <div>
                        <div className="text-[12px] text-[var(--color-ink-faint)]">
                          {loc(e.date, 'calendarEvents', e.id, 'date')} · {e.time}
                        </div>
                        <div className="text-[13px]">{loc(e.title, 'calendarEvents', e.id, 'title')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {state.calendarEvents.map((e) => (
                    <div key={e.id} className="rounded-xl bg-[var(--color-elevated)] px-3 py-2 text-[12px]">
                      {loc(e.date, 'calendarEvents', e.id, 'date')} {e.time} — {loc(e.title, 'calendarEvents', e.id, 'title')}
                    </div>
                  ))}
                  <button type="button" className="text-[12px] text-[var(--color-gold)]" onClick={() => setView('calendar')}>
                    {t('plan.fullCalendar')}
                  </button>
                </div>
              )}
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#5a3d16] bg-[#2a1f10] px-3 py-2.5 text-[12px] text-[var(--color-gold-soft)]">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <button type="button" className="text-start" onClick={() => navigate('/work/work-wh-1')}>
                  {t('plan.capacityConflict')}
                </button>
              </div>
            </section>
          </div>

          <section className="steve-surface p-5">
            <div className="mb-3 text-[14px]">{t('plan.activeInitiatives')}</div>
            <div className="grid gap-3 md:grid-cols-2">
              {state.initiatives.map((i) => (
                <Link key={i.id} to={i.workIds[0] ? `/work/${i.workIds[0]}` : '/work'} className="rounded-xl border border-[var(--color-line-soft)] p-3 hover:border-[var(--color-green-border)]">
                  <div className="text-[13px]">{loc(i.title, 'initiatives', i.id, 'title')}</div>
                  <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">
                    {t('plan.initiativeMeta', { status: loc(i.status, 'initiatives', i.id, 'status'), goalId: i.goalId })}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="steve-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
            <div className="text-[14px]">{t('plan.execCalendar', { season })}</div>
            <button type="button" className="text-[12px] text-[var(--color-gold)]" onClick={() => setView('overview')}>
              {t('plan.backOverview')}
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-[var(--color-line-soft)] text-center text-[11px] text-[var(--color-ink-faint)]">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-e border-[var(--color-line-soft)] px-2 py-2 last:border-e-0">
                {t(`plan.weekday${i}`)}
              </div>
            ))}
          </div>
          <div className="grid min-h-[420px] grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2
              const inMonth = day >= 1 && day <= 31
              const events = day === 18 ? state.calendarEvents.filter((e) => e.date === 'امروز') : day === 19 ? state.calendarEvents.filter((e) => e.date === 'فردا') : []
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!inMonth}
                  className="min-h-[84px] border-b border-e border-[var(--color-line-soft)] p-2 text-start last:border-e-0 disabled:opacity-30"
                  onClick={() => events[0]?.workId && navigate(`/work/${events[0].workId}`)}
                >
                  {inMonth ? (
                    <>
                      <div className={day === 18 ? 'text-[12px] text-[var(--color-green-bright)]' : 'text-[12px] text-[var(--color-ink-faint)]'}>{d(day)}</div>
                      <div className="mt-1 space-y-1">
                        {events.map((e) => (
                          <div key={e.id} className="truncate rounded bg-[var(--color-green-dim)] px-1.5 py-0.5 text-[10px] text-[var(--color-green-bright)]">
                            {loc(e.title, 'calendarEvents', e.id, 'title')}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
