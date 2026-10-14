import { useState } from 'react'
import { categories, networks, type CatalogSearch, type CatalogResponse } from '../api/catalog'
import { ethToWei } from '../lib/eth'

export function CatalogFilters({ search, facets, onChange }: {
  search: CatalogSearch
  facets?: CatalogResponse['facets']
  onChange: (patch: Partial<CatalogSearch>) => void
}) {
  const [min, setMin] = useState(search.min)
  const [max, setMax] = useState(search.max)
  const [error, setError] = useState('')
  return (
    <div className="filter-panel">
      <fieldset>
        <legend>Coleções</legend>
        <button type="button" className="facet" aria-pressed={!search.category} onClick={() => onChange({ category: '' })}>Todas as coleções</button>
        {categories.map((category) => <button type="button" className="facet" key={category} aria-pressed={search.category === category} onClick={() => onChange({ category: search.category === category ? '' : category })}>
          <span>{category}</span><span>{facets ? `(${facets.categories[category] ?? 0})` : ''}</span>
        </button>)}
      </fieldset>
      <form onSubmit={(event) => {
        event.preventDefault()
        try {
          if (ethToWei(min) > ethToWei(max)) throw new Error('O mínimo deve ser menor ou igual ao máximo.')
          setError(''); onChange({ min, max })
        } catch { setError('Informe preços válidos em ETH, com mínimo menor ou igual ao máximo.') }
      }}>
        <fieldset>
          <legend>Faixa de preço</legend>
          <div className="price-inputs">
            <label>Mínimo<input inputMode="decimal" aria-invalid={Boolean(error)} aria-describedby={error ? 'price-error' : undefined} value={min} onChange={(event) => setMin(event.target.value)} /></label>
            <label>Máximo<input inputMode="decimal" aria-invalid={Boolean(error)} aria-describedby={error ? 'price-error' : undefined} value={max} onChange={(event) => setMax(event.target.value)} /></label>
          </div>
          <p className="muted">Preço em ETH</p>
          {error && <p id="price-error" role="alert">{error}</p>}
          <button type="submit" className="kurio-button">Aplicar</button>
        </fieldset>
      </form>
      <fieldset>
        <legend>Rede</legend>
        <button type="button" className="facet" aria-pressed={!search.network} onClick={() => onChange({ network: '' })}>Todas as redes</button>
        {networks.map((network) => <button type="button" className="facet" key={network} aria-pressed={search.network === network} onClick={() => onChange({ network: search.network === network ? '' : network })}>
          <span>{network}</span><span>{facets ? `(${facets.networks[network] ?? 0})` : ''}</span>
        </button>)}
      </fieldset>
      <button type="button" className="text-link" onClick={() => onChange({ category: '', network: '', min: '0', max: '100', q: '' })}>Limpar filtros</button>
    </div>
  )
}
