import { z } from 'zod'
import { orderInputSchema, type OrderInput } from '../domain/checkout'

const attemptSchema = z.object({
  key: z.string().uuid(),
  input: orderInputSchema,
  orderId: z.string().optional(),
  createdAt: z.number(),
})
export type CheckoutAttempt = z.infer<typeof attemptSchema>
const attemptKey = (userId: string) => `kurio:checkout-attempt:${userId}`
export function loadAttempt(userId: string): CheckoutAttempt | null {
  const value = localStorage.getItem(attemptKey(userId))
  if (!value) return null
  try {
    return attemptSchema.parse(JSON.parse(value))
  } catch {
    throw new Error(
      'Não foi possível ler a tentativa. Consulte Meus pedidos antes de iniciar outra compra.',
    )
  }
}
export function saveAttempt(userId: string, attempt: CheckoutAttempt) {
  localStorage.setItem(attemptKey(userId), JSON.stringify(attempt))
}
export function clearAttempt(userId: string, orderId?: string) {
  const current = loadAttempt(userId)
  if (!orderId || current?.orderId === orderId) localStorage.removeItem(attemptKey(userId))
}

const draftSchema = z.object({
  username: z.string().default('colecionador'),
  ens: z.string().default('colecionador'),
  walletNickname: z.string().default('Minha carteira'),
  profileName: z.string().default('Colecionador Kurio'),
  referralCode: z.string().default('KURIO'),
  note: z.string().default(''),
  provider: z.enum(['WalletConnect', 'MetaMask', 'Coinbase Wallet']).default('MetaMask'),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  walletId: z.string(),
  network: z.enum(['Ethereum', 'Polygon', 'Solana']).optional(),
  agreed: z.boolean(),
})
export type CheckoutDraft = z.infer<typeof draftSchema>
export function loadDraft(userId: string, fallback: CheckoutDraft): CheckoutDraft {
  try {
    const value = localStorage.getItem(`kurio:checkout-draft:${userId}`)
    return value ? draftSchema.parse(JSON.parse(value)) : fallback
  } catch {
    return fallback
  }
}
export function saveDraft(userId: string, draft: CheckoutDraft) {
  localStorage.setItem(`kurio:checkout-draft:${userId}`, JSON.stringify(draft))
}
export function newAttempt(input: OrderInput): CheckoutAttempt {
  return { key: crypto.randomUUID(), input, createdAt: Date.now() }
}
