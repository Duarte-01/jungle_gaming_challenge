import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { sessionOptions, problemFrom } from '../api/account'
import { getOrder, getOrders } from '../api/checkout'
import { defaultSearch } from '../api/catalog'
import { MarketHeader } from '../components/market-header'
import { QuoteSummary } from '../components/quote-summary'
import { clearAttempt } from '../lib/checkout-storage'
import { Button } from '../components/ui/button'

export function OrderPage() {
  const { orderId } = useParams({ from: '/pedidos/$orderId' })
  const session = useQuery(sessionOptions)
  const userId = session.data?.user?.id
  const navigate = useNavigate()
  const order = useQuery({
    queryKey: ['private', userId, 'order', orderId],
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: Boolean(userId),
    retry: (count, error) =>
      count < 1 && !(isAxiosError(error) && error.response && error.response.status < 500),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1000 : false),
  })
  useEffect(() => {
    if (userId && order.data?.status === 'confirmed') clearAttempt(userId, orderId)
  }, [userId, order.data?.status, orderId])
  const data = order.data
  return (
    <div className="kurio-app">
      <MarketHeader />
      <main className="container commerce-page">
        {order.isPending ? (
          <div className="cart-skeleton shimmer" aria-label="Consultando pedido" />
        ) : order.isError ? (
          <section role="alert">
            <h1>Não foi possível consultar o pedido</h1>
            <p>{problemFrom(order.error).message}</p>
            <button className="kurio-button" type="button" onClick={() => void order.refetch()}>
              Tentar novamente
            </button>
          </section>
        ) : (
          data && (
            <>
              <p className="eyebrow">Sua jornada de coleção</p>
              <h1>
                {data.status === 'confirmed'
                  ? 'Pedido confirmado'
                  : data.status === 'declined'
                    ? 'Pagamento recusado'
                    : 'Pedido em andamento'}
              </h1>
              <p role="status">
                {data.status === 'pending'
                  ? 'Aguardando a resposta da carteira simulada. Você pode atualizar esta página com segurança.'
                  : data.status === 'confirmed'
                    ? 'A compra foi confirmada pela simulação.'
                    : data.refusalReason}
              </p>
              <p className="order-id">
                Pedido <span data-testid="order-id">{data.id}</span>
              </p>
              <div className="cart-layout">
                <section className="profile-form">
                  <h2>{data.status === 'confirmed' ? 'Recibo da coleção' : 'Dados do pedido'}</h2>
                  {data.snapshot.items.map((item) => (
                    <div className="receipt-item" key={item.key}>
                      <img src={item.nft.image} alt={item.nft.name} width={64} height={64} />
                      <div>
                        <h3>{item.nft.name}</h3>
                        <p>
                          {item.editionLabel} · {item.quantity} unidade(s)
                        </p>
                        <p>{item.nft.priceEth} ETH por unidade</p>
                      </div>
                    </div>
                  ))}
                  <h2>Colecionador</h2>
                  <p>{data.snapshot.customer.name}</p>
                  <p>{data.snapshot.customer.email}</p>
                  <h2>Carteira</h2>
                  <p>
                    {data.snapshot.wallet.label} · {data.snapshot.network}
                  </p>
                  <p className="wallet-address">{data.snapshot.wallet.address}</p>
                  {data.status === 'confirmed' && data.transactionReference && (
                    <>
                      <h2>Transação simulada</h2>
                      <code className="wallet-address">{data.transactionReference}</code>
                      <Link
                        to="/explorador/$reference"
                        params={{ reference: data.transactionReference }}
                        className="text-link"
                      >
                        Explorar transação simulada
                      </Link>
                    </>
                  )}
                </section>
                <div>
                  <QuoteSummary
                    cart={{
                      items: data.snapshot.items,
                      coupon: data.snapshot.coupon,
                      quote: data.snapshot.quote,
                    }}
                  />
                  {data.status === 'declined' && (
                    <Button
                      className="confirm-purchase"
                      onClick={() => {
                        if (userId) clearAttempt(userId)
                        void navigate({ to: '/pagamento' })
                      }}
                    >
                      Revisar compra novamente
                    </Button>
                  )}
                </div>
              </div>
              <div className="order-links">
                <Link to="/pedidos" className="text-link">
                  Meus pedidos
                </Link>
                <Link to="/carrinho" className="text-link">
                  Ver carrinho
                </Link>
                <Link to="/" search={defaultSearch} className="text-link">
                  Continuar explorando
                </Link>
              </div>
            </>
          )
        )}
      </main>
    </div>
  )
}

export function OrdersPage() {
  const session = useQuery(sessionOptions)
  const orders = useQuery({
    queryKey: ['private', session.data?.user?.id, 'orders'],
    queryFn: ({ signal }) => getOrders(signal),
    enabled: Boolean(session.data?.user),
    refetchInterval: (query) =>
      query.state.data?.some((order) => order.status === 'pending') ? 1000 : false,
  })
  return (
    <div className="kurio-app">
      <MarketHeader />
      <main className="container commerce-page">
        <h1>Meus pedidos</h1>
        {orders.isPending ? (
          <div className="cart-skeleton shimmer" aria-label="Carregando pedidos" />
        ) : orders.isError ? (
          <p role="alert">{problemFrom(orders.error).message}</p>
        ) : !orders.data?.length ? (
          <p>Você ainda não tem pedidos.</p>
        ) : (
          <div className="orders-list">
            {orders.data.map((order) => (
              <article className="wallet-card" key={order.id}>
                <h2>
                  {order.status === 'confirmed'
                    ? 'Confirmado'
                    : order.status === 'declined'
                      ? 'Recusado'
                      : 'Pendente'}
                </h2>
                <p className="order-id">{order.id}</p>
                <p>{order.snapshot.quote.totalEth} ETH</p>
                <Link to="/pedidos/$orderId" params={{ orderId: order.id }} className="text-link">
                  Consultar pedido
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export function ExplorerPage() {
  const { reference } = useParams({ from: '/explorador/$reference' })
  const session = useQuery(sessionOptions)
  const orders = useQuery({
    queryKey: ['private', session.data?.user?.id, 'orders'],
    queryFn: ({ signal }) => getOrders(signal),
    enabled: Boolean(session.data?.user),
  })
  const order = orders.data?.find(
    (item) => item.status === 'confirmed' && item.transactionReference === reference,
  )
  return (
    <div className="kurio-app">
      <MarketHeader />
      <main className="container commerce-page">
        <h1>Explorador simulado</h1>
        <p>Esta referência pertence à demonstração. Não representa uma transação em blockchain.</p>
        {orders.isPending ? (
          <p role="status">Consultando…</p>
        ) : order ? (
          <section className="profile-form">
            <p className="wallet-address">{reference}</p>
            <p>Estado: confirmado</p>
            <p>Rede da carteira: {order.snapshot.network}</p>
            <p>Total: {order.snapshot.quote.totalEth} ETH</p>
            <Link to="/pedidos/$orderId" params={{ orderId: order.id }} className="text-link">
              Voltar ao recibo
            </Link>
          </section>
        ) : (
          <p role="alert">Referência não encontrada para sua conta.</p>
        )}
      </main>
    </div>
  )
}
