import { safeReturnTo } from '../domain/account-helpers'

let lastPublicLocation: string | undefined

function isPublicPath(pathname: string) {
  return /^\/(?:$|nfts\/[^/]+\/?$|carrinho\/?$|setup\/?$)/.test(pathname)
}

export function rememberPublicLocation(location: { pathname: string; href: string }) {
  if (isPublicPath(location.pathname)) lastPublicLocation = safeReturnTo(location.href)
}

export function authCancelDestination(returnTo: string) {
  if (lastPublicLocation) return lastPublicLocation
  const safe = safeReturnTo(returnTo)
  const pathname = new URL(safe, 'https://kurio.test').pathname
  if (isPublicPath(pathname)) return safe
  // A refreshed or directly opened login has no previous public page in memory.
  return pathname === '/pagamento' ? '/carrinho' : '/'
}
