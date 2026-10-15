import { Link } from '@tanstack/react-router'
import { defaultSearch } from '../api/catalog'
import { problemFrom } from '../api/account'
import { useFavorites } from '../hooks/use-favorites'
import { MarketHeader } from '../components/market-header'
import { NftArt } from '../components/nft-art'
import { FavoriteButton } from '../components/favorite-button'

export function FavoritesPage() {
  const { favorites } = useFavorites()
  return (
    <div className="kurio-app">
      <MarketHeader />
      <main className="container commerce-page">
        <p className="eyebrow">Arte que chamou sua atenção</p>
        <h1>Meus favoritos</h1>
        {favorites.isPending ? (
          <div className="cart-skeleton shimmer" aria-label="Carregando favoritos" />
        ) : favorites.isError ? (
          <div role="alert">
            <p>{problemFrom(favorites.error).message}</p>
            <button type="button" className="kurio-button" onClick={() => void favorites.refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : !favorites.data?.items.length ? (
          <section className="empty-state">
            <h2>Você ainda não tem favoritos</h2>
            <Link to="/" search={defaultSearch} className="kurio-button">
              Explorar NFTs
            </Link>
          </section>
        ) : (
          <div className="nft-grid favorites-grid">
            {favorites.data.items.map((nft) => (
              <article className="nft-card" key={nft.id}>
                <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>
                  <NftArt src={nft.image} name={nft.name} />
                  <h2>{nft.name}</h2>
                  <p className="nft-price">{nft.priceEth} ETH</p>
                </Link>
                <FavoriteButton nft={nft} />
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
