import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { SetupPage } from '../pages/setup'
import { HomePage } from '../pages/home'
import { NftDetailPage } from '../pages/nft-detail'
import { defaultSearch, validateCatalogSearch } from '../api/catalog'
import { AuthPage } from '../pages/auth'
import { CartPage } from '../pages/cart'
import { FavoritesPage } from '../pages/favorites'
import { ProfilePage } from '../pages/profile'
import { requireSession } from '../auth/guard'
import { SessionSync } from '../auth/session-sync'
import { safeReturnTo } from '../domain/account'
import { RouteError } from '../pages/route-error'

const rootRoute = createRootRoute({
  errorComponent: RouteError,
  component: () => (
    <>
      <SessionSync />
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
  ]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
