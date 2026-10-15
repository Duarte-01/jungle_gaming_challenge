import { delay, http, HttpResponse } from 'msw'
import { orderInputSchema } from '../domain/checkout'
import { appendEvent } from './event-bus'
import { transaction } from './database'
import { ApiFault, parseBody, respond } from './http'
import { sessionUser } from './session'
import { scheduleOrders, settleDueOrders, validateOrderCart } from './order-state'

export const orderHandlers = [
  http.post('/api/orders', ({ request, cookies }) =>
    respond(async () => {
      const input = await parseBody(request, orderInputSchema)
      const key = request.headers.get('Idempotency-Key') ?? ''
      if (!/^[A-Za-z0-9_-]{16,100}$/.test(key))
        throw new ApiFault(
          422,
          'IDEMPOTENCY_KEY_REQUIRED',
          'Envie uma chave de idempotência válida.',
        )
      await settleDueOrders()
      const outcome = localStorage.getItem('kurio:scenario')
      let replay = false
      const order = await transaction((database) => {
        const user = sessionUser(database, cookies)!
        const fingerprint = JSON.stringify(input)
        const existing = database.idempotency[`${user.id}:${key}`]
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw new ApiFault(
              409,
              'IDEMPOTENCY_CONFLICT',
              'Esta tentativa já foi usada com outros dados. Recupere o pedido existente.',
            )
          replay = true
          return structuredClone(database.orders[existing.orderId].order)
        }
        const pending = Object.values(database.orders).find(
          (saved) => saved.order.userId === user.id && saved.order.status === 'pending',
        )
        if (pending)
          throw new ApiFault(
            409,
            'ORDER_IN_PROGRESS',
            'Você já tem um pedido em andamento.',
            undefined,
            { orderId: pending.order.id },
          )
        const cart = validateOrderCart(database, user.id, input)
        const wallet = database.wallets[user.id]?.find((entry) => entry.id === input.walletId)
        if (!wallet) throw new ApiFault(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
        if (wallet.version !== input.walletVersion)
          throw new ApiFault(
            409,
            'WALLET_CHANGED',
            'A carteira mudou. Revise os dados e confirme novamente.',
          )
        const connection = database.connections[cookies.kurio_session!]
        if (
          !connection ||
          connection.walletId !== wallet.id ||
          connection.network !== input.network ||
          wallet.network !== input.network
        )
          throw new ApiFault(
            409,
            'CONNECTION_REQUIRED',
            'Conecte a carteira e a rede selecionadas antes de confirmar.',
          )
        const id = crypto.randomUUID()
        const order = {
          id,
          userId: user.id,
          status: 'pending' as const,
          version: 1,
          createdAt: Date.now(),
          transactionReference: null,
          snapshot: structuredClone({
            items: cart.items,
            quote: cart.quote,
            coupon: cart.coupon,
            wallet,
            customer: input.customer,
            network: input.network,
          }),
        }
        database.orders[id] = {
          order,
          resolveAt: Date.now() + 1800,
          outcome: outcome === 'payment-declined' ? 'declined' : 'confirmed',
          held: outcome === 'order-pending',
        }
        database.idempotency[`${user.id}:${key}`] = { fingerprint, orderId: id }
        for (const item of cart.items) {
          const nft = database.nfts.find((entry) => entry.id === item.nft.id)!
          nft.editions.find((entry) => entry.id === item.editionId)!.available -= item.quantity
          nft.version++
          appendEvent(
            database,
            'nft.updated',
            nft.id,
            nft.version,
            undefined,
            'reservation',
            user.id,
          )
        }
        appendEvent(database, 'order.updated', id, 1, user.id)
        return structuredClone(order)
      })
      await scheduleOrders()
      if (outcome === 'order-timeout' && !replay) await delay(1500)
      return HttpResponse.json(order, { status: replay ? 200 : 201 })
    }),
  ),
  http.get('/api/orders', ({ cookies }) =>
    respond(async () => {
      await settleDueOrders()
      return transaction((database) => {
        const user = sessionUser(database, cookies)!
        return HttpResponse.json(
          Object.values(database.orders)
            .map((saved) => saved.order)
            .filter((order) => order.userId === user.id)
            .sort((a, b) => b.createdAt - a.createdAt),
        )
      })
    }),
  ),
  http.get('/api/orders/attempt/:key', ({ cookies, params }) =>
    respond(async () => {
      await settleDueOrders()
      return transaction((database) => {
        const user = sessionUser(database, cookies)!
        const attempt = database.idempotency[`${user.id}:${params.key}`]
        if (!attempt)
          throw new ApiFault(
            404,
            'ATTEMPT_NOT_FOUND',
            'Esta tentativa ainda não possui um pedido registrado.',
          )
        return HttpResponse.json(database.orders[attempt.orderId].order)
      })
    }),
  ),
  http.get('/api/orders/:id', ({ cookies, params }) =>
    respond(async () => {
      await settleDueOrders()
      return transaction((database) => {
        const user = sessionUser(database, cookies)!
        const saved = database.orders[String(params.id)]
        if (!saved) throw new ApiFault(404, 'NOT_FOUND', 'Pedido não encontrado.')
        if (saved.order.userId !== user.id)
          throw new ApiFault(403, 'FORBIDDEN', 'Este pedido não pertence à sua conta.')
        return HttpResponse.json(saved.order)
      })
    }),
  ),
]
