import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDemo } from '../domain/store'
import { Badge } from '../components/ui/Badge'
import { PageHero, SoftTabs } from '../components/layout/PageChrome'
import { appConfig } from '../config'
import { toPersianDigits } from '../lib/format'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLocale } from '../i18n/LocaleProvider'
import { getEnConfig } from '../i18n/enContent'

export function IntelligencePage() {
  const { state, recordPath } = useDemo()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, isRtl, loc, tStatus } = useLocale()
  const enCfg = getEnConfig() as Record<string, string>
  const question = locale === 'en' ? enCfg.intelligenceQuestion || appConfig.intelligenceQuestion : appConfig.intelligenceQuestion
  const trendTitle = locale === 'en' && enCfg.trendTitle ? enCfg.trendTitle : t('intelligence.trendTitle')
  const evidenceTitle = t('intelligence.evidenceTitle')
  const evidenceSubtitle = t('intelligence.evidenceSubtitle')
  const chartPrimary = t('intelligence.chartPrimary')
  const chartSecondary = t('intelligence.chartSecondary')
  const [tab, setTab] = useState('decisions')
  const d = (v: string | number) => (locale === 'fa' ? toPersianDigits(v) : String(v))

  return (
    <div className="steve-page space-y-5">
      <PageHero title={t('intelligence.title')} subtitle={question} />
      <SoftTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'decisions', label: t('intelligence.decisionMap') },
          { id: 'knowledge', label: t('intelligence.knowledge') },
          { id: 'mastery', label: t('intelligence.mastery') },
        ]}
      />

      {tab === 'decisions' ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {state.insights.map((ins) => (
                <div key={ins.id} className="steve-surface p-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={ins.severity}>{loc(ins.category, 'insights', ins.id, 'category')}</Badge>
                    <Badge tone="warning">{t('intelligence.confidence', { value: loc(ins.confidence, 'insights', ins.id, 'confidence') })}</Badge>
                    <Badge>{loc(ins.period, 'insights', ins.id, 'period')}</Badge>
                  </div>
                  <h3 className="mt-3 text-[16px]">{loc(ins.title, 'insights', ins.id, 'title')}</h3>
                  <p className="mt-2 text-[13px] leading-7 text-[var(--color-steve-text-muted)]">{loc(ins.summary, 'insights', ins.id, 'summary')}</p>
                  <div className="mt-2 text-[12px] text-[var(--color-steve-gold)]">{t('intelligence.impact', { value: loc(ins.impact, 'insights', ins.id, 'impact') })}</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-[12px] text-[var(--color-steve-text-faint)]">{t('intelligence.whatChanged')}</div>
                      {ins.evidence.map((e) => (
                        <div key={e} className="rounded-xl bg-[var(--color-steve-elevated)] px-3 py-2 text-[12px] text-[var(--color-steve-text-muted)]">
                          {e}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[var(--color-steve-brief-border)] bg-[var(--color-steve-green-dim)] p-4">
                      <div className="text-[12px] text-[var(--color-steve-gold)]">{t('intelligence.steveSuggestion')}</div>
                      <p className="mt-2 text-[13px] leading-7">{loc(ins.recommendation, 'insights', ins.id, 'recommendation')}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ins.recordType && ins.recordId ? (
                          <button type="button" className="rounded-full border border-[var(--color-steve-brief-border)] px-3 py-1 text-[11px] text-[var(--color-steve-green-bright)]" onClick={() => navigate(recordPath(ins.recordType!, ins.recordId!))}>
                            {t('intelligence.viewEvidence')}
                          </button>
                        ) : null}
                        {ins.workId ? (
                          <Link to={`/work/${ins.workId}`} className="rounded-full border border-[var(--color-steve-border)] px-3 py-1 text-[11px]">
                            {t('intelligence.relatedWork')}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <section className="steve-surface p-5">
              <div className="mb-4 text-[14px]">{trendTitle}</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={state.fuelSeries}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                    <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 12, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--color-steve-border)', borderRadius: 12 }} formatter={(value) => [d(String(value)), '']} />
                    <Area type="monotone" dataKey="benzine" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} name={chartPrimary} />
                    <Area type="monotone" dataKey="gasoil" stroke="var(--chart-2)" fillOpacity={0} strokeWidth={2} name={chartSecondary} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <button
                type="button"
                className="mt-3 text-[12px] text-[var(--color-steve-gold)]"
                onClick={() => {
                  const u = state.units.find((x) => x.id !== 'unit-holding') || state.units[0]
                  if (u) navigate(recordPath('unit', u.id))
                }}
              >
                {t('intelligence.interpret', { name: chartPrimary })}
              </button>
            </section>
          </div>
        </div>
      ) : null}

      {tab === 'knowledge' ? (
        <div className="steve-surface overflow-hidden">
          <div className="border-b border-[var(--color-steve-border)] px-5 py-4">
            <div className="text-[14px]">{evidenceTitle}</div>
            <div className="mt-1 text-[12px] text-[var(--color-steve-text-faint)]">{evidenceSubtitle}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-steve-border)] text-[var(--color-steve-text-faint)]">
                  <th className="px-5 py-3 font-medium">{t('intelligence.sku')}</th>
                  <th className="px-5 py-3 font-medium">{t('intelligence.onHand')}</th>
                  <th className="px-5 py-3 font-medium">{t('intelligence.reorder')}</th>
                  <th className="px-5 py-3 font-medium">{t('intelligence.status')}</th>
                  <th className="px-5 py-3 font-medium">{t('intelligence.action')}</th>
                </tr>
              </thead>
              <tbody>
                {state.inventory.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-steve-border-soft)] hover:bg-[var(--color-steve-elevated)]">
                    <td className="px-5 py-3">
                      <button type="button" className="text-[var(--color-steve-text)]" onClick={() => navigate(recordPath('inventory', row.id))}>
                        {loc(row.sku, 'inventory', row.id, 'sku')}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      {d(row.onHand)} {loc(row.unit, 'inventory', row.id, 'unit')}
                    </td>
                    <td className="px-5 py-3">
                      {d(row.reorder)} {loc(row.unit, 'inventory', row.id, 'unit')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={row.status}>{tStatus(row.status)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <button type="button" className="text-[12px] text-[var(--color-steve-gold)]" onClick={() => navigate(recordPath('inventory', row.id))}>
                        {t('intelligence.details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'mastery' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {state.agents.slice(0, 6).map((a) => (
            <button key={a.id} type="button" className="steve-surface p-5 text-start" onClick={() => navigate(`/agents?agent=${a.id}`)}>
              <div className="text-[13px] text-[var(--color-steve-gold)]">{loc(a.name, 'agents', a.id, 'name')}</div>
              <div className="mt-3 text-[36px] font-light">{d(a.mastery)}%</div>
              <div className="mt-2 text-[12px] text-[var(--color-steve-text-faint)]">
                {t('intelligence.alignment', { rate: d(a.alignment), domain: loc(a.domain, 'agents', a.id, 'domain') })}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-steve-elevated)]">
                <div className="h-full bg-[var(--color-steve-green)]" style={{ width: `${a.mastery}%` }} />
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
