import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type AskMode = 'collapsed' | 'expanded' | 'focused'

export type AskContext = {
  label: string
  kind?: string
  recordType?: string
  recordId?: string
  /** Persian (or active FA) contextual prompts */
  prompts?: string[]
  /** English contextual prompts when locale is en */
  promptsEn?: string[]
}

type AskCtx = {
  mode: AskMode
  setMode: (m: AskMode) => void
  expand: () => void
  collapse: () => void
  focus: () => void
  context: AskContext | null
  setContext: (c: AskContext | null) => void
  safeAreaPx: number
}

const AskSteveContext = createContext<AskCtx | null>(null)

/** Matches panel + dock + root padding so content never sits under Ask Steve */
const SAFE = {
  collapsed: 136,
  expanded: 700,
  focused: 900,
} as const

export function AskSteveProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AskMode>('collapsed')
  const [context, setContext] = useState<AskContext | null>(null)

  const expand = useCallback(() => setMode('expanded'), [])
  const collapse = useCallback(() => setMode('collapsed'), [])
  const focus = useCallback(() => setMode('focused'), [])

  const value = useMemo<AskCtx>(
    () => ({
      mode,
      setMode,
      expand,
      collapse,
      focus,
      context,
      setContext,
      safeAreaPx: SAFE[mode],
    }),
    [mode, expand, collapse, focus, context],
  )

  return <AskSteveContext.Provider value={value}>{children}</AskSteveContext.Provider>
}

export function useAskSteve() {
  const ctx = useContext(AskSteveContext)
  if (!ctx) throw new Error('useAskSteve requires AskSteveProvider')
  return ctx
}
