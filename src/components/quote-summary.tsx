import type { Cart } from '../api/cart'
import { NftImage } from './nft-image'

export function QuoteSummary({ cart }: { cart: Cart }) {
  return (
    <aside className="order-summary" aria-label="Resumo do pedido">
      <h2>Seus NFTs</h2>
      <ul className="review-items">
        {cart.items.map((item) => (
          <li key={item.key}>
            <NftImage src={item.nft.image} alt="" width={70} height={70} />
            <span>
              {item.quantity} × {item.nft.name}
            </span>
            <strong>{item.lineTotalEth} ETH</strong>
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{cart.quote.subtotalEth} ETH</dd>
        </div>
        <div>
          <dt>Desconto</dt>
          <dd>−{cart.quote.discountEth} ETH</dd>
        </div>
        <div>
          <dt>Taxa de rede</dt>
          <dd>{cart.quote.networkFeeEth} ETH</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd data-testid="checkout-total">{cart.quote.totalEth} ETH</dd>
        </div>
      </dl>
      {cart.coupon && <p>Cupom: {cart.coupon}</p>}
    </aside>
  )
}
