import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import './index.css'
import './styles/frame-alignment.css'

async function bootstrap() {
  // Download UI and mocks concurrently; the HTML shell stays visible meanwhile.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false' && 'serviceWorker' in navigator) {
    // Register while UI/network modules download. worker.start still owns activation/errors.
    void navigator.serviceWorker.register('/mockServiceWorker.js').catch(() => undefined)
  }
  // Let the honest loading shell paint before evaluating the larger modules.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  const application = import('./app/mount')
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { startMockNetwork } = await import('./mocks/browser')
    await startMockNetwork()
  }
  const { mountApplication } = await application
  mountApplication()
}

void bootstrap().catch(() => {
  const message = document.createElement('main')
  message.className = 'container commerce-page'
  message.setAttribute('role', 'alert')
  const title = document.createElement('h1')
  title.textContent = 'Não foi possível iniciar a experiência'
  const explanation = document.createElement('p')
  explanation.textContent = 'Recarregue a página para tentar iniciar novamente.'
  message.append(title, explanation)
  document.getElementById('root')!.replaceChildren(message)
})
