import { delay, http, HttpResponse } from 'msw'
import type { HealthResponse } from '../api/contracts'
import { catalogHandlers } from './catalog'
import { accountHandlers } from './account-handlers'
import { cartHandlers } from './cart-handlers'
import { walletHandlers } from './wallet-handlers'
import { orderHandlers } from './order-handlers'
import { socketHandler } from './socket-handler'
import { marketControls } from './market-controls'

export const handlers = [
  ...marketControls,
  ...walletHandlers,
  ...orderHandlers,
  ...accountHandlers,
  ...cartHandlers,
  ...catalogHandlers,
  http.get('/api/health', async () => {
    await delay(200)
    return HttpResponse.json<HealthResponse>({
      status: 'ok',
      service: 'jungle-marketplace-mock',
    })
  }),
  socketHandler,
]
