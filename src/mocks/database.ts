import type { Nft } from '../api/catalog'
import type { User } from '../domain/account'
import { catalogFixtures } from './fixtures/catalog'
import { hashPassword } from './password'
import type { MarketEvent, SavedOrder, Wallet, WalletConnection } from '../domain/checkout'
import { broadcast } from './event-bus'

export interface SavedCart {
  items: { nftId: string; editionId: string; quantity: number }[]
  coupon: string | null
  revision: number
}
export interface UserRecord {
  user: User
  password: { salt: string; hash: string }
}
export interface Database {
  version: 1
  users: UserRecord[]
  sessions: Record<string, { userId: string; expiresAt: number }>
  carts: Record<string, SavedCart>
  favorites: Record<string, string[]>
  nfts: Nft[]
  wallets: Record<string, Wallet[]>
  connections: Record<string, WalletConnection>
  orders: Record<string, SavedOrder>
  idempotency: Record<string, { fingerprint: string; orderId: string }>
  events: MarketEvent[]
  eventSequence: number
  pricingVersion: number
  networkFeeEth: string
  expiredCoupons: string[]
  socketOfflineUntil: number
}

export const databaseKey = 'kurio:db:v1'
let initialization: Promise<Database> | undefined
let pendingTransaction: Promise<unknown> = Promise.resolve()

async function createDatabase(): Promise<Database> {
  const users = await Promise.all(
    [
      { id: 'collector-ana', name: 'Ana Colecionadora', email: 'ana@kurio.test' },
      { id: 'collector-bruno', name: 'Bruno Colecionador', email: 'bruno@kurio.test' },
    ].map(async (user) => ({
      user: { ...user, phone: '', avatarUrl: null },
      password: await hashPassword('KurioDemo2026!'),
    })),
  )
  return {
    version: 1,
    users,
    sessions: {},
    carts: {},
    favorites: {},
    nfts: structuredClone(catalogFixtures),
    wallets: {
      'collector-ana': [
        {
          id: 'wallet-ana-primary',
          role: 'primary',
          label: 'Carteira principal',
          address: `0x${'a'.repeat(40)}`,
          network: 'Ethereum',
          version: 1,
        },
        {
          id: 'wallet-ana-secondary',
          role: 'secondary',
          label: 'Carteira secundária',
          address: `0x${'b'.repeat(40)}`,
          network: 'Polygon',
          version: 1,
        },
      ],
      'collector-bruno': [
        {
          id: 'wallet-bruno-primary',
          role: 'primary',
          label: 'Carteira principal',
          address: `0x${'c'.repeat(40)}`,
          network: 'Ethereum',
          version: 1,
        },
      ],
    },
    connections: {},
    orders: {},
    idempotency: {},
    events: [],
    eventSequence: 0,
    pricingVersion: 1,
    networkFeeEth: '0.005',
    expiredCoupons: [],
    socketOfflineUntil: 0,
  }
}

export async function readDatabase(): Promise<Database> {
  const saved = localStorage.getItem(databaseKey)
  if (saved) {
    const parsed = JSON.parse(saved) as Database
    if (parsed.version !== 1 || !Array.isArray(parsed.users) || !Array.isArray(parsed.nfts))
      throw new Error('Formato de banco mock incompatível')
    // Migração aditiva: preserve contas, hashes e carrinhos criados na etapa anterior.
    parsed.wallets ??= {}
    parsed.connections ??= {}
    parsed.orders ??= {}
    parsed.idempotency ??= {}
    parsed.events ??= []
    parsed.eventSequence ??= 0
    parsed.pricingVersion ??= 1
    parsed.networkFeeEth ??= '0.005'
    parsed.expiredCoupons ??= []
    parsed.socketOfflineUntil ??= 0
    return parsed
  }
  initialization ??= createDatabase()
    .then((database) => {
      saveDatabase(database)
      return database
    })
    .finally(() => {
      initialization = undefined
    })
  return structuredClone(await initialization)
}

export function saveDatabase(database: Database) {
  localStorage.setItem(databaseKey, JSON.stringify(database))
}
export function transaction<T>(mutate: (database: Database) => T): Promise<T> {
  const result = pendingTransaction.then(async () => {
    const database = await readDatabase()
    const sequence = database.eventSequence
    const value = mutate(database)
    saveDatabase(database)
    for (const event of database.events) if (event.sequence > sequence) broadcast(event)
    return value
  })
  pendingTransaction = result.catch(() => undefined)
  return result
}
export function emptyCart(): SavedCart {
  return { items: [], coupon: null, revision: 0 }
}
export async function resetDatabase() {
  await pendingTransaction
  if (initialization) await initialization
  const database = await createDatabase()
  saveDatabase(database)
  localStorage.removeItem('kurio:scenario')
  for (const key of Object.keys(localStorage))
    if (key.startsWith('kurio:checkout-attempt:') || key.startsWith('kurio:checkout-draft:'))
      localStorage.removeItem(key)
  clearCookie('kurio_session')
  clearCookie('kurio_guest')
}

export function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=2592000`
}
export function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0`
}
function readCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}
export function clearSessionCookie(token: string | undefined) {
  if (token && readCookie('kurio_session') === token) clearCookie('kurio_session')
}
export function guestId(cookies: Record<string, string | undefined>) {
  const existing = cookies.kurio_guest || readCookie('kurio_guest')
  if (existing) return `guest:${existing}`
  const id = crypto.randomUUID()
  setCookie('kurio_guest', id)
  return `guest:${id}`
}
