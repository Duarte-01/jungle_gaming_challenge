import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, LogIn, LogOut, Search, ShoppingCart, UserRound } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { logout, problemFrom } from '../api/account'
import { defaultSearch, type CatalogSearch } from '../api/catalog'
import { forgetSession } from '../auth/session-cache'
import { useCart } from '../hooks/use-cart'
import { sessionGeneration } from '../auth/events'

export function AccountActions({ catalogSearch }: { catalogSearch?: CatalogSearch }) {
  const { session, cart } = useCart()
  const navigate = useNavigate()
  const signOut = useMutation({
    mutationKey: ['account-logout'],
    gcTime: 0,
    mutationFn: logout,
    onMutate: () => ({ generation: sessionGeneration() }),
    onSuccess: async (_data, _input, context) => {
      if (context?.generation !== sessionGeneration()) return
      await forgetSession()
      await navigate({ to: '/', search: defaultSearch })
    },
  })
  const count = cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
  return (
    <div className="header-actions">
      <Link
        to="/"
        search={catalogSearch ?? defaultSearch}
        hash="busca"
        onClick={() =>
          requestAnimationFrame(() => document.getElementById('catalog-search')?.focus())
        }
        aria-label="Buscar no mercado"
        className="header-search"
      >
        <Search size={22} />
      </Link>
      <Link to="/carrinho" aria-label={`Carrinho, ${count} itens`}>
        <ShoppingCart size={20} />
        {count > 0 && <span className="cart-badge">{count}</span>}
      </Link>
      {session.data?.user ? (
        <>
          <Link to="/perfil" aria-label="Minha conta">
            <UserRound size={18} />
            {session.data.user.name.split(' ')[0]}
          </Link>
          <button
            type="button"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
            aria-label="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        </>
      ) : (
        <Link
          to="/login"
          search={{ redirect: `${window.location.pathname}${window.location.search}` }}
          className="kurio-button"
        >
          <LogIn size={16} />
          Entrar
        </Link>
      )}
      {signOut.isError && <p role="alert">{problemFrom(signOut.error).message}</p>}
    </div>
  )
}

export function MarketHeader({
  title = 'KURIO',
  active = 'market',
}: {
  title?: string
  active?: 'home' | 'market'
}) {
  return (
    <>
      <header className="market-header desktop-header container">
        <Link to="/" search={defaultSearch} className="brand">
          KURIO
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/" search={defaultSearch} aria-current={active === 'home' ? 'page' : undefined}>
            Início
          </Link>
          <Link
            to="/"
            search={defaultSearch}
            hash="catalogo"
            aria-current={active === 'market' ? 'page' : undefined}
          >
            Mercado
          </Link>
          <Link to="/" search={defaultSearch} hash="criadores">
            Criadores
          </Link>
          <Link to="/" search={defaultSearch} hash="aprenda">
            Aprenda
          </Link>
        </nav>
        <AccountActions />
      </header>
      {title && (
        <div className="mobile-page-header container">
          <Link to="/" search={defaultSearch} aria-label="Voltar ao mercado">
            <ChevronLeft size={20} />
          </Link>
          <p>{title}</p>
          <div className="mobile-account-actions">
            <AccountActions />
          </div>
        </div>
      )}
    </>
  )
}
