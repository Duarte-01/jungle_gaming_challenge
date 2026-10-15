import { useId, useState, type CSSProperties } from 'react'
import {
  categories,
  networks,
  defaultSearch,
  type CatalogSearch,
  type CatalogResponse,
} from '../api/catalog'
import { ethToWei } from '../lib/eth'

export function CatalogFilters({
  search,
  facets,
  onChange,
}: {
  search: CatalogSearch
  facets?: CatalogResponse['facets']
  onChange: (patch: Partial<CatalogSearch>) => void
}) {
  const [min, setMin] = useState(search.min)
  const [max, setMax] = useState(search.max)
  const id = useId()
  const ceiling = Math.min(1_000_000, Math.max(16, Number(search.max)))
  const format = (value: string) => value.replace('.', ',')
  const filtered = Boolean(
    search.category ||
    search.network ||
    search.q ||
    search.min !== defaultSearch.min ||
    search.max !== defaultSearch.max,
  )
  const style = {
    '--price-start': `${Math.min(100, (Number(min) / ceiling) * 100)}%`,
    '--price-end': `${Math.min(100, (Number(max) / ceiling) * 100)}%`,
  } as CSSProperties
  return (
    <div className="filter-panel">
      <fieldset>
        <legend>Coleções</legend>
        {categories.map((category) => (
          <button
            type="button"
            className="facet"
            key={category}
            aria-pressed={search.category === category}
            onClick={() => onChange({ category: search.category === category ? '' : category })}
          >
            <span>{category}</span>
            <span>{facets ? `(${facets.categories[category] ?? 0})` : ''}</span>
          </button>
        ))}
      </fieldset>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onChange({ min, max })
        }}
      >
        <fieldset>
          <legend>Faixa de preço</legend>
          <div
            className="price-range"
            style={style}
            onPointerDown={(event) => {
              if (event.target instanceof HTMLInputElement) return
              const rect = event.currentTarget.getBoundingClientRect()
              const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
              const value = (Math.round(position * ceiling * 100) / 100).toFixed(2)
              const lower =
                Math.abs(Number(value) - Number(min)) <= Math.abs(Number(value) - Number(max))
              if (lower) setMin(ethToWei(value) <= ethToWei(max) ? value : max)
              else setMax(ethToWei(value) >= ethToWei(min) ? value : min)
              document.getElementById(`${id}-${lower ? 'min' : 'max'}`)?.focus()
            }}
          >
            <div className="price-range-track" aria-hidden="true" />
            <label className="sr-only" htmlFor={`${id}-min`}>
              Preço mínimo em ETH
            </label>
            <input
              id={`${id}-min`}
              type="range"
              min="0"
              max={ceiling}
              step="0.01"
              value={min}
              aria-valuetext={`${format(min)} ETH`}
              aria-describedby={`${id}-value`}
              onChange={(event) =>
                setMin(ethToWei(event.target.value) <= ethToWei(max) ? event.target.value : max)
              }
            />
            <label className="sr-only" htmlFor={`${id}-max`}>
              Preço máximo em ETH
            </label>
            <input
              id={`${id}-max`}
              type="range"
              min="0"
              max={ceiling}
              step="0.01"
              value={max}
              aria-valuetext={`${format(max)} ETH`}
              aria-describedby={`${id}-value`}
              onChange={(event) =>
                setMax(ethToWei(event.target.value) >= ethToWei(min) ? event.target.value : min)
              }
            />
          </div>
          <p className="price-range-value" id={`${id}-value`}>
            Preço: {format(min)} - {format(max)} ETH
          </p>
          <button type="submit" className="kurio-button">
            Aplicar
          </button>
        </fieldset>
      </form>
      <fieldset>
        <legend>Rede</legend>
        {networks.map((network) => (
          <button
            type="button"
            className="facet"
            key={network}
            aria-pressed={search.network === network}
            onClick={() => onChange({ network: search.network === network ? '' : network })}
          >
            <span>{network}</span>
            <span>{facets ? `(${facets.networks[network] ?? 0})` : ''}</span>
          </button>
        ))}
      </fieldset>
      {filtered && (
        <button
          type="button"
          className="text-link clear-catalog-filters"
          onClick={() =>
            onChange({
              category: '',
              network: '',
              min: defaultSearch.min,
              max: defaultSearch.max,
              q: '',
            })
          }
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
