import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SignOutButton } from './market-header'
import {
  CircleHelp,
  Download,
  Heart,
  MapPin,
  ShoppingCart,
  TrendingUp,
  UserRound,
} from 'lucide-react'

export function AccountSidebar({
  active,
}: {
  active: 'profile' | 'wallets' | 'orders' | 'favorites'
}) {
  const [notice, setNotice] = useState('')
  return (
    <aside className="account-sidebar">
      <p className="sidebar-title">Meu perfil</p>
      <nav aria-label="Menu do colecionador">
        <Link to="/perfil" aria-current={active === 'profile' ? 'page' : undefined}>
          <UserRound size={17} />
          Dados do perfil
        </Link>
        <Link
          to="/carteiras"
          search={{ redirect: '/perfil' }}
          aria-current={active === 'wallets' ? 'page' : undefined}
        >
          <MapPin size={17} />
          Carteiras
        </Link>
        <Link to="/pedidos" aria-current={active === 'orders' ? 'page' : undefined}>
          <ShoppingCart size={17} />
          Atividade
        </Link>
        <Link to="/favoritos" aria-current={active === 'favorites' ? 'page' : undefined}>
          <Heart size={17} />
          Lista de interesse
        </Link>
        {[
          { label: 'Ofertas', icon: TrendingUp },
          { label: 'Arquivos baixados', icon: Download },
          { label: 'Suporte', icon: CircleHelp },
        ].map(({ label, icon: Icon }) => (
          <button
            type="button"
            key={label}
            onClick={() => setNotice(`${label}: esta área não faz parte da demonstração.`)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      <SignOutButton sidebar />
      {notice && <p role="status">{notice}</p>}
    </aside>
  )
}
