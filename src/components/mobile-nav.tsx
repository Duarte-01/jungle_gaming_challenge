import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, UserRound } from 'lucide-react'
import { defaultSearch } from '../api/catalog'

export function MobileNav({
  active = 'home',
}: {
  active?: 'home' | 'favorites' | 'cart' | 'profile'
}) {
  return (
    <nav className="mobile-nav" aria-label="Navegação mobile">
      <Link
        to="/"
        search={defaultSearch}
        aria-label="Início"
        aria-current={active === 'home' ? 'page' : undefined}
      >
        <Home />
      </Link>
      <Link
        to="/favoritos"
        aria-label="Favoritos"
        aria-current={active === 'favorites' ? 'page' : undefined}
      >
        <Heart />
      </Link>
      <Link
        to="/"
        search={defaultSearch}
        hash="catalogo"
        className="mobile-explore"
        aria-label="Explorar NFTs"
      >
        <ScanLine />
      </Link>
      <Link
        to="/carrinho"
        aria-label="Carrinho"
        aria-current={active === 'cart' ? 'page' : undefined}
      >
        <ShoppingCart />
      </Link>
      <Link
        to="/perfil"
        aria-label="Meu perfil"
        aria-current={active === 'profile' ? 'page' : undefined}
      >
        <UserRound />
      </Link>
    </nav>
  )
}
