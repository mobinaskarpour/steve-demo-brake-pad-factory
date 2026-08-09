import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import faCommon from './locales/fa/common.json'
import enCommon from './locales/en/common.json'
import faBusiness from './locales/fa/business.json'
import enBusiness from './locales/en/business.json'

export const LOCALE_KEY = 'steve-locale'
export type AppLocale = 'fa' | 'en'

export function readStoredLocale(): AppLocale {
  try {
    const v = localStorage.getItem(LOCALE_KEY)
    if (v === 'en' || v === 'fa') return v
  } catch {
    /* ignore */
  }
  return 'fa'
}

export function applyDocumentLocale(locale: AppLocale) {
  const dir = locale === 'fa' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
  document.documentElement.dir = dir
  document.documentElement.dataset.locale = locale
  document.body.dir = dir
}

const initial = typeof window !== 'undefined' ? readStoredLocale() : 'fa'
if (typeof window !== 'undefined') applyDocumentLocale(initial)

void i18n.use(initReactI18next).init({
  resources: {
    fa: { common: faCommon, business: faBusiness },
    en: { common: enCommon, business: enBusiness },
  },
  lng: initial,
  fallbackLng: 'fa',
  defaultNS: 'common',
  ns: ['common', 'business'],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
