import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import i18n, { applyDocumentLocale, LOCALE_KEY, readStoredLocale, type AppLocale } from './index'
import { applyDocumentTheme, readStoredTheme, storeTheme, type AppTheme } from '../theme/theme'
import { getEnField } from './enContent'
import { ensureEnglish } from './ensureEnglish'

type LocaleCtx = {
  locale: AppLocale
  dir: 'rtl' | 'ltr'
  isRtl: boolean
  setLocale: (l: AppLocale) => void
  /** Active visual identity: dark is each business's primary brand expression */
  theme: AppTheme
  setTheme: (t: AppTheme) => void
  toggleTheme: () => void
  /** Resolve bilingual demo field: Persian seed string + English overlay */
  loc: (fa: string | undefined | null, collection: string, id: string, field: string) => string
  /** Translate common runtime toast strings */
  tToast: (fa: string | undefined | null) => string
  tStatus: (s: string) => string
  tPriority: (s: string) => string
  tStage: (s: string) => string
}

const Ctx = createContext<LocaleCtx | null>(null)

const stageMap: Record<string, string> = {
  پیشنهاد: 'stages.propose',
  آماده‌سازی: 'stages.prepare',
  مجاز: 'stages.authorized',
  'در حال اجرا': 'stages.executing',
  مشاهده: 'stages.observe',
  'تایید شده': 'stages.approved',
  نتیجه: 'stages.outcome',
  یادگیری: 'stages.learn',
  بسته: 'stages.closed',
  Propose: 'stages.propose',
  Prepare: 'stages.prepare',
  Authorized: 'stages.authorized',
  Executing: 'stages.executing',
  Observe: 'stages.observe',
  Approved: 'stages.approved',
  Outcome: 'stages.outcome',
  Learn: 'stages.learn',
  Closed: 'stages.closed',
}

const statusMap: Record<string, string> = {
  pending: 'status.pendingApproval',
  approved: 'status.approved',
  rejected: 'status.rejected',
  open: 'status.open',
  closed: 'status.closed',
  active: 'status.active',
  attention: 'status.attention',
  idle: 'status.idle',
  danger: 'status.danger',
  warning: 'status.warning',
  success: 'status.success',
  info: 'status.info',
  live: 'status.live',
  snapshot: 'status.snapshot',
  درانتظار: 'status.pendingApproval',
  'منتظر تایید': 'status.pendingApproval',
  'تایید شده': 'status.approved',
  'رد شده': 'status.rejected',
  باز: 'status.open',
  بسته: 'status.closed',
  فعال: 'status.active',
  'نیازمند توجه': 'status.attention',
}

