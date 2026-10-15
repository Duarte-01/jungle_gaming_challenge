import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { defaultSearch, getCatalog } from '../api/catalog'
import { NftArt } from './nft-art'

export function RelatedNfts({ title = 'Mais desta coleção' }: { title?: string }) {
  const [position, setPosition] = useState(0)
  const catalog = useQuery({
    queryKey: ['nfts', defaultSearch],
    queryFn: ({ signal }) => getCatalog(defaultSearch, signal),
  })
  const pool = catalog.data?.items.slice(3) ?? []
  const items = pool.length
    ? Array.from(
        { length: Math.min(5, pool.length) },
        (_, index) => pool[(position + index) % pool.length],
      )
    : []
  return (
    <section className="related-nfts" aria-label={title}>
      <h2>{title}</h2>
      {catalog.isPending ? (
        <div className="shimmer related-skeleton" aria-label="Carregando coleção" />
      ) : catalog.isError ? (
        <p>Não foi possível carregar as sugestões.</p>
      ) : (
        <>
          <div className="related-grid">
            {items.map((nft) => (
              <article key={nft.id}>
                <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>
                  <NftArt src={nft.image} name={nft.name} />
                  <h3>{nft.name}</h3>
                  <p className="nft-price">{nft.priceEth} ETH</p>
                </Link>
              </article>
            ))}
          </div>
          <div className="collection-dots" aria-label="Mais itens da coleção">
            {[0, 2, 4].map((value) => (
              <button
                type="button"
                key={value}
                aria-label={`Grupo ${value / 2 + 1} da coleção`}
                aria-pressed={position === value}
                onClick={() => setPosition(value)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
