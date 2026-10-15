import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { cartSnapshot, validateCoupon } from './cart-state'
import { emptyCart, transaction } from './database'
import { ApiFault, parseBody, respond } from './http'
import { cartOwner, sessionUser } from './session'

const quantitySchema = z.number().int('Use uma quantidade inteira.').min(1).max(1000)
function assertMutationAvailable() {
  if (localStorage.getItem('kurio:scenario') === 'cart-error')
    throw new ApiFault(
      503,
      'TRANSIENT_FAILURE',
      'Não foi possível atualizar o carrinho. Tente novamente.',
    )
}

export const cartHandlers = [
  http.get('/api/cart', ({ cookies }) =>
    respond(() =>
      transaction((database) =>
        HttpResponse.json(cartSnapshot(database, cartOwner(database, cookies))),
      ),
    ),
  ),
  http.post('/api/cart/items', ({ cookies, request }) =>
    respond(async () => {
      const input = await parseBody(
        request,
        z.object({
          nftId: z.string().min(1),
          editionId: z.string().min(1),
          quantity: quantitySchema,
        }),
      )
      return transaction((database) => {
        const owner = cartOwner(database, cookies)
        assertMutationAvailable()
        const nft = database.nfts.find((entry) => entry.id === input.nftId)
        if (!nft) throw new ApiFault(404, 'NOT_FOUND', 'NFT não encontrado.')
        const edition = nft.editions.find((entry) => entry.id === input.editionId)
        if (!edition) throw new ApiFault(404, 'EDITION_UNAVAILABLE', 'Edição não encontrada.')
        const cart = (database.carts[owner] ??= emptyCart())
        const existing = cart.items.find(
          (entry) => entry.nftId === input.nftId && entry.editionId === input.editionId,
        )
        const quantity = input.quantity + (existing?.quantity ?? 0)
        if (quantity > edition.available)
          throw new ApiFault(
            409,
            'AVAILABILITY_CONFLICT',
            `Há apenas ${edition.available} unidades disponíveis desta edição.`,
            { quantity: 'A quantidade solicitada supera a disponibilidade.' },
          )
        if (existing) existing.quantity = quantity
        else cart.items.push(input)
        cart.revision++
        return HttpResponse.json(cartSnapshot(database, owner), { status: 201 })
      })
    }),
  ),
  http.patch('/api/cart/items/:key', ({ params, cookies, request }) =>
    respond(async () => {
      const { quantity } = await parseBody(request, z.object({ quantity: quantitySchema }))
      return transaction((database) => {
        const owner = cartOwner(database, cookies)
        assertMutationAvailable()
        const cart = (database.carts[owner] ??= emptyCart())
        const item = cart.items.find((entry) => `${entry.nftId}:${entry.editionId}` === params.key)
        if (!item) throw new ApiFault(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
        const edition = database.nfts
          .find((nft) => nft.id === item.nftId)
          ?.editions.find((entry) => entry.id === item.editionId)
        if (!edition || quantity > edition.available)
          throw new ApiFault(
            409,
            'AVAILABILITY_CONFLICT',
            'A quantidade supera a disponibilidade atual.',
          )
        item.quantity = quantity
        cart.revision++
        return HttpResponse.json(cartSnapshot(database, owner))
      })
    }),
  ),
  http.delete('/api/cart/items/:key', ({ params, cookies }) =>
    respond(() =>
      transaction((database) => {
        const owner = cartOwner(database, cookies)
        assertMutationAvailable()
        const cart = (database.carts[owner] ??= emptyCart())
        const index = cart.items.findIndex(
          (entry) => `${entry.nftId}:${entry.editionId}` === params.key,
        )
        if (index === -1) throw new ApiFault(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
        cart.items.splice(index, 1)
        cart.revision++
        return HttpResponse.json(cartSnapshot(database, owner))
      }),
    ),
  ),
  http.post('/api/cart/coupon', ({ cookies, request }) =>
    respond(async () => {
      const { code } = await parseBody(
        request,
        z.object({ code: z.string().trim().toUpperCase().min(1).max(30) }),
      )
      return transaction((database) => {
        const owner = cartOwner(database, cookies)
        assertMutationAvailable()
        validateCoupon(code)
        const cart = (database.carts[owner] ??= emptyCart())
        cart.coupon = code
        cart.revision++
        return HttpResponse.json(cartSnapshot(database, owner))
      })
    }),
  ),
  http.delete('/api/cart/coupon', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        const owner = cartOwner(database, cookies)
        assertMutationAvailable()
        const cart = (database.carts[owner] ??= emptyCart())
        cart.coupon = null
        cart.revision++
        return HttpResponse.json(cartSnapshot(database, owner))
      }),
    ),
  ),
  http.post('/api/quotes', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        const user = sessionUser(database, cookies)!
        const cart = cartSnapshot(database, `user:${user.id}`)
        if (!cart.items.length) throw new ApiFault(409, 'EMPTY_CART', 'Seu carrinho está vazio.')
        if (cart.items.some((item) => item.quantity > item.available))
          throw new ApiFault(409, 'AVAILABILITY_CONFLICT', 'Revise a disponibilidade dos itens.')
        if (cart.coupon) validateCoupon(cart.coupon)
        return HttpResponse.json(cart.quote)
      }),
    ),
  ),
]
