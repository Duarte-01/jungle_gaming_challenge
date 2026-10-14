import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { SetupPage } from '../pages/setup'
import { HomePage } from '../pages/home'
import { NftDetailPage } from '../pages/nft-detail'
import { defaultSearch, validateCatalogSearch } from '../api/catalog'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-3xl font-bold">Página não encontrada</h1>
      <Link to="/" search={defaultSearch} className="underline focus-visible:outline-2">Voltar ao início</Link>
    </main>
  ),
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: validateCatalogSearch, component: HomePage })
const setupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/setup', component: SetupPage })
const nftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nfts/$nftId', component: NftDetailPage })
export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, setupRoute, nftRoute]) })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
