import { z } from 'zod'
import { emailSchema } from './account'
import type { CartItem, Quote } from '../api/cart'

export const networkSchema = z.enum(['Ethereum', 'Polygon', 'Solana'])
export const walletSchema = z
  .object({
    label: z.string().trim().min(2, 'Dê um nome à carteira.').max(50),
    address: z.string().trim().min(1, 'Informe o endereço.'),
    network: networkSchema,
    role: z.enum(['primary', 'secondary']),
  })
  .superRefine((wallet, context) => {
    const valid =
      wallet.network === 'Solana'
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.address)
        : /^0x[0-9a-fA-F]{40}$/.test(wallet.address)
    if (!valid)
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'O endereço não é válido para a rede escolhida.',
      })
  })
export type WalletInput = z.infer<typeof walletSchema>
export interface Wallet extends WalletInput {
  id: string
  version: number
}
export interface WalletConnection {
  walletId: string
  network: Wallet['network']
  connectedAt: number
}

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d ()-]{8,25}$/, 'Informe um telefone válido.'),
})
export const orderInputSchema = z.object({
  customer: customerSchema,
  walletId: z.string().min(1, 'Selecione uma carteira.'),
  walletVersion: z.number().int().positive(),
  network: networkSchema,
  quoteVersion: z.string().min(1),
  agreed: z.literal(true, { error: 'Confirme a revisão dos dados e valores.' }),
})
export type OrderInput = z.infer<typeof orderInputSchema>
export type OrderStatus = 'pending' | 'confirmed' | 'declined'
export interface Order {
  id: string
  userId: string
  status: OrderStatus
  version: number
  createdAt: number
  settledAt?: number
  transactionReference: string | null
  snapshot: {
    items: CartItem[]
    quote: Quote
    coupon: string | null
    wallet: Wallet
    customer: OrderInput['customer']
    network: Wallet['network']
  }
  refusalReason?: string
}
export interface SavedOrder {
  order: Order
  resolveAt: number
  outcome: 'confirmed' | 'declined'
  held: boolean
}

export const marketEventSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  type: z.enum(['nft.updated', 'order.updated', 'quote.updated']),
  resourceId: z.string(),
  version: z.number().int().positive(),
  ownerId: z.string().optional(),
  actorId: z.string().optional(),
  reason: z.enum(['reservation', 'market']).optional(),
})
export type MarketEvent = z.infer<typeof marketEventSchema>
