import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { TRPCProvider } from '@/providers/trpc'
import { I18nProvider } from '@/i18n'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <I18nProvider>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </I18nProvider>
  </BrowserRouter>,
)
