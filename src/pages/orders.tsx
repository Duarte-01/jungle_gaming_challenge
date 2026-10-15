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
import { MailOpen } from 'lucide-react'
import type { Order } from '../domain/checkout'

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
    <div className={`kurio-app ${data?.status === 'confirmed' ? 'receipt-app' : ''}`}>
      <MarketHeader title="Pedido" />
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
          data &&
          (data.status === 'confirmed' ? (
            <ConfirmedReceipt order={data} />
          ) : (
            <>
              <p className="eyebrow">Sua jornada de coleção</p>
              <h1>{data.status === 'declined' ? 'Pagamento recusado' : 'Pedido em andamento'}</h1>
              <p role="status">
                {data.status === 'pending'
                  ? 'Aguardando a resposta da carteira simulada. Você pode atualizar esta página com segurança.'
                  : data.refusalReason}
              </p>
              <p className="order-id">
                Pedido <span data-testid="order-id">{data.id}</span>
              </p>
              <div className="cart-layout">
                <section className="profile-form">
                  <h2>Dados do pedido</h2>
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
          ))
        )}
      </main>
    </div>
  )
}

function ConfirmedReceipt({ order }: { order: Order }) {
  const { snapshot } = order
  return (
    <article className="confirmed-receipt">
      <header>
        <Link to="/pedidos" className="receipt-close" aria-label="Fechar recibo">
          ×
        </Link>
        <MailOpen size={65} strokeWidth={1} aria-hidden="true" />
        <h1>Pedido confirmado</h1>
        <p role="status">Seus NFTs agora estão na sua carteira simulada.</p>
      </header>
      <dl className="receipt-facts">
        <div>
          <dt>ID da transação</dt>
          <dd>
            {order.transactionReference?.slice(0, 8)}…{order.transactionReference?.slice(-4)}
          </dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>
            {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC',
            }).format(order.settledAt ?? order.createdAt)}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{snapshot.quote.totalEth} ETH</dd>
        </div>
        <div>
          <dt>Carteira</dt>
          <dd>{snapshot.wallet.provider ?? 'MetaMask'}</dd>
        </div>
      </dl>
      <section className="receipt-transactions">
        <h2>Recibo da coleção</h2>
        <p className="order-id">
          Pedido <span data-testid="order-id">{order.id}</span>
        </p>
        <div className="receipt-table-heading">
          <span>NFTs</span>
          <span>Edições</span>
          <span>Subtotal</span>
        </div>
        {snapshot.items.map((item) => (
          <div className="receipt-item" key={item.key}>
            <img src={item.nft.image} alt={item.nft.name} width={70} height={70} />
            <div>
              <h3>{item.nft.name}</h3>
              <p>ID do token: #{item.nft.name.split('#')[1]}</p>
            </div>
            <span>× {item.quantity}</span>
            <strong>{item.lineTotalEth} ETH</strong>
          </div>
        ))}
        <dl className="receipt-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{snapshot.quote.subtotalEth} ETH</dd>
          </div>
          <div>
            <dt>Desconto</dt>
            <dd>−{snapshot.quote.discountEth} ETH</dd>
          </div>
          <div>
            <dt>Taxa de rede</dt>
            <dd>{snapshot.quote.networkFeeEth} ETH</dd>
          </div>
          <div className="summary-total">
            <dt>Total</dt>
            <dd data-testid="checkout-total">{snapshot.quote.totalEth} ETH</dd>
          </div>
        </dl>
        <p className="receipt-explanation">
          Transação confirmada na simulação de {snapshot.network}. Os itens foram registrados para
          sua carteira nesta demonstração.
        </p>
        {order.transactionReference && (
          <Link
            to="/explorador/$reference"
            params={{ reference: order.transactionReference }}
            className="kurio-button"
          >
            Explorar transação simulada
          </Link>
        )}
        <details className="receipt-collector">
          <summary>Dados do colecionador e da carteira</summary>
          <p>{snapshot.customer.name}</p>
          <p>{snapshot.customer.email}</p>
          <p>
            {snapshot.wallet.label} · {snapshot.network}
          </p>
          <p className="wallet-address">{snapshot.wallet.address}</p>
          <p className="wallet-address">{order.transactionReference}</p>
        </details>
        <div className="order-links">
          <Link to="/pedidos">Meus pedidos</Link>
          <Link to="/carrinho">Ver carrinho</Link>
          <Link to="/" search={defaultSearch}>
            Continuar explorando
          </Link>
        </div>
      </section>
    </article>
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
