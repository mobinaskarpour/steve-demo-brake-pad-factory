import './i18n'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import App from './App'
import { DemoProvider } from './domain/store'
import i18n from './i18n'
import { LocaleProvider } from './i18n/LocaleProvider'
import { applyDocumentTheme, readStoredTheme } from './theme/theme'
import './index.css'

applyDocumentTheme(readStoredTheme())

createRoot(document.getElementById('root')!).render(
  <I18nextProvider i18n={i18n}>
    <LocaleProvider>
      <DemoProvider>
        <App />
      </DemoProvider>
    </LocaleProvider>
  </I18nextProvider>,
)
