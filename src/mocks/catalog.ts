import { delay, http, HttpResponse } from 'msw'
import { categories, networks, validateCatalogSearch, type CatalogResponse } from '../api/catalog'
import { readDatabase } from './database'
import { ethToWei } from '../lib/eth'

export const catalogHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const url = new URL(request.url)
    const search = validateCatalogSearch(Object.fromEntries(url.searchParams))
    const scenario = localStorage.getItem('kurio:scenario')
    await delay(
      scenario === 'slow'
        ? 2000
        : scenario === 'out-of-order'
          ? search.q.toLowerCase().includes('emerald')
            ? 1000
            : 100
          : 250,
    )
    if (scenario === 'offline') return HttpResponse.error()
    if (scenario === 'catalog-error')
      return HttpResponse.json(
        { code: 'TRANSIENT_FAILURE', message: 'Falha temporária no catálogo.' },
        { status: 503 },
      )
    const min = ethToWei(search.min)
    const max = ethToWei(search.max)
    if (min > max)
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'O preço mínimo não pode superar o máximo.' },
        { status: 422 },
      )
    const { nfts } = await readDatabase()
    const matches = nfts.filter(
      (nft) =>
        nft.name.toLocaleLowerCase('pt-BR').includes(search.q.trim().toLocaleLowerCase('pt-BR')) &&
        (!search.category || nft.category === search.category) &&
        (!search.network || nft.network === search.network) &&
        ethToWei(nft.priceEth) >= min &&
        ethToWei(nft.priceEth) <= max &&
        (search.tab !== 'new' || nft.newRelease) &&
        (search.tab !== 'trending' || nft.trending),
    )
    if (search.sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name))
    if (search.sort.startsWith('price'))
      matches.sort((a, b) => {
        const difference = ethToWei(a.priceEth) - ethToWei(b.priceEth)
        return (
          (difference === 0n ? 0 : difference > 0n ? 1 : -1) *
          (search.sort === 'price-desc' ? -1 : 1)
        )
      })
    return HttpResponse.json<CatalogResponse>({
      items: matches.slice((search.page - 1) * 9, search.page * 9),
      total: matches.length,
      page: search.page,
      pages: Math.ceil(matches.length / 9),
      facets: {
        categories: Object.fromEntries(
          categories.map((category) => [
            category,
            nfts.filter((nft) => nft.category === category).length,
          ]),
        ),
        networks: Object.fromEntries(
          networks.map((network) => [
            network,
            nfts.filter((nft) => nft.network === network).length,
          ]),
        ),
      },
    })
  }),
  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(200)
    if (localStorage.getItem('kurio:scenario') === 'offline') return HttpResponse.error()
    const { nfts } = await readDatabase()
    const nft = nfts.find((item) => item.id === params.id)
    return nft
      ? HttpResponse.json(nft)
      : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
  }),
]
