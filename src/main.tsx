import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './index.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <div className="kurio-app bootstrap-loading" role="status" aria-label="Preparando o marketplace">
    <div className="container bootstrap-header">
      <span className="brand">KURIO</span>
      <span>Preparando sua experiência…</span>
    </div>
    <div className="container bootstrap-body">
      <div className="shimmer" />
      <div className="shimmer" />
      <div className="shimmer" />
    </div>
  </div>,
)

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'warn', quiet: true })
  }
  // Socket.IO captura WebSocket ao importar. Carregue as rotas após a interceptação.
  const { Application } = await import('./app/application')
  root.render(
    <StrictMode>
      <Application />
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  root.render(
    <main role="alert" className="container commerce-page">
      <h1>Não foi possível iniciar a experiência</h1>
      <p>Confira sua conexão e recarregue a página.</p>
    </main>,
  )
})
