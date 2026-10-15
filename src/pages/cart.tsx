import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { defaultSearch } from '../api/catalog'
import type { CartItem } from '../api/cart'
import { problemFrom } from '../api/account'
import { useCart } from '../hooks/use-cart'
import { MarketHeader } from '../components/market-header'
import { NftArt } from '../components/nft-art'
import { Button } from '../components/ui/button'

function CartRow({
  item,
  busy,
  onQuantity,
  onRemove,
}: {
  item: CartItem
  busy: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [error, setError] = useState('')
  return (
    <article className="cart-item" aria-label={item.nft.name}>
      <NftArt src={item.nft.image} name={item.nft.name} />
      <div className="cart-item-content">
        <Link to="/nfts/$nftId" params={{ nftId: item.nft.id }}>
          <h2>{item.nft.name}</h2>
        </Link>
        <p className="muted">
          {item.editionLabel} · {item.nft.network}
        </p>
        <p className="nft-price">{item.nft.priceEth} ETH</p>
        {item.quantity > item.available && (
          <p role="alert">A disponibilidade mudou. Restam {item.available} unidades.</p>
        )}
        <form
          className="quantity-form"
          onSubmit={(event) => {
            event.preventDefault()
            const value = Number(quantity)
            if (!Number.isInteger(value) || value < 1 || value > item.available) {
              setError(`Use uma quantidade inteira entre 1 e ${item.available}.`)
              return
            }
            setError('')
            onQuantity(value)
          }}
        >
          <button
            type="button"
            aria-label={`Diminuir quantidade de ${item.nft.name}`}
            disabled={busy || item.quantity <= 1}
            onClick={() => onQuantity(item.quantity - 1)}
          >
            <Minus size={16} />
          </button>
          <label className="sr-only" htmlFor={`quantity-${item.key}`}>
            Quantidade de {item.nft.name}
          </label>
          <input
            id={`quantity-${item.key}`}
            name="quantity"
            type="number"
            min={1}
            max={item.available}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={busy || !item.available}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `quantity-error-${item.key}` : undefined}
          />
          <button
            type="button"
            aria-label={`Aumentar quantidade de ${item.nft.name}`}
            disabled={busy || item.quantity >= item.available}
            onClick={() => onQuantity(item.quantity + 1)}
          >
            <Plus size={16} />
          </button>
          <button
            type="submit"
            className="text-link"
            disabled={busy || !item.available}
            aria-label={`Atualizar quantidade de ${item.nft.name}`}
          >
            Atualizar
          </button>
        </form>
        {error && (
          <p className="field-error" id={`quantity-error-${item.key}`} role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="cart-item-end">
        <p>{item.lineTotalEth} ETH</p>
        <button
          type="button"
          className="icon-button"
          aria-label={`Remover ${item.nft.name}`}
          onClick={onRemove}
          disabled={busy}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  )
}

export function CartPage() {
  const { cart, mutation, session } = useCart()
  const [coupon, setCoupon] = useState('')
  return (
    <div className="kurio-app">
      <MarketHeader />
      <main className="container commerce-page">
        <p className="eyebrow">Sua coleção está crescendo</p>
        <h1>Carrinho de NFTs</h1>
        {cart.isPending ? (
          <div className="cart-skeleton shimmer" aria-label="Carregando carrinho" />
        ) : cart.isError ? (
          <div role="alert">
            <p>{problemFrom(cart.error).message}</p>
            <button type="button" className="kurio-button" onClick={() => void cart.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : !cart.data?.items.length ? (
          <section className="empty-state">
            <h2>Seu carrinho está vazio</h2>
            <p>Explore o mercado e encontre sua próxima peça.</p>
            <Link to="/" search={defaultSearch} className="kurio-button">
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section aria-label="Itens do carrinho" aria-busy={mutation.isPending}>
              {cart.data.items.map((item) => (
                <CartRow
                  key={`${item.key}:${item.quantity}`}
                  item={item}
                  busy={mutation.isPending}
                  onQuantity={(quantity) =>
                    mutation.mutate({ action: 'quantity', key: item.key, quantity })
                  }
                  onRemove={() => mutation.mutate({ action: 'remove', key: item.key })}
                />
              ))}
            </section>
            <aside className="order-summary" aria-label="Resumo do carrinho">
              <h2>Resumo da coleção</h2>
              {cart.data.couponProblem && <p role="alert">{cart.data.couponProblem}</p>}
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd data-testid="cart-subtotal">{cart.data.quote.subtotalEth} ETH</dd>
                </div>
                <div>
                  <dt>Desconto</dt>
                  <dd data-testid="cart-discount">−{cart.data.quote.discountEth} ETH</dd>
                </div>
                <div>
                  <dt>Taxa de rede</dt>
                  <dd>{cart.data.quote.networkFeeEth} ETH</dd>
                </div>
                <div className="summary-total">
                  <dt>Total</dt>
                  <dd data-testid="cart-total">{cart.data.quote.totalEth} ETH</dd>
                </div>
              </dl>
              {cart.data.coupon ? (
                <div className="applied-coupon">
                  <p>
                    Cupom aplicado: <strong>{cart.data.coupon}</strong>
                  </p>
                  <button
                    type="button"
                    className="text-link"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ action: 'remove-coupon' })}
                  >
                    Remover cupom
                  </button>
                </div>
              ) : (
                <form
                  className="coupon-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    mutation.mutate({ action: 'coupon', code: coupon })
                  }}
                >
                  <label htmlFor="coupon">Cupom de desconto</label>
                  <div>
                    <input
                      id="coupon"
                      name="coupon"
                      value={coupon}
                      onChange={(event) => setCoupon(event.target.value)}
                      maxLength={30}
                      required
                    />
                    <button type="submit" className="kurio-button" disabled={mutation.isPending}>
                      Aplicar cupom
                    </button>
                  </div>
                </form>
              )}
              {!session.data?.user && (
                <Link to="/login" search={{ redirect: '/carrinho' }} className="text-link">
                  Entre para continuar com sua coleção
                </Link>
              )}
              <Button asChild>
                <Link to="/pagamento">Continuar para pagamento</Link>
              </Button>
            </aside>
          </div>
        )}
        {mutation.isError && (
          <p role="alert" className="form-message error">
            {problemFrom(mutation.error).message}
          </p>
        )}
        {mutation.isSuccess && (
          <p role="status" className="form-message">
            Carrinho atualizado.
          </p>
        )}
      </main>
    </div>
  )
}
