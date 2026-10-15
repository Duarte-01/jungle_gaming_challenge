import { useCallback, useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { problemFrom, sessionOptions } from '../api/account'
import { createOrder, getAttempt, getQuote } from '../api/checkout'
import { networks } from '../api/catalog'
import type { Cart } from '../api/cart'
import { fieldErrors, type Session, type User } from '../domain/account'
import { orderInputSchema } from '../domain/checkout'
import { queryClient } from '../app/query-client'
import { sessionGeneration } from '../auth/events'
import { useCart } from '../hooks/use-cart'
import { useWallets } from '../hooks/use-wallets'
import {
  clearAttempt,
  loadAttempt,
  loadDraft,
  newAttempt,
  saveAttempt,
  saveDraft,
  type CheckoutAttempt,
  type CheckoutDraft,
} from '../lib/checkout-storage'
import { MarketHeader } from '../components/market-header'
import { QuoteSummary } from '../components/quote-summary'
import { FormField } from '../components/form-field'
import { Button } from '../components/ui/button'

function CheckoutForm({ user }: { user: User }) {
  const { cart } = useCart()
  const { wallets, connection, connect, disconnect } = useWallets()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() =>
    loadDraft(user.id, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      walletId: '',
      agreed: false,
    }),
  )
  const [review, setReview] = useState<Cart | null>(null)
  const [attempt, setAttempt] = useState(() => loadAttempt(user.id))
  const [recovering, setRecovering] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const sending = useRef(false)
  const generation = sessionGeneration()
  const current = useCallback(
    () =>
      generation === sessionGeneration() &&
      queryClient.getQueryData<Session>(['session'])?.user?.id === user.id,
    [generation, user.id],
  )
  const selected =
    wallets.data?.find((wallet) => wallet.id === draft.walletId) ??
    wallets.data?.find((wallet) => wallet.role === 'primary') ??
    wallets.data?.[0]
  const network = draft.network ?? selected?.network ?? 'Ethereum'
  const connected = Boolean(
    selected && connection.data?.walletId === selected.id && connection.data.network === network,
  )
  const setField = (patch: Partial<CheckoutDraft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    setReview(null)
    try {
      saveDraft(user.id, next)
    } catch {
      setMessage('Não foi possível guardar os dados neste navegador. Confira o espaço disponível.')
    }
  }
  const purchase = useMutation({
    mutationKey: ['private', user.id, 'create-order'],
    retry: false,
    mutationFn: (saved: CheckoutAttempt) => createOrder(saved.input, saved.key),
    onSuccess: async (order, saved) => {
      if (!current()) return
      const next = { ...saved, orderId: order.id }
      saveAttempt(user.id, next)
      setAttempt(next)
      await navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      if (!current()) return
      const problem = problemFrom(error)
      if (
        isAxiosError(error) &&
        error.response &&
        error.response.status >= 400 &&
        error.response.status < 500 &&
        ![401, 408, 429].includes(error.response.status) &&
        problem.code !== 'IDEMPOTENCY_CONFLICT'
      ) {
        clearAttempt(user.id)
        setAttempt(null)
        setReview(null)
        setMessage(problem.message)
        void queryClient.invalidateQueries({ queryKey: ['cart', user.id] })
        void queryClient.invalidateQueries({ queryKey: ['private', user.id] })
        if (problem.code === 'ORDER_IN_PROGRESS' && typeof problem.details?.orderId === 'string')
          void navigate({ to: '/pedidos/$orderId', params: { orderId: problem.details.orderId } })
      } else {
        setMessage(
          'A resposta da compra não chegou. Vamos verificar a mesma tentativa antes de reenviar.',
        )
        setRecovering(true)
      }
    },
    onSettled: () => {
      sending.current = false
    },
  })
  const recovery = useQuery({
    queryKey: ['private', user.id, 'attempt', attempt?.key],
    queryFn: ({ signal }) => getAttempt(attempt!.key, signal),
    enabled: Boolean(attempt) && recovering && !purchase.isPending,
    retry: false,
  })
  useEffect(() => {
    if (recovery.data && attempt && current()) {
      saveAttempt(user.id, { ...attempt, orderId: recovery.data.id })
      void navigate({
        to: '/pedidos/$orderId',
        params: { orderId: recovery.data.id },
        replace: true,
      })
    }
  }, [recovery.data, attempt, navigate, user.id, current])
  const quote = useMutation({
    mutationKey: ['private', user.id, 'review-quote'],
    mutationFn: getQuote,
    onSuccess: (value) => {
      if (current()) {
        setReview(value)
        setMessage('')
      }
    },
    onError: (error) => setMessage(problemFrom(error).message),
  })
  const stale = Boolean(review && cart.data && review.quote.version !== cart.data.quote.version)
  const confirm = (saved: CheckoutAttempt) => {
    if (sending.current) return
    try {
      saveAttempt(user.id, saved)
    } catch {
      setMessage(
        'Não foi possível registrar a tentativa neste navegador. Nenhuma compra foi enviada.',
      )
      return
    }
    sending.current = true
    setRecovering(false)
    setAttempt(saved)
    purchase.mutate(saved)
  }
  return (
    <main className="container commerce-page">
      <p className="eyebrow">Revise cada detalhe da sua coleção</p>
      <h1>Pagamento</h1>
      <p className="muted">Compra de demonstração, sem transferência real de fundos.</p>
      {message && (
        <p role="alert" className="form-message error">
          {message}
        </p>
      )}
      {attempt && (
        <section className="recovery-panel" aria-label="Recuperação de tentativa">
          <h2>Verificando sua tentativa</h2>
          <p>Ela mantém a mesma identificação para evitar outra compra em caso de reenvio.</p>
          {recovery.isFetching && <p role="status">Consultando o pedido…</p>}
          {recovery.isError && (
            <>
              <p>
                Não foi possível recuperar a resposta neste momento. Seus itens serão preservados.
              </p>
              <Button onClick={() => void recovery.refetch()}>Verificar novamente</Button>
              <Button
                variant="outline"
                disabled={purchase.isPending || !connected}
                onClick={() => confirm(attempt)}
              >
                Reenviar mesma tentativa
              </Button>
            </>
          )}
        </section>
      )}
      {cart.isPending || wallets.isPending ? (
        <div className="cart-skeleton shimmer" aria-label="Carregando pagamento" />
      ) : cart.isError || wallets.isError ? (
        <p role="alert">{problemFrom(cart.error ?? wallets.error).message}</p>
      ) : !cart.data?.items.length && !attempt ? (
        <section className="empty-state">
          <h2>Seu carrinho está vazio</h2>
          <Link to="/carrinho" className="kurio-button">
            Voltar ao carrinho
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          <form
            className="profile-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              const result = orderInputSchema.safeParse({
                customer: { name: draft.name, email: draft.email, phone: draft.phone },
                walletId: selected?.id ?? '',
                walletVersion: selected?.version ?? 1,
                network,
                quoteVersion: cart.data?.quote.version ?? '',
                agreed: draft.agreed,
              })
              if (!result.success) {
                setErrors(fieldErrors(result.error))
                setMessage('Confira os dados do colecionador e a revisão.')
                return
              }
              if (!connected) {
                setMessage('Conecte a carteira escolhida para revisar o pedido.')
                return
              }
              setErrors({})
              quote.mutate()
            }}
          >
            <h2>Dados do colecionador</h2>
            <fieldset disabled={Boolean(attempt)} className="checkout-fields">
              <FormField
                label="Nome completo"
                value={draft.name}
                autoComplete="name"
                onChange={(event) => setField({ name: event.target.value })}
                error={errors['customer.name']}
              />
              <FormField
                label="E-mail do colecionador"
                type="email"
                error={errors['customer.email']}
                value={draft.email}
                autoComplete="email"
                onChange={(event) => setField({ email: event.target.value })}
              />
              <FormField
                label="Telefone do colecionador"
                type="tel"
                error={errors['customer.phone']}
                value={draft.phone}
                autoComplete="tel"
                onChange={(event) => setField({ phone: event.target.value })}
              />
            </fieldset>
            <h2>Carteira e rede</h2>
            <Link to="/carteiras" search={{ redirect: '/pagamento' }} className="text-link">
              Gerenciar carteiras
            </Link>
            {wallets.data?.length ? (
              <>
                <div className="form-field">
                  <label htmlFor="checkout-wallet">Carteira</label>
                  <select
                    id="checkout-wallet"
                    value={selected?.id ?? ''}
                    disabled={Boolean(attempt)}
                    onChange={(event) => {
                      const wallet = wallets.data.find((item) => item.id === event.target.value)
                      setField({ walletId: event.target.value, network: wallet?.network })
                    }}
                  >
                    {wallets.data.map((wallet) => (
                      <option value={wallet.id} key={wallet.id}>
                        {wallet.label} · {wallet.network}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="wallet-address">{selected?.address}</p>
                <div className="form-field">
                  <label htmlFor="checkout-network">Rede</label>
                  <select
                    id="checkout-network"
                    value={network}
                    disabled={Boolean(attempt)}
                    onChange={(event) =>
                      setField({ network: event.target.value as typeof network })
                    }
                  >
                    {networks.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
                {connected ? (
                  <>
                    <p role="status">Carteira conectada à rede {network}.</p>
                    <button
                      type="button"
                      className="text-link"
                      disabled={disconnect.isPending || purchase.isPending}
                      onClick={() => disconnect.mutate()}
                    >
                      Desconectar carteira
                    </button>
                  </>
                ) : (
                  <Button
                    type="button"
                    disabled={connect.isPending || !selected}
                    onClick={() => selected && connect.mutate({ id: selected.id, network })}
                  >
                    {connect.isPending ? 'Conectando…' : 'Conectar carteira simulada'}
                  </Button>
                )}
                {connect.isError && <p role="alert">{problemFrom(connect.error).message}</p>}
                {disconnect.isError && <p role="alert">{problemFrom(disconnect.error).message}</p>}
              </>
            ) : (
              <p>Cadastre uma carteira principal para continuar.</p>
            )}
            <label className="terms-field">
              <input
                type="checkbox"
                checked={draft.agreed}
                disabled={Boolean(attempt)}
                onChange={(event) => setField({ agreed: event.target.checked })}
              />
              Revisei meus dados e os valores desta compra simulada.
            </label>
            {errors.agreed && (
              <p role="alert" className="field-error">
                {errors.agreed}
              </p>
            )}
            {!attempt && (
              <Button type="submit" disabled={quote.isPending || !connected || cart.isFetching}>
                {quote.isPending
                  ? 'Revalidando…'
                  : review
                    ? 'Revisar valores atualizados'
                    : 'Revisar pedido'}
              </Button>
            )}
          </form>
          <div>
            {review && (
              <>
                <QuoteSummary cart={review} />
                {stale && (
                  <p role="alert" className="form-message error">
                    Preço, estoque, cupom ou taxas mudaram. Revise os valores e confirme novamente.
                  </p>
                )}
                {!attempt && (
                  <Button
                    className="confirm-purchase"
                    disabled={stale || !connected || cart.isFetching || purchase.isPending}
                    onClick={() => {
                      const result = orderInputSchema.safeParse({
                        customer: { name: draft.name, email: draft.email, phone: draft.phone },
                        walletId: selected?.id ?? '',
                        walletVersion: selected?.version ?? 1,
                        network,
                        quoteVersion: review.quote.version,
                        agreed: draft.agreed,
                      })
                      if (result.success) confirm(newAttempt(result.data))
                    }}
                  >
                    Confirmar compra simulada
                  </Button>
                )}
              </>
            )}
            {!review && cart.data && <QuoteSummary cart={cart.data} />}
          </div>
        </div>
      )}
    </main>
  )
}

export function CheckoutPage() {
  const session = useQuery(sessionOptions)
  return (
    <div className="kurio-app">
      <MarketHeader />
      {session.data?.user && <CheckoutForm key={session.data.user.id} user={session.data.user} />}
    </div>
  )
}
