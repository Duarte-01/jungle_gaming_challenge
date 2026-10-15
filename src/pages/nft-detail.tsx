import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { isAxiosError } from 'axios'
import { ChevronLeft, Minus, Plus, Search, ShoppingCart, Star, X } from 'lucide-react'
import { defaultSearch, getNft } from '../api/catalog'
import { NftArt } from '../components/nft-art'
import { FavoriteButton } from '../components/favorite-button'
import { MarketHeader } from '../components/market-header'
import { MarketFooter } from '../components/market-footer'
import { RelatedNfts } from '../components/related-nfts'
import { useCart } from '../hooks/use-cart'
import { problemFrom } from '../api/account'
import { Button } from '../components/ui/button'

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  return <NftDetailContent key={nftId} nftId={nftId} />
}

function NftDetailContent({ nftId }: { nftId: string }) {
  const detail = useQuery({
    queryKey: ['nft', nftId],
    queryFn: ({ signal }) => getNft(nftId, signal),
    retry: (attempt, error) =>
      !(isAxiosError(error) && error.response?.status === 404) && attempt < 1,
  })
  const [editionId, setEditionId] = useState('standard')
  const [quantity, setQuantity] = useState(1)
  const [view, setView] = useState(0)
  const [tab, setTab] = useState('details')
  const { mutation, cart, session } = useCart()
  const nft = detail.data
  const edition = nft?.editions.find((item) => item.id === editionId)
  return (
    <div className="kurio-app nft-detail-app">
      <MarketHeader />
      <main className="detail-page container">
        <Link to="/" search={defaultSearch} className="detail-back breadcrumbs">
          <ChevronLeft size={18} />
          <span>Início / Mercado</span>
          <span className="sr-only">Voltar ao catálogo</span>
        </Link>
        {detail.isPending ? (
          <div className="detail-loading-layout" aria-label="Carregando NFT" aria-busy="true">
            <div className="shimmer" />
            <div>
              <div className="shimmer" />
              <div className="shimmer" />
              <div className="shimmer" />
            </div>
          </div>
        ) : detail.isError ? (
          <section role="alert">
            <h1>
              {isAxiosError(detail.error) && detail.error.response?.status === 404
                ? 'NFT não encontrado'
                : 'Não foi possível carregar o NFT'}
            </h1>
            <p>Volte ao catálogo para explorar outras peças.</p>
          </section>
        ) : (
          nft && (
            <>
              <div className="detail-grid">
                <section className="nft-gallery" aria-label="Galeria do NFT">
                  <div className="gallery-thumbnails">
                    {['Obra completa', 'Retrato', 'Detalhe da obra', 'Composição'].map(
                      (label, index) => (
                        <button
                          type="button"
                          key={label}
                          aria-label={label}
                          aria-pressed={view === index}
                          onClick={() => setView(index)}
                        >
                          <NftArt src={nft.image} name="" />
                        </button>
                      ),
                    )}
                  </div>
                  <Dialog.Root>
                    <div className={`gallery-main gallery-view-${view}`}>
                      <Dialog.Trigger asChild>
                        <button
                          type="button"
                          className="gallery-image"
                          aria-label="Ver arte em tamanho ampliado"
                        >
                          <NftArt src={nft.image} name={nft.name} eager />
                          <span className="gallery-zoom" aria-hidden="true">
                            <Search size={25} />
                          </span>
                        </button>
                      </Dialog.Trigger>
                    </div>
                    <Dialog.Portal>
                      <Dialog.Overlay className="drawer-overlay" />
                      <Dialog.Content className="image-dialog">
                        <Dialog.Title className="sr-only">{nft.name}</Dialog.Title>
                        <Dialog.Description className="sr-only">
                          Visualização ampliada da imagem original.
                        </Dialog.Description>
                        <Dialog.Close className="icon-button" aria-label="Fechar imagem ampliada">
                          <X />
                        </Dialog.Close>
                        <NftArt src={nft.image} name={nft.name} eager />
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </section>
                <section className="nft-information">
                  <div className="nft-title-row">
                    <h1>{nft.name}</h1>
                    <span className="nft-rating">
                      <Star size={15} fill="currentColor" aria-hidden="true" />{' '}
                      {nft.rating ?? '4.8'} <span>({nft.reviewCount ?? 19})</span>
                    </span>
                  </div>
                  <p className="detail-price nft-price">{nft.priceEth} ETH</p>
                  <h2 className="detail-about">Sobre este NFT:</h2>
                  <p className="detail-description">{nft.description}</p>
                  <fieldset className="edition-picker">
                    <legend>Edição:</legend>
                    {nft.editions.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="edition-option"
                        disabled={item.available === 0}
                        aria-label={`${item.label} · ${item.available ? `${item.available} disponíveis` : 'Esgotada'}`}
                        aria-pressed={editionId === item.id}
                        onClick={() => {
                          setEditionId(item.id)
                          setQuantity(1)
                        }}
                      >
                        {item.id === 'standard'
                          ? '1/50'
                          : item.id === 'limited'
                            ? '1/10'
                            : item.id === 'unique'
                              ? '1/1'
                              : 'ABERTA'}
                      </button>
                    ))}
                  </fieldset>
                  <div className="nft-purchase">
                    <div className="detail-quantity">
                      <span>Qtd.</span>
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(quantity - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <label className="sr-only" htmlFor="detail-quantity">
                        Quantidade
                      </label>
                      <input
                        id="detail-quantity"
                        type="number"
                        min={1}
                        max={edition?.available || 1}
                        value={quantity}
                        disabled={!edition?.available}
                        onChange={(event) =>
                          setQuantity(
                            Math.min(
                              edition?.available || 1,
                              Math.max(1, Math.floor(Number(event.target.value) || 1)),
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        disabled={quantity >= (edition?.available ?? 0)}
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <span className="mobile-purchase-price nft-price">{nft.priceEth} ETH</span>
                    <Button
                      type="button"
                      aria-label={edition?.available ? 'Adicionar ao carrinho' : 'Edição esgotada'}
                      disabled={
                        !edition?.available ||
                        mutation.isPending ||
                        cart.isPending ||
                        !session.isSuccess
                      }
                      onClick={() => mutation.mutate({ action: 'add', nftId, editionId, quantity })}
                    >
                      {mutation.isPending
                        ? 'Adicionando…'
                        : edition?.available
                          ? 'Comprar NFT'
                          : 'Edição esgotada'}
                    </Button>
                    <div className="detail-favorite">
                      <FavoriteButton nft={nft} />
                      <span>Favoritar</span>
                    </div>
                    <Link to="/carrinho" aria-label="Ver carrinho" className="detail-cart-link">
                      <ShoppingCart size={23} />
                    </Link>
                  </div>
                  <dl className="nft-metadata">
                    <div>
                      <dt>ID do token:</dt>
                      <dd>#{nft.name.split('#')[1] ?? nft.id}</dd>
                    </div>
                    <div>
                      <dt>Coleção:</dt>
                      <dd>{nft.collection ?? 'Kurio Apes'}</dd>
                    </div>
                    <div>
                      <dt>Atributos:</dt>
                      <dd>{(nft.attributes ?? ['Arte digital', 'Colecionável']).join(', ')}</dd>
                    </div>
                  </dl>
                  <p className="nft-creator">
                    Criado por {nft.creator} · {nft.network}
                  </p>
                  {mutation.isError && (
                    <p role="alert" className="form-message error">
                      {problemFrom(mutation.error).message}
                    </p>
                  )}
                  {mutation.isSuccess && (
                    <p role="status" className="detail-feedback">
                      NFT adicionado ao carrinho.{' '}
                      <Link to="/carrinho" className="text-link">
                        Ver carrinho
                      </Link>
                    </p>
                  )}
                </section>
              </div>
              <section className="nft-description-section">
                <div
                  className="detail-tabs"
                  role="tablist"
                  aria-label="Informações do NFT"
                  onKeyDown={(event) => {
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                    event.preventDefault()
                    const next =
                      event.key === 'Home'
                        ? 'details'
                        : event.key === 'End'
                          ? 'reviews'
                          : tab === 'details'
                            ? 'reviews'
                            : 'details'
                    setTab(next)
                    event.currentTarget
                      .querySelector<HTMLButtonElement>(`#nft-${next}-tab`)
                      ?.focus()
                  }}
                >
                  <button
                    id="nft-details-tab"
                    type="button"
                    role="tab"
                    aria-selected={tab === 'details'}
                    tabIndex={tab === 'details' ? 0 : -1}
                    aria-controls="nft-details-panel"
                    onClick={() => setTab('details')}
                  >
                    Detalhes do NFT
                  </button>
                  <button
                    id="nft-reviews-tab"
                    type="button"
                    role="tab"
                    aria-selected={tab === 'reviews'}
                    tabIndex={tab === 'reviews' ? 0 : -1}
                    aria-controls="nft-reviews-panel"
                    onClick={() => setTab('reviews')}
                  >
                    Avaliações de colecionadores ({nft.reviewCount ?? 19})
                  </button>
                </div>
                {tab === 'details' ? (
                  <div id="nft-details-panel" role="tabpanel" aria-labelledby="nft-details-tab">
                    <p>
                      {nft.description} Cada atributo faz parte dos metadados desta coleção de
                      demonstração.
                    </p>
                    <p>
                      Explore identidade, movimento e luz em uma coleção de arte digital. Nesta
                      demonstração, a compra e a propriedade são simuladas.
                    </p>
                    <dl>
                      <dt>Rede:</dt>
                      <dd>{nft.network}</dd>
                      <dt>Contrato:</dt>
                      <dd>Referência simulada da coleção {nft.collection ?? 'Kurio Apes'}.</dd>
                      <dt>Direitos autorais:</dt>
                      <dd>
                        A aquisição de um token não transfere automaticamente os direitos autorais
                        da obra.
                      </dd>
                    </dl>
                  </div>
                ) : (
                  <div id="nft-reviews-panel" role="tabpanel" aria-labelledby="nft-reviews-tab">
                    <p>
                      Avaliação da coleção simulada: {nft.rating ?? '4.8'} de 5, em{' '}
                      {nft.reviewCount ?? 19} avaliações.
                    </p>
                    <p>O envio de avaliações não faz parte desta demonstração.</p>
                  </div>
                )}
              </section>
              <RelatedNfts />
            </>
          )
        )}
      </main>
      {!detail.isPending && <MarketFooter />}
    </div>
  )
}
