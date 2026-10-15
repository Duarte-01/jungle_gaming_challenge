import { delay, http, HttpResponse, type HttpResponseResolver } from 'msw'
import type { HealthResponse } from '../api/contracts'
import { catalogHandlers } from './catalog'
import { socketHandler } from './socket-handler'
import { publicReadHandlers } from './public-read'

function lazyResolver<T extends Record<string, HttpResponseResolver>>(
  load: () => Promise<T>,
  key: keyof T,
): HttpResponseResolver {
  return async (args) => (await load())[key](args)
}

const accountResolvers = () =>
  import('./account-handlers').then((module) => module.accountResolvers)
const cartResolvers = () => import('./cart-handlers').then((module) => module.cartResolvers)
const walletResolvers = () => import('./wallet-handlers').then((module) => module.walletResolvers)
const orderResolvers = () => import('./order-handlers').then((module) => module.orderResolvers)
const marketResolvers = () => import('./market-controls').then((module) => module.marketResolvers)

export const handlers = [
  http.post('/api/auth/register', lazyResolver(accountResolvers, 'POST /api/auth/register')),
  http.post('/api/auth/login', lazyResolver(accountResolvers, 'POST /api/auth/login')),
  http.post('/api/auth/logout', lazyResolver(accountResolvers, 'POST /api/auth/logout')),
  http.get('/api/profile', lazyResolver(accountResolvers, 'GET /api/profile')),
  http.patch('/api/profile', lazyResolver(accountResolvers, 'PATCH /api/profile')),
  http.put('/api/profile/password', lazyResolver(accountResolvers, 'PUT /api/profile/password')),
  http.get('/api/favorites', lazyResolver(accountResolvers, 'GET /api/favorites')),
  http.put('/api/favorites/:id', lazyResolver(accountResolvers, 'PUT /api/favorites/:id')),
  http.delete('/api/favorites/:id', lazyResolver(accountResolvers, 'DELETE /api/favorites/:id')),
  http.post('/api/testing/reset', lazyResolver(accountResolvers, 'POST /api/testing/reset')),
  http.get('/api/testing/scenario', lazyResolver(accountResolvers, 'GET /api/testing/scenario')),
  http.post(
    '/api/testing/session/expire',
    lazyResolver(accountResolvers, 'POST /api/testing/session/expire'),
  ),
  http.put('/api/testing/scenario', lazyResolver(accountResolvers, 'PUT /api/testing/scenario')),
  http.post('/api/cart/items', lazyResolver(cartResolvers, 'POST /api/cart/items')),
  http.patch('/api/cart/items/:key', lazyResolver(cartResolvers, 'PATCH /api/cart/items/:key')),
  http.delete('/api/cart/items/:key', lazyResolver(cartResolvers, 'DELETE /api/cart/items/:key')),
  http.post('/api/cart/coupon', lazyResolver(cartResolvers, 'POST /api/cart/coupon')),
  http.delete('/api/cart/coupon', lazyResolver(cartResolvers, 'DELETE /api/cart/coupon')),
  http.post('/api/quotes', lazyResolver(cartResolvers, 'POST /api/quotes')),
  http.get('/api/wallets', lazyResolver(walletResolvers, 'GET /api/wallets')),
  http.post('/api/wallets', lazyResolver(walletResolvers, 'POST /api/wallets')),
  http.patch('/api/wallets/:id', lazyResolver(walletResolvers, 'PATCH /api/wallets/:id')),
  http.get('/api/wallet-connection', lazyResolver(walletResolvers, 'GET /api/wallet-connection')),
  http.post(
    '/api/wallets/:id/connect',
    lazyResolver(walletResolvers, 'POST /api/wallets/:id/connect'),
  ),
  http.delete(
    '/api/wallet-connection',
    lazyResolver(walletResolvers, 'DELETE /api/wallet-connection'),
  ),
  http.post('/api/orders', lazyResolver(orderResolvers, 'POST /api/orders')),
  http.get('/api/orders', lazyResolver(orderResolvers, 'GET /api/orders')),
  http.get(
    '/api/orders/attempt/:key',
    lazyResolver(orderResolvers, 'GET /api/orders/attempt/:key'),
  ),
  http.get('/api/orders/:id', lazyResolver(orderResolvers, 'GET /api/orders/:id')),
  http.post('/api/testing/nfts/:id', lazyResolver(marketResolvers, 'POST /api/testing/nfts/:id')),
  http.post('/api/testing/pricing', lazyResolver(marketResolvers, 'POST /api/testing/pricing')),
  http.post(
    '/api/testing/orders/:id/settle',
    lazyResolver(marketResolvers, 'POST /api/testing/orders/:id/settle'),
  ),
  http.post(
    '/api/testing/realtime/disconnect',
    lazyResolver(marketResolvers, 'POST /api/testing/realtime/disconnect'),
  ),
  http.post(
    '/api/testing/events/replay',
    lazyResolver(marketResolvers, 'POST /api/testing/events/replay'),
  ),
  ...publicReadHandlers,
  ...catalogHandlers,
  http.get('/api/health', async () => {
    await delay(200)
    return HttpResponse.json<HealthResponse>({ status: 'ok', service: 'jungle-marketplace-mock' })
  }),
  socketHandler,
]
