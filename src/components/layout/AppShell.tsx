import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './Sidebar'
import { AskSteveRoot } from './AskSteve'
import { AskSteveProvider, useAskSteve } from './AskSteveContext'
import { appConfig } from '../../config'
import { useDemo } from '../../domain/store'
import { LanguageSwitcher, ThemeSwitcher, useLocale } from '../../i18n/LocaleProvider'
import { getEnConfig } from '../../i18n/enContent'

function ShellInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { locale, dir, isRtl, tToast } = useLocale()
  const { expand, safeAreaPx } = useAskSteve()
  const { state, dispatch } = useDemo()
  const enCfg = getEnConfig() as Record<string, string>

  useEffect(() => {
    if (!state.toast) return
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800)
    return () => window.clearTimeout(timer)
  }, [state.toast, dispatch])

  const [mobileNav, setMobileNav] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const displayScope = locale === 'en' ? enCfg.scopeLabel || appConfig.scopeLabel : appConfig.scopeLabel
  const displayUser = locale === 'en' ? enCfg.userName || appConfig.user.name : appConfig.user.name

  return (
    <div className="steve-shell flex min-h-screen" dir={dir}>
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileNav ? (
          <>
            <motion.button type="button" className="fixed inset-0 z-40 bg-black/55 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
            <motion.div
              className={`fixed inset-y-0 z-50 md:hidden ${isRtl ? 'right-0' : 'left-0'}`}
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ duration: 0.18 }}
            >
              <div className="relative h-full">
                <button type="button" className={`absolute top-3 z-10 rounded-lg bg-[var(--color-steve-elevated)] p-1.5 ${isRtl ? 'left-3' : 'right-3'}`} onClick={() => setMobileNav(false)}>
                  <X size={16} />
                </button>
                <Sidebar onNavigate={() => setMobileNav(false)} />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col" style={{ paddingBottom: safeAreaPx }}>
        <div className="relative flex items-center justify-between gap-3" style={{ padding: `${14}px var(--steve-page-pad-x)` }}>
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-[var(--color-steve-text-muted)] md:hidden" aria-label="Menu">
              <Menu size={18} />
            </button>
            <div className="relative">
              <button
                type="button"
                className="steve-scope inline-flex items-center gap-1.5"
                onClick={() => {
                  setScopeOpen((v) => !v)
                  setUserOpen(false)
                }}
              >
                {displayScope}
                <ChevronDown size={12} />
              </button>
              {scopeOpen ? (
                <div className={`absolute top-full z-30 mt-2 w-56 rounded-xl border border-[var(--color-steve-border)] bg-[var(--color-steve-surface)] p-2 shadow-xl ${isRtl ? 'end-0 right-0' : 'start-0 left-0'}`}>
                  {[
                    { label: t('shell.allBusinesses'), to: '/' },
                    { label: t('nav.map'), to: '/map' },
                    { label: t('nav.agents'), to: '/agents' },
                    { label: t('nav.work'), to: '/work' },
                    { label: t('nav.communication'), to: '/communication' },
                  ].map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-start text-[12px] text-[var(--color-steve-text-muted)] hover:bg-[var(--color-steve-elevated)]"
                      onClick={() => {
                        setScopeOpen(false)
                        navigate(item.to)
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-1.5"
                onClick={() => {
                  setUserOpen((v) => !v)
                  setScopeOpen(false)
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-steve-green-dim)] text-[11px] text-[var(--color-steve-text-muted)]">{locale === 'en' ? appConfig.user.initialsEn || 'AG' : appConfig.user.initials}</div>
                <ChevronDown size={12} className="text-[var(--color-steve-text-faint)]" />
              </button>
              {userOpen ? (
                <div className={`absolute top-full z-30 mt-2 w-52 rounded-xl border border-[var(--color-steve-border)] bg-[var(--color-steve-surface)] p-2 shadow-xl ${isRtl ? 'left-0' : 'right-0'}`}>
                  <div className="px-3 py-2 text-[12px] text-[var(--color-steve-text-faint)]">{displayUser}</div>
                  <Link to="/agents" className="block rounded-lg px-3 py-2 text-[12px] hover:bg-[var(--color-steve-elevated)]" onClick={() => setUserOpen(false)}>
                    {t('nav.agents')}
                  </Link>
                  <Link to="/work" className="block rounded-lg px-3 py-2 text-[12px] hover:bg-[var(--color-steve-elevated)]" onClick={() => setUserOpen(false)}>
                    {t('shell.myWork')}
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-start text-[12px] hover:bg-[var(--color-steve-elevated)]"
                    onClick={() => {
                      setUserOpen(false)
                      expand()
                    }}
                  >
                    {t('shell.askSteve')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <main
          className="flex-1"
          style={{ padding: `0 var(--steve-page-pad-x) 12px` }}
          onClick={() => {
            setScopeOpen(false)
            setUserOpen(false)
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname + location.search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {state.toast ? (
        <div className="pointer-events-none fixed bottom-[calc(var(--steve-ask-safe,108px)+8px)] left-1/2 z-[70] -translate-x-1/2 rounded-full border border-[var(--color-steve-brief-border)] bg-[var(--color-steve-elevated)] px-4 py-2 text-[12px] text-[var(--color-steve-text)] shadow-lg">
          {tToast(state.toast)}
        </div>
      ) : null}
      <AskSteveRoot />
    </div>
  )
}

export function AppShell() {
  return (
    <AskSteveProvider>
      <ShellInner />
    </AskSteveProvider>
  )
}
