import type { Cart, CartItem } from '../api/cart'
import { ethToWei, weiToEth } from '../lib/eth'
import { emptyCart, type Database } from './database'
import { ApiFault } from './http'

export function validateCoupon(code: string, database?: Database) {
  if (code === 'EXPIRED' || database?.expiredCoupons.includes(code))
    throw new ApiFault(422, 'COUPON_EXPIRED', 'Este cupom expirou.', {
      coupon: 'Este cupom expirou.',
    })
  if (code !== 'KURIO10')
    throw new ApiFault(422, 'COUPON_INVALID', 'Cupom inválido.', { coupon: 'Cupom inválido.' })
}

export function cartSnapshot(database: Database, owner: string): Cart {
  const cart = (database.carts[owner] ??= emptyCart())
  const items: CartItem[] = cart.items.map((item) => {
    const nft = database.nfts.find((entry) => entry.id === item.nftId)
    const edition = nft?.editions.find((entry) => entry.id === item.editionId)
    if (!nft || !edition)
      throw new ApiFault(
        409,
        'EDITION_UNAVAILABLE',
        'Uma edição do carrinho não está mais disponível.',
      )
    return {
      key: `${item.nftId}:${item.editionId}`,
      nft,
      editionId: item.editionId,
      editionLabel: edition.label,
      quantity: item.quantity,
      available: edition.available,
      lineTotalEth: weiToEth(ethToWei(nft.priceEth) * BigInt(item.quantity)),
    }
  })
  const subtotal = items.reduce((total, item) => total + ethToWei(item.lineTotalEth), 0n)
  const couponExpired = Boolean(cart.coupon && database.expiredCoupons.includes(cart.coupon))
  const discount = cart.coupon === 'KURIO10' && !couponExpired ? subtotal / 10n : 0n
  const fee =
    BigInt(new Set(items.map((item) => item.nft.network)).size) * ethToWei(database.networkFeeEth)
  return {
    items,
    coupon: cart.coupon,
    ...(couponExpired ? { couponProblem: 'O cupom expirou. Remova-o para continuar.' } : {}),
    quote: {
      version: `q2:${database.pricingVersion}:${cart.revision}:${items.map((item) => `${item.key}:${item.nft.version}:${item.quantity}`).join('|')}`,
      subtotalEth: weiToEth(subtotal),
      discountEth: weiToEth(discount),
      networkFeeEth: weiToEth(fee),
      totalEth: weiToEth(subtotal - discount + fee),
    },
  }
}
