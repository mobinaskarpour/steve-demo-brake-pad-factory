import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { PageHero, Segmented } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { toPersianDigits } from '../lib/format'
import { AlertTriangle, ChevronLeft, ChevronRight, Compass, X } from 'lucide-react'
import { useLocale } from '../i18n/LocaleProvider'
import { getEnConfig } from '../i18n/enContent'
import { cn } from '../lib/utils'

/** Planning calendar objects — commitments / milestones / reviews (not Work tasks) */
const PLAN_CALENDAR = [
  { day: 3, kind: 'program' as const, labelFa: 'برنامه تولید هفتگی لنت دیسکی', labelEn: 'Weekly disc-pad production program', span: 5 },
  { day: 5, kind: 'commitment' as const, labelFa: 'پنجره تایید تامین ماده اصطکاکی', labelEn: 'Friction material supply approval window' },
  { day: 8, kind: 'milestone' as const, labelFa: 'آزادسازی دستور تولید PROD-1148', labelEn: 'PROD-1148 production order release' },
  { day: 12, kind: 'review' as const, labelFa: 'کمیته ماهانه کیفیت', labelEn: 'Monthly quality committee' },
  { day: 18, kind: 'commitment' as const, labelFa: 'تحویل سفارش SO-3092 به قطعه‌گستر پارس', labelEn: 'SO-3092 delivery commitment' },
  { day: 20, kind: 'milestone' as const, labelFa: 'تعیین تکلیف بچ قرنطینه BATCH-2417', labelEn: 'BATCH-2417 quarantine disposition' },
  { day: 24, kind: 'review' as const, labelFa: 'ایست بازرسی ظرفیت پرس', labelEn: 'Press capacity checkpoint' },
  { day: 28, kind: 'commitment' as const, labelFa: 'تعهدات حقوق و اضافه‌کاری شیفت تولید', labelEn: 'Production shift payroll commitments' },
  { day: 31, kind: 'review' as const, labelFa: 'بازبینی هم‌راستایی کارخانه', labelEn: 'Plant alignment review' },
]

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
  const [directionOpen, setDirectionOpen] = useState(false)
  const [goalDetail, setGoalDetail] = useState<string | null>(null)
  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))
  const selectedGoal = state.goals.find((g) => g.id === goalDetail)
  const conflictWork = state.workItems.find((w) => w.id === 'work-maint-1') || state.workItems[0]

  const directionNarrative =
    locale === 'fa'
      ? `ساخت سکوی تولید پایدار برای ${brand} که رشد ظرفیت پرس، کیفیت لنت و تعهد تحویل سفارش‌ها را بدون تضعیف انضباط نقدینگی، پایداری تامین ماده اصطکاکی، یا کنترل کیفیت پیش ببرد. جهت بر اساس بازخورد خط تولید، نتیجه آزمون‌های کیفی و استثناهای تامین به‌روز می‌شود.`
      : `Build a durable manufacturing platform for ${brand} that grows press capacity, pad quality, and order delivery commitments without weakening cash discipline, friction-material supply stability, or quality control. Direction evolves from line feedback, QC test outcomes, and supply exceptions.`

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
            <p className="max-w-4xl text-[18px] leading-9 font-light">{directionNarrative}</p>
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
              <div className="flex flex-wrap gap-3">
                <button type="button" className="inline-flex items-center gap-1 text-[var(--color-gold)]" onClick={() => setDirectionOpen(true)}>
                  {t('plan.viewDirection')} <Chevron size={14} />
                </button>
                <button type="button" className="inline-flex items-center gap-1 text-[var(--color-gold)]" onClick={() => navigate('/map?tab=goals')}>
                  {t('plan.viewOnMap')} <Chevron size={14} />
                </button>
              </div>
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
                  onClick={() => setGoalDetail(g.id)}
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
                  {PLAN_CALENDAR.filter((e) => e.kind !== 'program').map((e) => (
                    <button key={e.day} type="button" className="relative flex w-full gap-3 pe-4 text-start" onClick={() => setView('calendar')}>
                      <div
                        className={cn(
                          'relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                          e.kind === 'review' ? 'bg-[var(--color-warning)]' : e.kind === 'milestone' ? 'bg-[var(--color-green-bright)]' : 'bg-[var(--color-steve-gold,#b89556)]',
                        )}
                      />
                      <div>
                        <div className="text-[12px] text-[var(--color-ink-faint)]">{locale === 'fa' ? `مرداد ${d(e.day)}` : `Aug ${e.day}`}</div>
                        <div className="text-[13px]">{locale === 'fa' ? e.labelFa : e.labelEn}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {PLAN_CALENDAR.filter((e) => e.kind !== 'program')
                    .slice(0, 5)
                    .map((e) => (
                      <div key={e.day} className="rounded-xl bg-[var(--color-elevated)] px-3 py-2 text-[12px]">
                        {locale === 'fa' ? `مرداد ${d(e.day)}` : `Aug ${e.day}`} — {locale === 'fa' ? e.labelFa : e.labelEn}
                      </div>
                    ))}
                  <button type="button" className="text-[12px] text-[var(--color-gold)]" onClick={() => setView('calendar')}>
                    {t('plan.fullCalendar')}
                  </button>
                </div>
              )}
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-[var(--notice-warning-border)] bg-[var(--notice-warning-bg)] px-3 py-2.5 text-[12px] text-[var(--color-gold-soft)]">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <button type="button" className="text-start" onClick={() => navigate(conflictWork ? `/work/${conflictWork.id}` : '/work')}>
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-3">
            <div className="text-[14px]">{t('plan.execCalendar', { season })}</div>
            <div className="flex flex-wrap gap-3 text-[11px] text-[var(--color-ink-faint)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-6 rounded-sm bg-[var(--color-green)]/70" /> {t('plan.legendPrograms')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-green-bright)]" /> {t('plan.legendMilestones')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rotate-45 bg-[var(--color-warning)]" /> {t('plan.legendReviews')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--color-steve-gold,#b89556)]" /> {t('plan.legendCommitments')}
              </span>
            </div>
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
              const events = PLAN_CALENDAR.filter((e) => e.kind !== 'program' && e.day === day)
              const programs = PLAN_CALENDAR.filter((e) => e.kind === 'program' && day >= e.day && day < e.day + (e.span || 1))
              return (
                <div
                  key={i}
                  className={cn('min-h-[84px] border-b border-e border-[var(--color-line-soft)] p-2 text-start last:border-e-0', !inMonth && 'opacity-30')}
                >
                  {inMonth ? (
                    <>
                      <div className={day === 18 ? 'text-[12px] text-[var(--color-green-bright)]' : 'text-[12px] text-[var(--color-ink-faint)]'}>{d(day)}</div>
                      <div className="mt-1 space-y-1">
                        {programs.map((p) => (
                          <div key={p.labelEn} className="truncate rounded-sm bg-[var(--color-green-dim)] px-1 py-0.5 text-[9px] text-[var(--color-green-bright)]">
                            {locale === 'fa' ? p.labelFa : p.labelEn}
                          </div>
                        ))}
                        {events.map((e) => (
                          <button
                            key={e.labelEn}
                            type="button"
                            className="block w-full truncate rounded bg-[var(--color-elevated)] px-1.5 py-0.5 text-start text-[10px] text-[var(--color-steve-text)]"
                            onClick={() => navigate('/plan')}
                          >
                            {locale === 'fa' ? e.labelFa : e.labelEn}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {directionOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[16px]">{t('plan.viewDirection')}</div>
              <button type="button" onClick={() => setDirectionOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="text-[14px] leading-7 text-[var(--color-steve-text-muted)]">{directionNarrative}</p>
            <div className="mt-4 space-y-2 text-[12px] text-[var(--color-steve-text-muted)]">
              <div>
                <span className="text-[var(--color-steve-gold)]">{t('plan.directionVer')}</span> · {t('status.approved')}
              </div>
              <div>{t('plan.directionEvolves')}</div>
              <div>
                {t('plan.stats', {
                  goals: d(state.goals.length),
                  initiatives: d(state.initiatives.length),
                  protected: d(2),
                })}
              </div>
            </div>
            <button type="button" className="mt-5 rounded-full border border-[var(--color-green-border)] px-4 py-2 text-[12px] text-[var(--color-green-bright)]" onClick={() => navigate('/map?tab=goals')}>
              {t('plan.viewOnMap')}
            </button>
          </div>
        </div>
      ) : null}

      {selectedGoal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[16px]">{t('plan.viewDetails')}</div>
              <button type="button" onClick={() => setGoalDetail(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="text-[15px]">{loc(selectedGoal.title, 'goals', selectedGoal.id, 'title')}</div>
            <div className="mt-3 space-y-2 text-[13px] text-[var(--color-steve-text-muted)]">
              <div>
                {t('plan.goalMeta', {
                  owner: loc(selectedGoal.owner, 'goals', selectedGoal.id, 'owner'),
                  target: loc(selectedGoal.target, 'goals', selectedGoal.id, 'target'),
                })}
              </div>
              {selectedGoal.risk ? <div className="text-[var(--color-warning)]">{loc(selectedGoal.risk, 'goals', selectedGoal.id, 'risk')}</div> : null}
              <div>
                {t('plan.progress')}: {d(selectedGoal.progress)}%
              </div>
            </div>
            <button
              type="button"
              className="mt-5 rounded-full border border-[var(--color-green-border)] px-4 py-2 text-[12px] text-[var(--color-green-bright)]"
              onClick={() => {
                setGoalDetail(null)
                navigate(selectedGoal.workIds[0] ? `/work/${selectedGoal.workIds[0]}` : '/work')
              }}
            >
              {t('today.viewWork')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
