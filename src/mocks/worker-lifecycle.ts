/**
 * MSW 2.15 keeps active client IDs in service-worker memory. Chromium may discard
 * that memory while a tab is suspended. Repeating start() is a no-op in MSW;
 * acknowledge its activation handshake before allowing the next HTTP request.
 * Keep this protocol adapter in the mock layer, without modifying the vendor SW.
 */
export function createWorkerReadiness(registration: ServiceWorkerRegistration) {
  let pending: Promise<void> | undefined

  return function ensureWorkerReady(): Promise<void> {
    if (pending) return pending
    pending = new Promise<void>((resolve, reject) => {
      const worker = registration.active
      if (!worker) {
        reject(new Error('A API de demonstração não está disponível. Recarregue a página.'))
        return
      }
      const cleanup = () => {
        clearTimeout(timeout)
        navigator.serviceWorker.removeEventListener('message', onMessage)
      }
      const onMessage = (event: MessageEvent) => {
        if (event.source !== worker || event.data?.type !== 'MOCKING_ENABLED') return
        cleanup()
        resolve()
      }
      const timeout = window.setTimeout(() => {
        cleanup()
        reject(new Error('A API de demonstração demorou para responder. Tente novamente.'))
      }, 5000)
      navigator.serviceWorker.addEventListener('message', onMessage)
      try {
        worker.postMessage('MOCK_ACTIVATE')
      } catch (error) {
        cleanup()
        reject(error)
      }
    }).finally(() => {
      pending = undefined
    })
    return pending
  }
}
