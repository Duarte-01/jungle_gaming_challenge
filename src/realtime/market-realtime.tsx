import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createMarketSocket } from './socket'
import { sessionOptions } from '../api/account'
import { queryClient } from '../app/query-client'
import { marketEventSchema, type MarketEvent } from '../domain/checkout'
import { notifyFeedback, notifySessionExpired, sessionGeneration } from '../auth/events'
import type { Nft, CatalogResponse } from '../api/catalog'
import type { Cart } from '../api/cart'
import type { Order } from '../domain/checkout'

export function MarketRealtime() {
  const session = useQuery(sessionOptions)
  const userId = session.data?.user?.id
  const generation = sessionGeneration()
  const [state, setState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  useEffect(() => {
    const socket = createMarketSocket()
    const versions = new Map<string, number>()
    const seen = new Set<string>()
    let active = true
    const current = () => active && generation === sessionGeneration()
    const reconcile = () => {
      if (!current()) return
      setState('connected')
      void queryClient.invalidateQueries({
        predicate: (query) =>
          ['nfts', 'nft', 'cart', 'private'].includes(String(query.queryKey[0])),
        refetchType: 'active',
      })
    }
    const receive = (input: unknown) => {
      if (!current()) return
      const result = marketEventSchema.safeParse(input)
      if (!result.success) return
      const event: MarketEvent = result.data
      if (event.ownerId && event.ownerId !== userId) return
      if (seen.has(event.id)) return
      const key = `${event.type}:${event.resourceId}`
      const cached =
        event.type === 'nft.updated'
          ? Math.max(
              queryClient.getQueryData<Nft>(['nft', event.resourceId])?.version ?? 0,
              ...queryClient
                .getQueriesData<CatalogResponse>({ queryKey: ['nfts'] })
                .flatMap(
                  ([, data]) =>
                    data?.items
                      .filter((item) => item.id === event.resourceId)
                      .map((item) => item.version) ?? [],
                ),
              queryClient
                .getQueryData<Cart>(['cart', userId ?? 'guest'])
                ?.items.find((item) => item.nft.id === event.resourceId)?.nft.version ?? 0,
            )
          : event.type === 'order.updated'
            ? (queryClient.getQueryData<Order>(['private', userId, 'order', event.resourceId])
                ?.version ?? 0)
            : Number(
                queryClient
                  .getQueryData<Cart>(['cart', userId ?? 'guest'])
                  ?.quote.version.split(':')[1] ?? 0,
              )
      if (event.version < cached || event.version <= (versions.get(key) ?? 0)) return
      seen.add(event.id)
      versions.set(key, event.version)
      if (seen.size > 500) seen.delete(seen.values().next().value!)
      if (event.type === 'nft.updated') {
        const cart = queryClient.getQueryData<Cart>(['cart', userId ?? 'guest'])
        if (
          cart?.items.some((item) => item.nft.id === event.resourceId) &&
          !(event.reason === 'reservation' && event.actorId === userId)
        )
          notifyFeedback(
            'O preço ou a disponibilidade de um NFT do carrinho mudou. Revise os valores antes de comprar.',
          )
        void queryClient.invalidateQueries({
          predicate: (query) =>
            ['nfts', 'nft', 'cart'].includes(String(query.queryKey[0])) ||
            (query.queryKey[0] === 'private' && query.queryKey[2] === 'favorites'),
        })
      } else if (event.type === 'quote.updated') {
        notifyFeedback('As taxas ou condições do cupom mudaram. Revise o resumo do carrinho.')
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
      } else {
        void queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'private' &&
            query.queryKey[1] === userId &&
            ['order', 'orders', 'attempt'].includes(String(query.queryKey[2])),
        })
        void queryClient.invalidateQueries({ queryKey: ['cart', userId] })
      }
    }
    socket.on('connect', () => {
      if (userId) socket.emit('session.subscribe', { userId })
      else reconcile()
    })
    socket.on('session.ready', (value: { userId: string }) => {
      if (value.userId === userId) reconcile()
    })
    socket.on('session.denied', () => {
      if (current() && userId) notifySessionExpired()
    })
    socket.on('disconnect', () => {
      if (current()) setState('disconnected')
    })
    socket.on('connect_error', () => {
      if (current()) setState('disconnected')
    })
    socket.on('nft.updated', receive)
    socket.on('order.updated', receive)
    socket.on('quote.updated', receive)
    socket.connect()
    return () => {
      active = false
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [userId, generation])
  return (
    <>
      <output className="sr-only" data-testid="realtime-status" aria-live="off">
        {state}
      </output>
      {state === 'disconnected' && (
        <p className="connection-notice" role="status">
          Conexão interrompida. As informações serão reconciliadas ao reconectar.
        </p>
      )}
    </>
  )
}
