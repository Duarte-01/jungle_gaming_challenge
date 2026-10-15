import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  defaultSearch,
  getCatalog,
  validateCatalogSearch,
  type CatalogSearch,
  type CatalogTab,
} from '../api/catalog'
import { CatalogFilters } from '../components/catalog-filters'
import { NftArt } from '../components/nft-art'
import { AccountActions } from '../components/market-header'
import { FavoriteButton } from '../components/favorite-button'
import { MarketFooter } from '../components/market-footer'
import { MobileNav } from '../components/mobile-nav'

const heroArts = ['emerald-ape', 'sage-nomad', 'neon-vessel']
const tabs: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

function CatalogSearchForm({
  initialValue,
  onSearch,
}: {
  initialValue: string
  onSearch: (q: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(value)
      }}
    >
      <Search aria-hidden="true" size={22} />
      <label className="sr-only" htmlFor="catalog-search">
        Buscar NFTs
      </label>
      <input
        id="catalog-search"
        type="search"
        placeholder="Explorar coleções"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" className="sr-only focus:not-sr-only">
        Buscar
      </button>
    </form>
  )
}

export function HomePage() {
  const search = validateCatalogSearch(useSearch({ strict: false }))
  const location = useLocation()
  const navigate = useNavigate({ from: '/' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hero, setHero] = useState(0)
  const catalog = useQuery({
    queryKey: ['nfts', search],
    queryFn: ({ signal }) => getCatalog(search, signal),
    placeholderData: keepPreviousData,
  })
  const change = (patch: Partial<CatalogSearch>) =>
    void navigate({
      search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }),
      resetScroll: false,
      hash: window.location.hash.slice(1),
    })
  const filters = (
    <CatalogFilters
      key={`${search.min}:${search.max}`}
      search={search}
      facets={catalog.data?.facets}
      onChange={change}
    />
  )

  return (
    <div className="kurio-app">
      <header className="desktop-header container">
        <Link to="/" search={defaultSearch} className="brand">
          KURIO
        </Link>
        <nav aria-label="Navegação principal">
          <a href="#inicio" aria-current="page">
            Início
          </a>
          <a href="#catalogo">Mercado</a>
          <a href="#criadores">Criadores</a>
          <a href="#aprenda">Aprenda</a>
        </nav>
        <AccountActions catalogSearch={search} />
      </header>
      <main className="container" id="inicio">
        <div
          className="search-row"
          id="busca"
          data-open={location.hash.replace(/^#/, '') === 'busca'}
        >
          <CatalogSearchForm
            key={search.q}
            initialValue={search.q}
            onSearch={(q) => change({ q })}
          />
          <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
            <Dialog.Trigger className="filter-trigger" aria-label="Abrir filtros">
              <SlidersHorizontal aria-hidden="true" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="drawer-overlay" />
              <Dialog.Content className="filter-drawer">
                <div className="drawer-heading">
                  <Dialog.Title>Filtrar NFTs</Dialog.Title>
                  <Dialog.Close className="icon-button" aria-label="Fechar filtros">
                    <X />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="muted">
                  Combine coleção, preço e rede para encontrar sua próxima peça.
                </Dialog.Description>
                {filters}
                <Dialog.Close className="kurio-button">Ver resultados</Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        <section className="hero" aria-label="Destaques">
          <div className="hero-copy">
            <p>Bem-vindo à Kurio</p>
            <h1>
              <span className="desktop-title">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </span>
              <span className="mobile-title">
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </span>
            </h1>
            <p className="hero-description desktop-title">
              Descubra NFTs selecionados de criadores emergentes e consagrados.
              <br />
              Colecione arte digital rara, apoie artistas e tenha uma parte da
              <br />
              cultura da internet.
            </p>
            <p className="hero-description mobile-title">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <a className="kurio-button explore" href="#catalogo">
              EXPLORAR <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <NftArt
            key={hero}
            src={`/images/nfts/${heroArts[hero]}.png`}
            name={['Emerald Ape', 'Sage Nomad', 'Neon Vessel'][hero]}
            className="hero-art"
            eager
          />
          <div className="hero-dots" aria-label="Selecionar destaque">
            {heroArts.map((art, index) => (
              <button
                type="button"
                key={art}
                aria-label={`Destaque ${index + 1}`}
                aria-pressed={hero === index}
                onClick={() => setHero(index)}
              />
            ))}
          </div>
        </section>
        <section className="market-layout" id="catalogo" aria-label="Catálogo de NFTs">
          <aside className="desktop-filters" aria-label="Filtros de catálogo">
            {filters}
            <div className="featured-card">
              <h2>NFT EM DESTAQUE</h2>
              <p>OFERTA LIMITADA</p>
              <Link to="/nfts/$nftId" params={{ nftId: 'sage-nomad-9' }}>
                <NftArt src="/images/nfts/sage-nomad.png" name="Sage Nomad #009" />
              </Link>
            </div>
          </aside>
          <div className="catalog-main">
            <div className="catalog-toolbar">
              <div className="catalog-tabs" role="group" aria-label="Categorias de destaque">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    aria-pressed={search.tab === tab.id}
                    onClick={() => change({ tab: tab.id })}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <label className="sort-label">
                Ordenar por:
                <select
                  value={search.sort}
                  onChange={(event) =>
                    change({ sort: event.target.value as CatalogSearch['sort'] })
                  }
                >
                  <option value="recent">Listados recentemente</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="name">Nome</option>
                </select>
              </label>
            </div>
            <p className="catalog-status" role="status" aria-live="polite">
              {catalog.isFetching
                ? 'Atualizando catálogo…'
                : catalog.data
                  ? `${catalog.data.total} NFTs encontrados`
                  : ''}
            </p>
            {catalog.isPending ? (
              <div className="nft-grid" aria-label="Carregando catálogo" aria-busy="true">
                {Array.from({ length: 9 }, (_, index) => (
                  <div className="nft-skeleton" key={index}>
                    <div className="shimmer" />
                    <div className="shimmer" />
                    <div className="shimmer" />
                  </div>
                ))}
              </div>
            ) : catalog.isError ? (
              <div role="alert" className="catalog-message">
                <h2>Não foi possível carregar os NFTs.</h2>
                <p>Confira sua conexão e tente novamente.</p>
                <button
                  type="button"
                  className="kurio-button"
                  onClick={() => void catalog.refetch()}
                >
                  Tentar novamente
                </button>
              </div>
            ) : catalog.data?.items.length === 0 ? (
              <div className="catalog-message">
                <h2>Nenhum NFT encontrado</h2>
                <p>Experimente outra busca ou ajuste os filtros.</p>
                <button
                  type="button"
                  className="kurio-button"
                  onClick={() => change(defaultSearch)}
                >
                  Limpar busca e filtros
                </button>
              </div>
            ) : (
              <div className="nft-grid" aria-busy={catalog.isFetching}>
                {catalog.data?.items.map((nft, index) => (
                  <article className="nft-card" key={nft.id}>
                    <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>
                      <NftArt src={nft.image} name={nft.name} eager={index === 0} />
                      <h2>{nft.name}</h2>
                      <p className="nft-price">
                        {nft.priceEth} ETH{' '}
                        {nft.previousPriceEth && <del>{nft.previousPriceEth} ETH</del>}
                      </p>
                    </Link>
                    <FavoriteButton nft={nft} />
                  </article>
                ))}
              </div>
            )}
            {catalog.data && catalog.data.pages > 1 && (
              <nav className="pagination" aria-label="Páginas do catálogo">
                {Array.from({ length: catalog.data.pages }, (_, index) => (
                  <button
                    type="button"
                    key={index}
                    aria-label={`Página ${index + 1}`}
                    aria-current={search.page === index + 1 ? 'page' : undefined}
                    onClick={() => change({ page: index + 1 })}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={search.page >= catalog.data.pages}
                  aria-label="Próxima página"
                  onClick={() => change({ page: search.page + 1 })}
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </div>
        </section>
        <section className="promo-grid" id="criadores" aria-label="Conheça nossas coleções">
          {[
            {
              art: 'emerald-ape',
              title: 'Lançamentos gênesis de edição limitada',
              copy: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
              tab: 'new' as const,
            },
            {
              art: 'neon-vessel',
              title: 'Arte digital selecionada e muito mais',
              copy: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
              tab: 'all' as const,
            },
          ].map((promo) => (
            <article className="promo-card" key={promo.art}>
              <NftArt src={`/images/nfts/${promo.art}.png`} name={promo.title} />
              <div>
                <h2>{promo.title}</h2>
                <p>{promo.copy}</p>
                <a
                  className="kurio-button"
                  href="#catalogo"
                  onClick={() => change({ tab: promo.tab })}
                >
                  Explorar <ArrowRight size={15} />
                </a>
              </div>
            </article>
          ))}
        </section>
        <section className="learn-section" id="aprenda">
          <h2>Diário da Cunhagem</h2>
          <p>
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
          <div className="learn-grid">
            {[
              {
                art: 'neon-vessel',
                title: 'Como funciona a propriedade de NFTs',
                copy: 'Um NFT registra uma referência digital única. Ter o token não transfere automaticamente os direitos autorais da obra.',
              },
              {
                art: 'emerald-ape',
                title: 'Conheça os criadores digitais',
                copy: 'Pesquise o artista, a coleção e a origem da obra antes de colecionar.',
              },
              {
                art: 'sage-nomad',
                title: 'Raridade, atributos e procedência',
                copy: 'Compare os atributos e a procedência. Raridade não garante valorização.',
              },
              {
                art: 'golden-beat',
                title: 'Como proteger sua carteira',
                copy: 'Não compartilhe sua frase de recuperação. Nesta demonstração, use apenas dados fictícios.',
              },
            ].map((article) => (
              <article key={article.art}>
                <NftArt src={`/images/nfts/${article.art}.png`} name={article.title} />
                <details>
                  <summary>{article.title}</summary>
                  <p>{article.copy}</p>
                </details>
              </article>
            ))}
          </div>
        </section>
      </main>
      <MarketFooter />
      <MobileNav />
    </div>
  )
}
