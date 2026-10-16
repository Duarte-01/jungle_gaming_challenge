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
  const displayName = batch ? `${name.split(' #')[0]} #${600 + index}` : name
  const network = networks[batch ? index % networks.length : 0]
  return {
    id: batch ? `${id}-edition-${batch}` : id,
    name: displayName,
    image: `/images/nfts/${art}.png`,
    category: categories[batch ? index % categories.length : 0],
    network,
    priceEth,
    previousPriceEth: index === 2 ? '2.29' : undefined,
    creator: 'Nova Sato',
    collection: 'Kurio Apes',
    attributes:
      index % 9 === 0 ? ['Óculos', 'Esmeralda', 'Raro'] : ['Edição Kurio', 'Colecionável'],
    rating: '4.8',
    reviewCount: 19,
    description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    mobileDescription: `Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na ${network}.`,
    // Editorial copy from the supplied frame; all provenance references are fictitious.
    details: {
      paragraphs: [
        `${displayName} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
        'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
      ],
      network: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
      contract:
        'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
      copyright: '0x7A42...19E8 · Contrato inteligente ERC-721 verificado.',
    },
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
