import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { Nft } from '../api/catalog'
import { useFavorites } from '../hooks/use-favorites'

export function FavoriteButton({ nft }: { nft: Nft }) {
  const { favorites, mutation, user, sessionLoading } = useFavorites()
  const label = `Favoritar ${nft.name}`
  if (sessionLoading)
    return (
      <button
        type="button"
        className="favorite-button"
        disabled
        aria-label={`Carregando favoritos de ${nft.name}`}
      >
        <Heart size={20} aria-hidden="true" />
      </button>
    )
  if (!user)
    return (
      <Link
        to="/login"
        search={{ redirect: `${window.location.pathname}${window.location.search}` }}
        className="favorite-button"
        aria-label={`Entrar para favoritar ${nft.name}`}
      >
        <Heart size={20} aria-hidden="true" />
      </Link>
    )
  const favorite = favorites.data?.ids.includes(nft.id) ?? false
  return (
    <div className="favorite-control">
      <button
        type="button"
        className="favorite-button"
        aria-label={label}
        aria-pressed={favorite}
        disabled={favorites.isPending || mutation.isPending}
        onClick={() => mutation.mutate({ nft, favorite: !favorite })}
      >
        <Heart size={20} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </div>
  )
}
