import {
  SetupPage,
  HomePage,
  NftDetailPage,
  AuthPage,
  CartPage,
  FavoritesPage,
  ProfilePage,
  WalletsPage,
  CheckoutPage,
  ExplorerPage,
  OrderPage,
  OrdersPage,
} from './route-components'
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { defaultSearch, validateCatalogSearch } from '../api/catalog'
import { requireSession } from '../auth/guard'
import { SessionSync } from '../auth/session-sync'
import { safeReturnTo } from '../domain/account-helpers'
import { RouteError } from '../pages/route-error'
import { MarketRealtime } from '../realtime/market-realtime'

const rootRoute = createRootRoute({
  errorComponent: RouteError,
  component: () => (
    <>
      <SessionSync />
      <MarketRealtime />
      <Outlet />
    </>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-3xl font-bold">Página não encontrada</h1>
      <Link to="/" search={defaultSearch} className="underline focus-visible:outline-2">
        Voltar ao início
      </Link>
    </main>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
})
const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup',
  component: SetupPage,
})
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailPage,
})
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (input: Record<string, unknown>) => ({ redirect: safeReturnTo(input.redirect) }),
  component: () => <AuthPage mode="login" />,
})
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastro',
  validateSearch: (input: Record<string, unknown>) => ({ redirect: safeReturnTo(input.redirect) }),
  component: () => <AuthPage mode="register" />,
})
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: CartPage,
})
const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favoritos',
  beforeLoad: requireSession,
  component: FavoritesPage,
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  beforeLoad: requireSession,
  component: ProfilePage,
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carteiras',
  validateSearch: (input: Record<string, unknown>) => ({ redirect: safeReturnTo(input.redirect) }),
  beforeLoad: requireSession,
  component: WalletsPage,
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  beforeLoad: requireSession,
  component: CheckoutPage,
})
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pedidos',
  beforeLoad: requireSession,
  component: OrdersPage,
})
const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pedidos/$orderId',
  beforeLoad: requireSession,
  component: OrderPage,
})
const explorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explorador/$reference',
  beforeLoad: requireSession,
  component: ExplorerPage,
})
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    setupRoute,
    nftRoute,
    loginRoute,
    registerRoute,
    cartRoute,
    favoritesRoute,
    profileRoute,
    walletsRoute,
    checkoutRoute,
    ordersRoute,
    orderRoute,
    explorerRoute,
  ]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
