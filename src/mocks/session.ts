import type { Session, User } from '../domain/account'
import { clearSessionCookie, emptyCart, guestId, setCookie, type Database } from './database'
import { ApiFault } from './http'

export function sessionUser(
  database: Database,
  cookies: Record<string, string | undefined>,
  required = true,
): User | null {
  const token = cookies.kurio_session
  if (!token) {
    if (required) throw new ApiFault(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
    return null
  }
  const session = database.sessions[token]
  if (
    !session ||
    session.expiresAt <= Date.now() ||
    localStorage.getItem('kurio:scenario') === 'session-expired'
  ) {
    clearSessionCookie(token)
    throw new ApiFault(
      401,
      'SESSION_EXPIRED',
      'Sua sessão expirou. Entre novamente para continuar.',
    )
  }
  const record = database.users.find(({ user }) => user.id === session.userId)
  if (!record) throw new ApiFault(401, 'UNAUTHORIZED', 'Sessão inválida.')
  return record.user
}

export function cartOwner(database: Database, cookies: Record<string, string | undefined>) {
  const user = sessionUser(database, cookies, false)
  return user ? `user:${user.id}` : guestId(cookies)
}

export function createSession(
  database: Database,
  user: User,
  cookies: Record<string, string | undefined>,
): Session {
  const previousToken = cookies.kurio_session
  if (previousToken) {
    delete database.sessions[previousToken]
    delete database.connections[previousToken]
  }
  for (const [key, session] of Object.entries(database.sessions))
    if (session.expiresAt <= Date.now()) {
      delete database.sessions[key]
      delete database.connections[key]
    }
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + 30 * 60_000
  database.sessions[token] = { userId: user.id, expiresAt }
  const visitorKey = guestId(cookies)
  const visitorCart = database.carts[visitorKey]
  const owner = `user:${user.id}`
  const cart = (database.carts[owner] ??= emptyCart())
  const notices: string[] = []
  if (visitorCart) {
    const changed = visitorCart.items.length > 0 || Boolean(!cart.coupon && visitorCart.coupon)
    for (const item of visitorCart.items) {
      const nft = database.nfts.find((entry) => entry.id === item.nftId)
      const edition = nft?.editions.find((entry) => entry.id === item.editionId)
      if (!nft || !edition) {
        notices.push('Uma edição do carrinho do visitante não está mais disponível.')
        continue
      }
      const existing = cart.items.find(
        (entry) => entry.nftId === item.nftId && entry.editionId === item.editionId,
      )
      const requested = item.quantity + (existing?.quantity ?? 0)
      const quantity = edition.available ? Math.min(requested, edition.available) : requested
      if (requested !== quantity)
        notices.push(
          `A quantidade de ${nft.name} foi ajustada para ${quantity}, conforme a disponibilidade.`,
        )
      if (existing) existing.quantity = quantity
      else cart.items.push({ ...item, quantity })
    }
    cart.coupon ||= visitorCart.coupon
    if (changed) cart.revision++
    database.carts[visitorKey] = emptyCart()
  }
  setCookie('kurio_session', token)
  return { user, expiresAt, notices }
}
