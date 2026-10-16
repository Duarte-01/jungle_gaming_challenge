import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { setTransportReadiness } from '../api/client'
import { createWorkerReadiness } from './worker-lifecycle'

export const worker = setupWorker(...handlers)

export async function startMockNetwork() {
  const registration = await worker.start({ onUnhandledRequest: 'warn', quiet: true })
  if (!registration) return
  const dispose = setTransportReadiness(createWorkerReadiness(registration))
  import.meta.hot?.dispose(dispose)
}
