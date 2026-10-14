import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { defaultSearch, getNft } from '../api/catalog'
import { NftArt } from '../components/nft-art'

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  return <NftDetailContent key={nftId} nftId={nftId} />
}

function NftDetailContent({ nftId }: { nftId: string }) {
  const detail = useQuery({ queryKey: ['nft', nftId], queryFn: ({ signal }) => getNft(nftId, signal), retry: (attempt, error) => !(isAxiosError(error) && error.response?.status === 404) && attempt < 1 })
  const [editionId, setEditionId] = useState('standard')
  const [quantity, setQuantity] = useState(1)
  const edition = detail.data?.editions.find((item) => item.id === editionId)
  return <main className="kurio-app detail-page container"><Link to="/" search={defaultSearch} className="text-link">← Voltar ao catálogo</Link>
    {detail.isPending ? <div className="shimmer detail-skeleton" aria-label="Carregando NFT" /> : detail.isError ? <section role="alert"><h1>{isAxiosError(detail.error) && detail.error.response?.status === 404 ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}</h1><p>Volte ao catálogo para explorar outras peças.</p></section> : detail.data && <div className="detail-grid"><NftArt src={detail.data.image} name={detail.data.name} eager /><section><p>{detail.data.category} · {detail.data.network}</p><h1>{detail.data.name}</h1><p>Criado por {detail.data.creator}</p><p className="nft-price">{detail.data.priceEth} ETH</p><p>{detail.data.description}</p><fieldset><legend>Edição</legend>{detail.data.editions.map((item) => <button type="button" key={item.id} className="edition-option" disabled={item.available === 0} aria-pressed={editionId === item.id} onClick={() => { setEditionId(item.id); setQuantity(1) }}>{item.label} · {item.available ? `${item.available} disponíveis` : 'Esgotada'}</button>)}</fieldset><label>Quantidade<input type="number" min={1} max={edition?.available || 1} value={quantity} disabled={!edition?.available} onChange={(event) => setQuantity(Math.min(edition?.available || 1, Math.max(1, Math.floor(Number(event.target.value) || 1))))} /></label><button type="button" className="kurio-button" disabled>{edition?.available ? 'Compra indisponível no momento' : 'Edição esgotada'}</button></section></div>}
  </main>
}
