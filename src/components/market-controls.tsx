import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { sessionOptions, problemFrom } from '../api/account'
import { defaultSearch, getCatalog } from '../api/catalog'
import { getOrders } from '../api/checkout'
import { Button } from './ui/button'

export function MarketControls() {
  const session = useQuery(sessionOptions)
  const userId = session.data?.user?.id
  const catalog = useQuery({
    queryKey: ['mock-catalog'],
    queryFn: ({ signal }) => getCatalog(defaultSearch, signal),
  })
  const orders = useQuery({
    queryKey: ['private', userId, 'orders'],
    queryFn: ({ signal }) => getOrders(signal),
    enabled: Boolean(userId),
  })
  const [nftId, setNftId] = useState('emerald-ape-42')
  const [price, setPrice] = useState('2.19')
  const pending = orders.data?.find((order) => order.status === 'pending')
  const change = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      api.post(`/testing/${path}`, body),
  })
  return (
    <section className="mock-controls" aria-label="Eventos de mercado da demonstração">
      <h2>Eventos e recuperação</h2>
      <p>
        As ações passam pelos handlers MSW e pelo transporte Socket.IO. Abra outra tela depois de
        selecionar o cenário, ou use os endpoints documentados para acioná-los durante o checkout.
      </p>
      <label htmlFor="event-nft">NFT para simulação</label>
      <select id="event-nft" value={nftId} onChange={(event) => setNftId(event.target.value)}>
        {catalog.data?.items.map((nft) => (
          <option key={nft.id} value={nft.id}>
            {nft.name}
          </option>
        ))}
      </select>
      <label htmlFor="event-price">Novo preço em ETH</label>
      <input
        id="event-price"
        inputMode="decimal"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
      />
      <div className="order-links">
        <Button
          disabled={change.isPending}
          onClick={() => change.mutate({ path: `nfts/${nftId}`, body: { priceEth: price } })}
        >
          Alterar preço
        </Button>
        <Button
          variant="outline"
          disabled={change.isPending}
          onClick={() => change.mutate({ path: `nfts/${nftId}`, body: { available: 0 } })}
        >
          Esgotar edição original
        </Button>
        <Button
          variant="outline"
          disabled={change.isPending}
          onClick={() => change.mutate({ path: 'pricing', body: { expireCoupon: true } })}
        >
          Expirar cupom KURIO10
        </Button>
        <Button
          variant="outline"
          disabled={change.isPending}
          onClick={() => change.mutate({ path: 'realtime/disconnect', body: { durationMs: 1500 } })}
        >
          Interromper conexão por 1,5 s
        </Button>
      </div>
      {pending && (
        <div className="order-links">
          <Button
            disabled={change.isPending}
            onClick={() =>
              change.mutate({ path: `orders/${pending.id}/settle`, body: { outcome: 'confirmed' } })
            }
          >
            Confirmar pedido pendente
          </Button>
          <Button
            variant="outline"
            disabled={change.isPending}
            onClick={() =>
              change.mutate({ path: `orders/${pending.id}/settle`, body: { outcome: 'declined' } })
            }
          >
            Recusar pedido pendente
          </Button>
        </div>
      )}
      {change.isSuccess && <p role="status">Ação processada pela simulação.</p>}
      {change.isError && <p role="alert">{problemFrom(change.error).message}</p>}
    </section>
  )
}
