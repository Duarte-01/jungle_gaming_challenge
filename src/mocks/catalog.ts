import { delay, http, HttpResponse } from 'msw'
import { categories, networks, validateCatalogSearch, type Nft, type CatalogResponse } from '../api/catalog'
import { ethToWei } from '../lib/eth'

const identities = [
  ['emerald-ape-42', 'Emerald Ape #042', 'emerald-ape', '1.19'],
  ['sage-nomad-9', 'Sage Nomad #009', 'sage-nomad', '1.69'],
  ['neon-vessel-552', 'Neon Vessel #552', 'neon-vessel', '1.99'],
  ['cosmic-bloom-118', 'Cosmic Bloom #118', 'sage-nomad', '1.29'],
  ['violet-nomad-314', 'Violet Nomad #314', 'sage-nomad', '1.39'],
  ['ivory-baron-88', 'Ivory Baron #088', 'neon-vessel', '1.79'],
  ['golden-beat-207', 'Golden Beat #207', 'golden-beat', '0.99'],
  ['golden-echo-208', 'Golden Echo #208', 'golden-beat', '1.09'],
  ['golden-signal-160', 'Golden Signal #160', 'golden-beat', '0.39'],
] as const

export const catalogFixtures: Nft[] = Array.from({ length: 36 }, (_, index) => {
  const [id, name, art, priceEth] = identities[index % identities.length]
  const batch = Math.floor(index / identities.length)
  return {
    id: batch ? `${id}-edition-${batch}` : id,
    name: batch ? `${name.split(' #')[0]} #${600 + index}` : name,
    image: `/images/nfts/${art}.png`,
    category: categories[batch ? index % categories.length : 0],
    network: networks[batch ? index % networks.length : 0],
    priceEth,
    previousPriceEth: index === 2 ? '2.29' : undefined,
    creator: 'Kurio Studio',
    description: 'Uma edição de arte digital da coleção Kurio. Explore a identidade, a expressão e os detalhes que tornam cada peça singular.',
    newRelease: index % 2 === 0,
    trending: index % 3 === 0,
    version: 1,
    editions: [
      { id: 'standard', label: 'Edição original', available: index === 35 ? 0 : 5 },
      { id: 'limited', label: 'Edição limitada', available: index % 4 === 0 ? 0 : 2 },
    ],
  }
})

export const catalogHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const url = new URL(request.url)
    const search = validateCatalogSearch(Object.fromEntries(url.searchParams))
    const scenario = localStorage.getItem('kurio:scenario')
    await delay(scenario === 'slow' ? 2000 : 250)
    if (scenario === 'catalog-error') return HttpResponse.json({ code: 'TRANSIENT_FAILURE', message: 'Falha temporária no catálogo.' }, { status: 503 })
    const min = ethToWei(search.min)
    const max = ethToWei(search.max)
    if (min > max) return HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'O preço mínimo não pode superar o máximo.' }, { status: 422 })
    const matches = catalogFixtures.filter((nft) =>
      nft.name.toLocaleLowerCase('pt-BR').includes(search.q.trim().toLocaleLowerCase('pt-BR')) &&
      (!search.category || nft.category === search.category) &&
      (!search.network || nft.network === search.network) &&
      ethToWei(nft.priceEth) >= min && ethToWei(nft.priceEth) <= max &&
      (search.tab !== 'new' || nft.newRelease) && (search.tab !== 'trending' || nft.trending),
    )
    if (search.sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name))
    if (search.sort.startsWith('price')) matches.sort((a, b) => {
      const difference = ethToWei(a.priceEth) - ethToWei(b.priceEth)
      return (difference === 0n ? 0 : difference > 0n ? 1 : -1) * (search.sort === 'price-desc' ? -1 : 1)
    })
    return HttpResponse.json<CatalogResponse>({
      items: matches.slice((search.page - 1) * 9, search.page * 9),
      total: matches.length,
      page: search.page,
      pages: Math.ceil(matches.length / 9),
      facets: {
        categories: Object.fromEntries(categories.map((category) => [category, catalogFixtures.filter((nft) => nft.category === category).length])),
        networks: Object.fromEntries(networks.map((network) => [network, catalogFixtures.filter((nft) => nft.network === network).length])),
      },
    })
  }),
  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(200)
    const nft = catalogFixtures.find((item) => item.id === params.id)
    return nft ? HttpResponse.json(nft) : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
  }),
]
