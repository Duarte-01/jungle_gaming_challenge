import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { MarketEvent } from '../domain/checkout'
import { mockEventBus } from './event-bus'
import { readDatabase } from './database'
import { scheduleOrders, settleDueOrders } from './order-state'

const realtime = ws.link(/wss?:\/\/[^/]+\/realtime\/$/)

export const socketHandler = realtime.addEventListener('connection', (connection) => {
  const socket = toSocketIo(connection)
  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('kurio_session='))
    ?.slice('kurio_session='.length)
  let ownerId: string | undefined
  let closed = false
  const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
  socket.client.on('health.check', () =>
    socket.client.emit('health.ready', {
      id: 'realtime-health-v1',
      version: 1,
      transport: 'socket.io',
    }),
  )
  socket.client.on('session.subscribe', async (_event, value: { userId?: string }) => {
    const database = await readDatabase()
    const session = token ? database.sessions[token] : undefined
    if (closed) return
    if (!session || session.expiresAt <= Date.now() || session.userId !== value?.userId) {
      socket.client.emit('session.denied', {})
      return
    }
    ownerId = session.userId
    socket.client.emit('session.ready', { userId: ownerId })
  })
  const deliver = (raw: Event) => {
    const event = (raw as CustomEvent<MarketEvent>).detail
    void readDatabase().then((database) => {
      if (closed) return
      if (event.ownerId) {
        const session = token ? database.sessions[token] : undefined
        if (
          event.ownerId !== ownerId ||
          session?.userId !== ownerId ||
          session.expiresAt <= Date.now()
        )
          return
      }
      socket.client.emit(event.type, event)
    })
  }
  const disconnect = () => {
    if (!closed) connection.client.close(1012, 'Interrupção simulada')
  }
  mockEventBus.addEventListener('market-event', deliver)
  mockEventBus.addEventListener('disconnect', disconnect)
  connection.client.addEventListener('close', () => {
    closed = true
    clearInterval(heartbeat)
    mockEventBus.removeEventListener('market-event', deliver)
    mockEventBus.removeEventListener('disconnect', disconnect)
  })
  void readDatabase().then(async (database) => {
    if (database.socketOfflineUntil > Date.now()) disconnect()
    else {
      await settleDueOrders()
      await scheduleOrders()
    }
  })
})
