import { Link } from '@tanstack/react-router'
import { defaultSearch } from '../api/catalog'

export function RouteError() {
  return (
    <main className="kurio-app">
      <section className="container empty-state" role="alert">
        <h1>Não foi possível abrir esta página</h1>
        <p>Confira sua conexão e tente novamente.</p>
        <button
          type="button"
          className="kurio-button"
          // A rejected React.lazy import remains cached after a boundary reset.
          // Reload also reactivates the mock worker after a suspended browser tab.
          onClick={() => window.location.reload()}
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
