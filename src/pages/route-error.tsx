import { Link, useRouter } from '@tanstack/react-router'
import { defaultSearch } from '../api/catalog'

export function RouteError({ reset }: { reset: () => void }) {
  const router = useRouter()
  return (
    <main className="kurio-app">
      <section className="container empty-state" role="alert">
        <h1>Não foi possível abrir esta página</h1>
        <p>Confira sua conexão e tente novamente.</p>
        <button
          type="button"
          className="kurio-button"
          onClick={() => void router.invalidate().then(reset)}
        >
          Tentar novamente
        </button>
        <Link to="/" search={defaultSearch} className="text-link">
          Voltar ao mercado
        </Link>
      </section>
    </main>
  )
}
