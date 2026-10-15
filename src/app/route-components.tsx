import { lazy } from 'react'
export const SetupPage = lazy(() =>
  import('../pages/setup').then((module) => ({ default: module.SetupPage })),
)
export { HomePage } from '../pages/home'
export { NftDetailPage } from '../pages/nft-detail'
export const AuthPage = lazy(() =>
  import('../pages/auth').then((module) => ({ default: module.AuthPage })),
)
export const CartPage = lazy(() =>
  import('../pages/cart').then((module) => ({ default: module.CartPage })),
)
export const FavoritesPage = lazy(() =>
  import('../pages/favorites').then((module) => ({ default: module.FavoritesPage })),
)
export const ProfilePage = lazy(() =>
  import('../pages/profile').then((module) => ({ default: module.ProfilePage })),
)
export const WalletsPage = lazy(() =>
  import('../pages/wallets').then((module) => ({ default: module.WalletsPage })),
)
export const CheckoutPage = lazy(() =>
  import('../pages/checkout').then((module) => ({ default: module.CheckoutPage })),
)
export const ExplorerPage = lazy(() =>
  import('../pages/orders').then((module) => ({ default: module.ExplorerPage })),
)
export const OrderPage = lazy(() =>
  import('../pages/orders').then((module) => ({ default: module.OrderPage })),
)
export const OrdersPage = lazy(() =>
  import('../pages/orders').then((module) => ({ default: module.OrdersPage })),
)
