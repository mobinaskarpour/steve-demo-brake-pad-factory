export const THEME_KEY = 'steve-theme'

export type AppTheme = 'light' | 'dark'

export const DEFAULT_THEME: AppTheme = 'dark'

export function readStoredTheme(): AppTheme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* storage unavailable — fall through to the default identity */
  }
  return DEFAULT_THEME
}

export function applyDocumentTheme(theme: AppTheme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function storeTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}
