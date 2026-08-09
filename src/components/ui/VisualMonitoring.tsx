import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import type { VisualFeed } from '../../domain/types'
import { useLocale } from '../../i18n/LocaleProvider'

type Props = {
  feeds: VisualFeed[]
  title?: string
  subtitle?: string
  compact?: boolean
  showCount?: boolean
  onOpen?: (feed: VisualFeed) => void
  className?: string
}

export function VisualMonitoring({
  feeds,
  title,
  subtitle,
  compact = false,
  showCount = true,
  onOpen,
  className,
}: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { loc } = useLocale()
  if (!feeds.length) return null

  const heading = title ?? t('visual.title')
  const primary = feeds[0]
  const rest = feeds.slice(1, compact ? 3 : 4)

  function open(feed: VisualFeed) {
    if (onOpen) return onOpen(feed)
    if (feed.recordType && feed.recordId) {
      navigate(`/records/${feed.recordType}/${feed.recordId}`)
      return
    }
    if (feed.unitId) navigate(`/records/unit/${feed.unitId}`)
  }

  return (
    <section className={cn('steve-surface overflow-hidden', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--color-steve-border-soft)] px-4 py-3">
        <div>
          <div className="text-[14px] text-[var(--color-steve-text)]">{heading}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-steve-text-faint)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--color-steve-green-bright)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-steve-green-bright)]" />
              {t('visual.live')}
            </span>
            {subtitle ? <span>• {subtitle}</span> : null}
            {showCount ? <span>• {t('visual.showing', { count: feeds.length })}</span> : null}
          </div>
        </div>
      </div>

      {compact ? (
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {feeds.slice(0, 3).map((f) => (
            <FeedCard key={f.id} feed={f} onOpen={() => open(f)} tall={false} loc={loc} t={t} />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 p-3 md:grid-cols-2">
          <FeedCard feed={primary} onOpen={() => open(primary)} tall loc={loc} t={t} />
          <div className="grid gap-2">
            {rest.map((f) => (
              <FeedCard key={f.id} feed={f} onOpen={() => open(f)} tall={false} loc={loc} t={t} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function FeedCard({
  feed,
  onOpen,
  tall,
  loc,
  t,
}: {
  feed: VisualFeed
  onOpen: () => void
  tall: boolean
  loc: (fa: string | undefined | null, collection: string, id: string, field: string) => string
  t: (key: string) => string
}) {
  const title = loc(feed.title, 'visualFeeds', feed.id, 'title')
  const location = loc(feed.location, 'visualFeeds', feed.id, 'location')
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-[var(--color-steve-border)] bg-[var(--ask-inset-bg)] text-start transition hover:border-[var(--color-steve-brief-border)]',
        tall ? 'min-h-[220px]' : 'min-h-[110px]',
      )}
    >
      <img
        src={feed.src}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[12px] text-white">{title}</div>
          <div className="truncate text-[10px] text-white/70">{location}</div>
        </div>
        <div className="shrink-0 text-[10px]" dir="ltr">
          {feed.status === 'attention' ? (
            <span className="text-[var(--color-steve-warning)]">
              ● {t('visual.attention')} · {feed.time}
            </span>
          ) : feed.status === 'live' ? (
            <span className="text-[var(--color-steve-green-bright)]">● {feed.time}</span>
          ) : (
            <span className="text-white/70">○ {feed.time}</span>
          )}
        </div>
      </div>
    </button>
  )
}

/** Single evidence / preview image used on records */
export function VisualEvidence({
  src,
  caption,
  meta,
  onOpen,
}: {
  src: string
  caption: string
  meta?: string
  onOpen?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-xl border border-[var(--color-steve-border)] bg-[var(--ask-inset-bg)] text-start"
    >
      <img src={src} alt={caption} loading="lazy" className="aspect-[16/10] w-full object-cover opacity-95 transition group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5">
        <div className="text-[12px] text-white">{caption}</div>
        {meta ? <div className="text-[10px] text-white/70">{meta}</div> : null}
      </div>
    </button>
  )
}
