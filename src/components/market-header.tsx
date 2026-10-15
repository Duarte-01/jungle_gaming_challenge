import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn, LogOut, ShoppingCart, UserRound } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { logout, problemFrom } from '../api/account'
import { defaultSearch } from '../api/catalog'
import { forgetSession } from '../auth/session-cache'
import { useCart } from '../hooks/use-cart'
import { sessionGeneration } from '../auth/events'

export function AccountActions() {
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

export function MarketHeader() {
  return (
    <header className="market-header container">
      <Link to="/" search={defaultSearch} className="brand">
        KURIO
      </Link>
      <nav aria-label="Conta e catálogo">
        <Link to="/" search={defaultSearch}>
          Mercado
        </Link>
        <Link to="/favoritos">Favoritos</Link>
        <Link to="/carteiras" search={{ redirect: '/' }}>
          Carteiras
        </Link>
        <Link to="/pedidos">Pedidos</Link>
      </nav>
      <AccountActions />
    </header>
  )
}
