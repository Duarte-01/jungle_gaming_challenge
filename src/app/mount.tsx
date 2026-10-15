import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Application } from './application'
import { router } from './router'
import { queryClient } from './query-client'
import { defaultSearch, getCatalog, getNft, validateCatalogSearch } from '../api/catalog'
import { sessionOptions } from '../api/account'

export function mountApplication() {
  const location = router.state.location
  void queryClient.prefetchQuery(sessionOptions)
  if (location.pathname === '/') {
    const search = validateCatalogSearch(location.search ?? defaultSearch)
    void queryClient.prefetchQuery({
      queryKey: ['nfts', search],
      queryFn: ({ signal }) => getCatalog(search, signal),
    })
  } else {
    const match = /^\/nfts\/([^/]+)$/.exec(location.pathname)
    if (match) {
      const id = match[1]
      void queryClient.prefetchQuery({
        queryKey: ['nft', id],
        queryFn: ({ signal }) => getNft(id, signal),
        retry: false,
      })
    }
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Application />
    </StrictMode>,
  )
}
