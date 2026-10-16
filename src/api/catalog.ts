import { api } from './client'

export const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const
export const networks = ['Ethereum', 'Polygon', 'Solana'] as const
export type CatalogTab = 'all' | 'new' | 'trending'
export type CatalogSort = 'recent' | 'price-asc' | 'price-desc' | 'name'

export interface CatalogSearch {
  q: string
  category: string
  network: string
  min: string
  max: string
  sort: CatalogSort
  tab: CatalogTab
  page: number
}

export interface Nft {
  id: string
  name: string
  image: string
  category: string
  network: string
  priceEth: string
  previousPriceEth?: string
  collection?: string
  attributes?: string[]
  rating?: string
  reviewCount?: number
  creator: string
  description: string
  mobileDescription?: string
  details?: {
    paragraphs: string[]
    network: string
    contract: string
    copyright: string
  }
  newRelease: boolean
  trending: boolean
  version: number
  editions: { id: string; label: string; available: number }[]
}

export interface CatalogResponse {
  items: Nft[]
  total: number
  page: number
  pages: number
  facets: { categories: Record<string, number>; networks: Record<string, number> }
}

export const defaultSearch: CatalogSearch = {
  q: '',
  category: '',
  network: '',
  min: '0.02',
  max: '12.30',
  sort: 'recent',
  tab: 'all',
  page: 1,
}

export function validateCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const text = (key: string) =>
    typeof input[key] === 'string' ? (input[key] as string).slice(0, 80) : ''
  const decimal = (key: string, fallback: string) =>
    /^\d+(?:\.\d{1,18})?$/.test(text(key)) ? text(key) : fallback
  const page = Number(input.page)
  const min = decimal('min', defaultSearch.min)
  const max = decimal('max', defaultSearch.max)
  return {
    q: text('q'),
    category: categories.some((category) => category === text('category')) ? text('category') : '',
    network: networks.some((network) => network === text('network')) ? text('network') : '',
    min,
    max,
    sort: ['recent', 'price-asc', 'price-desc', 'name'].includes(text('sort'))
      ? (text('sort') as CatalogSort)
      : 'recent',
    tab: ['all', 'new', 'trending'].includes(text('tab')) ? (text('tab') as CatalogTab) : 'all',
    page: Number.isSafeInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  }
}

export async function getCatalog(
  search: CatalogSearch,
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  const { data } = await api.get<CatalogResponse>('/nfts', { params: search, signal })
  return data
}

export async function getNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await api.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}
