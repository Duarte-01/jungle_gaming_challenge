import { HttpResponse, type HttpResponseResolver } from 'msw'
import { z } from 'zod'
import { broadcast, appendEvent, mockEventBus } from './event-bus'
import { transaction } from './database'
import { ApiFault, controlResponse, parseBody } from './http'
import { settleOrder } from './order-state'
import { sessionUser } from './session'

const decimal = z.string().regex(/^\d+(?:\.\d{1,18})?$/)

export const marketResolvers = {
  'POST /api/testing/nfts/:id': ({ request, params }) =>
    controlResponse(async () => {
      const input = await parseBody(
        request,
        z
          .object({
            priceEth: decimal.optional(),
            editionId: z.string().optional(),
            available: z.number().int().nonnegative().max(1000).optional(),
          })
          .refine((value) => value.priceEth !== undefined || value.available !== undefined),
      )
      return transaction((database) => {
        const nft = database.nfts.find((item) => item.id === params.id)
        if (!nft) throw new ApiFault(404, 'NOT_FOUND', 'NFT não encontrado.')
        if (input.priceEth !== undefined) nft.priceEth = input.priceEth
        if (input.available !== undefined) {
          const edition = nft.editions.find((item) => item.id === (input.editionId ?? 'standard'))
          if (!edition) throw new ApiFault(404, 'NOT_FOUND', 'Edição não encontrada.')
          edition.available = input.available
        }
        nft.version++
        appendEvent(database, 'nft.updated', nft.id, nft.version)
        return HttpResponse.json(nft)
      })
    }),
  'POST /api/testing/pricing': ({ request }) =>
    controlResponse(async () => {
      const input = await parseBody(
        request,
        z.object({ expireCoupon: z.boolean().optional(), networkFeeEth: decimal.optional() }),
      )
      return transaction((database) => {
        if (input.expireCoupon)
          database.expiredCoupons = [...new Set([...database.expiredCoupons, 'KURIO10'])]
        if (input.networkFeeEth !== undefined) database.networkFeeEth = input.networkFeeEth
        database.pricingVersion++
        appendEvent(database, 'quote.updated', 'pricing', database.pricingVersion)
        return HttpResponse.json({ version: database.pricingVersion })
      })
    }),
  'POST /api/testing/orders/:id/settle': ({ cookies, params, request }) =>
    controlResponse(async () => {
      const { outcome } = await parseBody(
        request,
        z.object({ outcome: z.enum(['confirmed', 'declined']) }),
      )
      return transaction((database) => {
        const user = sessionUser(database, cookies)!
        const saved = database.orders[String(params.id)]
        if (!saved) throw new ApiFault(404, 'NOT_FOUND', 'Pedido não encontrado.')
        if (saved.order.userId !== user.id)
          throw new ApiFault(403, 'FORBIDDEN', 'Este pedido não pertence à sua conta.')
        settleOrder(database, saved.order.id, outcome)
        return HttpResponse.json(saved.order)
      })
    }),
  'POST /api/testing/realtime/disconnect': ({ request }) =>
    controlResponse(async () => {
      const { durationMs } = await parseBody(
        request,
        z.object({ durationMs: z.number().int().min(250).max(10_000).default(1500) }),
      )
      await transaction((database) => {
        database.socketOfflineUntil = Date.now() + durationMs
      })
      mockEventBus.dispatchEvent(new Event('disconnect'))
      return HttpResponse.json({ status: 'disconnected' })
    }),
  'POST /api/testing/events/replay': ({ request, cookies }) =>
    controlResponse(async () => {
      const input = await parseBody(
        request,
        z.object({
          type: z.enum(['nft.updated', 'order.updated', 'quote.updated']),
          resourceId: z.string(),
          version: z.number().int().positive().optional(),
          copies: z.number().int().min(1).max(3).default(2),
        }),
      )
      const event = await transaction((database) => {
        const found = database.events.findLast(
          (entry) => entry.type === input.type && entry.resourceId === input.resourceId,
        )
        if (!found) throw new ApiFault(404, 'NOT_FOUND', 'Evento não encontrado.')
        if (found.ownerId && sessionUser(database, cookies)?.id !== found.ownerId)
          throw new ApiFault(403, 'FORBIDDEN', 'Evento privado de outra conta.')
        if (input.version && input.version > found.version)
          throw new ApiFault(
            422,
            'INVALID_VERSION',
            'O replay aceita apenas versões existentes ou antigas.',
          )
        return {
          ...found,
          version: input.version ?? found.version,
          id: input.version && input.version < found.version ? `${found.id}-old` : found.id,
        }
      })
      for (let index = 0; index < input.copies; index++) broadcast(event)
      return HttpResponse.json({ id: event.id, version: event.version })
    }),
} satisfies Record<string, HttpResponseResolver>
