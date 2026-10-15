import { z } from 'zod'
import { collectorFields, emailSchema } from './account'
import type { CartItem, Quote } from '../api/cart'

export const providerSchema = z.enum(['WalletConnect', 'MetaMask', 'Coinbase Wallet'])
export const networkSchema = z.enum(['Ethereum', 'Polygon', 'Solana'])
export const walletSchema = z
  .object({
    provider: providerSchema.default('MetaMask'),
    profileName: z
      .string()
      .trim()
      .min(2, 'Informe o nome do perfil.')
      .max(80)
      .default('Colecionador Kurio'),
    email: emailSchema.default('colecionador@kurio.test'),
    ens: collectorFields.ens,
    referralCode: z
      .string()
      .trim()
      .min(2, 'Informe o código de indicação.')
      .max(30)
      .default('KURIO'),
    secondaryAddress: z.string().trim().max(100).default(''),
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
    if (
      wallet.secondaryAddress &&
      !(
        /^[a-zA-Z0-9-]+\.eth$/.test(wallet.secondaryAddress) ||
        /^0x[0-9a-fA-F]{40}$/.test(wallet.secondaryAddress) ||
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.secondaryAddress)
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['secondaryAddress'],
        message: 'Use um ENS .eth ou endereço válido.',
      })
    if (!valid)
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'O endereço não é válido para a rede escolhida.',
      })
  })
export type WalletInput = z.input<typeof walletSchema>
export interface Wallet extends z.output<typeof walletSchema> {
  id: string
  version: number
}
export interface WalletConnection {
  walletId: string
  network: Wallet['network']
  connectedAt: number
  provider: z.infer<typeof providerSchema>
}

export const customerSchema = z.object({
  ...collectorFields,
  profileName: z
    .string()
    .trim()
    .min(2, 'Informe o nome do perfil.')
    .max(80)
    .default('Colecionador Kurio'),
  referralCode: z.string().trim().min(2, 'Informe o código de indicação.').max(30).default('KURIO'),
  note: z.string().trim().max(1000, 'Use até 1000 caracteres.').default(''),
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
  provider: providerSchema.default('MetaMask'),
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
