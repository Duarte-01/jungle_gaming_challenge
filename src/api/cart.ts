import { api } from './client'
import type { Nft } from './catalog'

export interface CartItem {
  key: string
  nft: Nft
  editionId: string
  editionLabel: string
  quantity: number
  available: number
  lineTotalEth: string
}

export interface Quote {
  version: string
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export interface Cart {
  items: CartItem[]
  coupon: string | null
  couponProblem?: string
  quote: Quote
}

export interface Favorites {
  ids: string[]
  items: Nft[]
}
export async function getCart(signal?: AbortSignal) {
  return (await api.get<Cart>('/cart', { signal })).data
}
export async function addCartItem(input: { nftId: string; editionId: string; quantity: number }) {
  return (await api.post<Cart>('/cart/items', input)).data
}
export async function setCartQuantity(key: string, quantity: number) {
  return (await api.patch<Cart>(`/cart/items/${encodeURIComponent(key)}`, { quantity })).data
}
export async function removeCartItem(key: string) {
  return (await api.delete<Cart>(`/cart/items/${encodeURIComponent(key)}`)).data
}
export async function applyCoupon(code: string) {
  return (await api.post<Cart>('/cart/coupon', { code })).data
}
export async function removeCoupon() {
  return (await api.delete<Cart>('/cart/coupon')).data
}
export async function getFavorites(signal?: AbortSignal) {
  return (await api.get<Favorites>('/favorites', { signal })).data
}
export async function setFavorite(id: string, favorite: boolean) {
  return favorite
    ? (await api.put<Favorites>(`/favorites/${encodeURIComponent(id)}`)).data
    : (await api.delete<Favorites>(`/favorites/${encodeURIComponent(id)}`)).data
}
