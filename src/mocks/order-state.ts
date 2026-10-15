import type { OrderStatus, OrderInput } from '../domain/checkout'
import { cartSnapshot, validateCoupon } from './cart-state'
import { appendEvent } from './event-bus'
import { emptyCart, readDatabase, transaction, type Database } from './database'
import { ApiFault } from './http'

export function settleOrder(
  database: Database,
  id: string,
  outcome?: Exclude<OrderStatus, 'pending'>,
) {
  const saved = database.orders[id]
  if (!saved || saved.order.status !== 'pending') return
  const order = saved.order
  order.status = outcome ?? saved.outcome
  order.version++
  order.settledAt = Date.now()
  if (order.status === 'confirmed') {
    order.transactionReference = `0x${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`
    const cart = (database.carts[`user:${order.userId}`] ??= emptyCart())
    for (const bought of order.snapshot.items) {
      const current = cart.items.find(
        (item) => item.nftId === bought.nft.id && item.editionId === bought.editionId,
      )
      if (current) current.quantity = Math.max(0, current.quantity - bought.quantity)
    }
    cart.items = cart.items.filter((item) => item.quantity > 0)
    if (!cart.items.length) cart.coupon = null
    cart.revision++
  } else {
    order.refusalReason =
      'O pagamento foi recusado pela carteira simulada. Nenhum valor foi cobrado.'
    for (const bought of order.snapshot.items) {
      const nft = database.nfts.find((item) => item.id === bought.nft.id)
      const edition = nft?.editions.find((item) => item.id === bought.editionId)
      if (nft && edition) {
        edition.available += bought.quantity
        nft.version++
        appendEvent(
          database,
          'nft.updated',
          nft.id,
          nft.version,
          undefined,
          'reservation',
          order.userId,
        )
      }
    }
  }
  appendEvent(database, 'order.updated', id, order.version, order.userId)
}

export async function settleDueOrders() {
  await transaction((database) => {
    for (const saved of Object.values(database.orders))
      if (!saved.held && saved.order.status === 'pending' && saved.resolveAt <= Date.now())
        settleOrder(database, saved.order.id)
  })
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()
export async function scheduleOrders() {
  const database = await readDatabase()
  for (const saved of Object.values(database.orders)) {
    if (saved.held || saved.order.status !== 'pending' || timers.has(saved.order.id)) continue
    const id = saved.order.id
    timers.set(
      id,
      setTimeout(
        () => {
          timers.delete(id)
          void settleDueOrders()
        },
        Math.max(0, saved.resolveAt - Date.now()),
      ),
    )
  }
}

export function validateOrderCart(database: Database, userId: string, input: OrderInput) {
  const cart = cartSnapshot(database, `user:${userId}`)
  if (!cart.items.length) throw new ApiFault(409, 'EMPTY_CART', 'Seu carrinho está vazio.')
  if (cart.coupon) validateCoupon(cart.coupon, database)
  if (cart.items.some((item) => item.quantity > item.available))
    throw new ApiFault(
      409,
      'AVAILABILITY_CONFLICT',
      'A disponibilidade mudou. Revise os itens do carrinho.',
    )
  if (cart.quote.version !== input.quoteVersion)
    throw new ApiFault(409, 'QUOTE_CHANGED', 'Os valores mudaram. Revise e confirme novamente.')
  return cart
}