const priorityMap: Record<string, string> = {
  critical: 'priority.critical',
  high: 'priority.high',
  medium: 'priority.medium',
  low: 'priority.low',
  بحرانی: 'priority.critical',
  بالا: 'priority.high',
  متوسط: 'priority.medium',
  پایین: 'priority.low',
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { t, i18n: i18nApi } = useTranslation()
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale())
  const [theme, setThemeState] = useState<AppTheme>(() => readStoredTheme())

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(LOCALE_KEY, l)
    } catch {
      /* ignore */
    }
    void i18n.changeLanguage(l)
    applyDocumentLocale(l)
  }, [])

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next)
    storeTheme(next)
    applyDocumentTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark'
      storeTheme(next)
      applyDocumentTheme(next)
      return next
    })
  }, [])

  useEffect(() => {
    applyDocumentLocale(locale)
    if (i18nApi.language !== locale) void i18n.changeLanguage(locale)
  }, [locale, i18nApi.language])

  useEffect(() => {
    applyDocumentTheme(theme)
  }, [theme])

  const loc = useCallback(
    (fa: string | undefined | null, collection: string, id: string, field: string) => {
      const fallback = fa ?? ''
      if (locale === 'fa') return fallback
      const en = getEnField(collection, id, field, fallback)
      return ensureEnglish(en)
    },
    [locale],
  )

  const tToast = useCallback(
    (fa: string | undefined | null) => {
      if (!fa) return ''
      if (locale === 'fa') return fa
      const exact: Record<string, string> = {
        'هشدار تایید مشاهده شد.': 'Alert acknowledged.',
        'هشدار بسته شد.': 'Alert closed.',
        'پیام ارسال شد.': 'Message sent.',
      }
      if (exact[fa]) return exact[fa]
      let out = fa
      out = out.replace(/درخواست (.+) تایید شد\./, 'Request $1 approved.')
      out = out.replace(/تراکنش (.+) تایید شد\./, 'Transaction $1 approved.')
      out = out.replace(/درخواست توسط مدیرعامل تایید شد\./, 'Request approved by CEO.')
      out = out.replace(/تایید (.+)/, 'Approved $1')
      out = out.replace(/وضعیت (.+) به «تایید شده» تغییر کرد\./, 'Status of $1 changed to Approved.')
      out = out.replace(/(.+) تایید شد\./, '$1 approved.')
      return ensureEnglish(out)
    },
    [locale],
  )

  const tStatus = useCallback(
    (s: string) => {
      const key = statusMap[s] || statusMap[s.toLowerCase()]
      return key ? t(key) : s
    },
    [t],
  )
  const tPriority = useCallback(
    (s: string) => {
      const key = priorityMap[s] || priorityMap[s.toLowerCase()]
      return key ? t(key) : s
    },
    [t],
  )
  const tStage = useCallback(
    (s: string) => {
      const key = stageMap[s]
      return key ? t(key) : s
    },
    [t],
  )

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      dir: locale === 'fa' ? 'rtl' : 'ltr',
      isRtl: locale === 'fa',
      setLocale,
      theme,
      setTheme,
      toggleTheme,
      loc,
      tToast,
      tStatus,
      tPriority,
      tStage,
    }),
    [locale, setLocale, theme, setTheme, toggleTheme, loc, tToast, tStatus, tPriority, tStage],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLocale() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLocale requires LocaleProvider')
  return ctx
}

const switchGroupClass =
  'inline-flex items-center rounded-full border border-[var(--color-steve-border)] bg-[var(--color-steve-elevated)] p-0.5 text-[11px]'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  return (
    <div className={`${switchGroupClass} ${className}`} role="group" aria-label="Language">
      <button
        type="button"
        aria-label="Switch language to Persian"
        aria-pressed={locale === 'fa'}
        data-locale-option="fa"
        className={`rounded-full px-2.5 py-1 transition ${locale === 'fa' ? 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-text)]' : 'text-[var(--color-steve-text-faint)]'}`}
        onClick={() => setLocale('fa')}
      >
        FA
      </button>
      <button
        type="button"
        aria-label="Switch language to English"
        aria-pressed={locale === 'en'}
        data-locale-option="en"
        className={`rounded-full px-2.5 py-1 transition ${locale === 'en' ? 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-text)]' : 'text-[var(--color-steve-text-faint)]'}`}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
    </div>
  )
}

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useLocale()
  const { t } = useTranslation()
  const options = [
    { value: 'light' as const, Icon: Sun, label: t('shell.light') },
    { value: 'dark' as const, Icon: Moon, label: t('shell.dark') },
  ]
  return (
    <div className={`${switchGroupClass} ${className}`} role="group" aria-label={t('shell.theme')}>
      {options.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          data-theme-option={value}
          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 transition ${theme === value ? 'bg-[var(--color-steve-green-dim)] text-[var(--color-steve-text)]' : 'text-[var(--color-steve-text-faint)]'}`}
          onClick={() => setTheme(value)}
        >
          <Icon size={13} strokeWidth={1.6} />
        </button>
      ))}
    </div>
  )
}

/** Keep technical IDs LTR inside RTL prose */
export function Ltr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={`inline-block ${className}`}>
      {children}
    </span>
  )
}
