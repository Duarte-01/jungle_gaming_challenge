import { categories, networks, type Nft } from '../../api/catalog'

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
    collection: 'Kurio Apes',
    attributes:
      index % 9 === 0 ? ['Óculos', 'Esmeralda', 'Raro'] : ['Edição Kurio', 'Colecionável'],
    rating: '4.8',
    reviewCount: 19,
    description:
      'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
    newRelease: index % 2 === 0,
    trending: index % 3 === 0,
    version: 1,
    editions: [
      { id: 'standard', label: 'Edição original', available: index === 35 ? 0 : 5 },
      { id: 'unique', label: 'Edição única', available: 1 },
      { id: 'open', label: 'Edição aberta', available: 10 },
      { id: 'limited', label: 'Edição limitada', available: index % 4 === 0 ? 0 : 2 },
    ],
  }
})
