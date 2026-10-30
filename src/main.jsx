import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PayPage from './billing/PayPage'
import ErrorBoundary from './ErrorBoundary'
import { isSupabaseConfigured } from './supabase'
import './styles.css'

function NotConfigured() {
  return (
    <div className="login-shell"><div className="login-card">
      <p className="eyebrow">FitHub</p>
      <h1>Configuração pendente</h1>
      <p className="lead">Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (arquivo <code>.env</code> local ou variáveis na Vercel) e gere o build de novo.</p>
    </div></div>
  )
}

const params = new URLSearchParams(window.location.search)
const chargeId = params.get('pagar')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {!isSupabaseConfigured ? <NotConfigured /> : chargeId ? <PayPage chargeId={chargeId} /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
)

// PWA: service worker só na web (no app Capacitor não é necessário)
if ('serviceWorker' in navigator && import.meta.env.PROD && !window.Capacitor) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
