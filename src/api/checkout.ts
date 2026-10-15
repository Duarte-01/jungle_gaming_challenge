import { api } from './client'
import type { Cart } from './cart'
import type { Order, OrderInput, Wallet, WalletConnection, WalletInput } from '../domain/checkout'

export async function getWallets(signal?: AbortSignal) {
  return (await api.get<Wallet[]>('/wallets', { signal })).data
}
export async function saveWallet(input: WalletInput, id?: string) {
  return id
    ? (await api.patch<Wallet>(`/wallets/${encodeURIComponent(id)}`, input)).data
    : (await api.post<Wallet>('/wallets', input)).data
}
export async function getConnection(signal?: AbortSignal) {
  return (await api.get<WalletConnection | null>('/wallet-connection', { signal })).data
}
export async function connectWallet(id: string, network: Wallet['network']) {
  return (
    await api.post<WalletConnection>(`/wallets/${encodeURIComponent(id)}/connect`, { network })
  ).data
}
export async function disconnectWallet() {
  await api.delete('/wallet-connection')
}
export async function getQuote() {
  return (await api.post<Cart>('/quotes')).data
}
export async function createOrder(input: OrderInput, key: string) {
  return (
    await api.post<Order>('/orders', input, { headers: { 'Idempotency-Key': key }, timeout: 700 })
  ).data
}
export async function getOrder(id: string, signal?: AbortSignal) {
  return (await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data
}
export async function getAttempt(key: string, signal?: AbortSignal) {
  return (await api.get<Order>(`/orders/attempt/${encodeURIComponent(key)}`, { signal })).data
}
export async function getOrders(signal?: AbortSignal) {
  return (await api.get<Order[]>('/orders', { signal })).data
}
