import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { SetupPage } from '../pages/setup'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-3xl font-bold">Página não encontrada</h1>
      <Link to="/" className="underline focus-visible:outline-2">Voltar ao início</Link>
    </main>
  ),
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: SetupPage })
export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
