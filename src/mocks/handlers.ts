import { delay, http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { HealthResponse, RealtimeReadyEvent } from '../api/contracts'
import { catalogHandlers } from './catalog'

const realtime = ws.link(/wss?:\/\/[^/]+\/realtime\/$/)

export const handlers = [
  ...catalogHandlers,
  http.get('/api/health', async () => {
    await delay(200)
    return HttpResponse.json<HealthResponse>({
      status: 'ok',
      service: 'jungle-marketplace-mock',
    })
  }),
  realtime.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection)
    socket.client.on('health.check', () => {
      socket.client.emit('health.ready', {
        id: 'realtime-health-v1',
        version: 1,
        transport: 'socket.io',
      } satisfies RealtimeReadyEvent)
    })
    // Engine.IO heartbeat; apenas WebSocket, sem fallback de polling nos mocks.
    const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => clearInterval(heartbeat))
  }),
]
