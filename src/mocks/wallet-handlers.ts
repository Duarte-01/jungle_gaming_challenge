import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { networkSchema, walletSchema } from '../domain/checkout'
import { transaction } from './database'
import { ApiFault, parseBody, respond } from './http'
import { sessionUser } from './session'

export const walletHandlers = [
  http.get('/api/wallets', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        const user = sessionUser(database, cookies)!
        return HttpResponse.json(database.wallets[user.id] ?? [])
      }),
    ),
  ),
  ...(['post', 'patch'] as const).map((method) =>
    http[method](
      method === 'post' ? '/api/wallets' : '/api/wallets/:id',
      ({ request, cookies, params }) =>
        respond(async () => {
          const input = await parseBody(request, walletSchema)
          return transaction((database) => {
            const user = sessionUser(database, cookies)!
            const wallets = (database.wallets[user.id] ??= [])
            const existing =
              method === 'patch' ? wallets.find((wallet) => wallet.id === params.id) : undefined
            if (method === 'patch' && !existing)
              throw new ApiFault(404, 'NOT_FOUND', 'Carteira não encontrada.')
            if (wallets.some((wallet) => wallet.id !== existing?.id && wallet.role === input.role))
              throw new ApiFault(
                409,
                'WALLET_ROLE_CONFLICT',
                'Já existe uma carteira para esta função.',
                { role: 'Edite a carteira existente ou escolha outra função.' },
              )
            if (
              wallets.some(
                (wallet) =>
                  wallet.id !== existing?.id &&
                  wallet.network === input.network &&
                  (input.network === 'Solana'
                    ? wallet.address === input.address
                    : wallet.address.toLowerCase() === input.address.toLowerCase()),
              )
            )
              throw new ApiFault(
                409,
                'WALLET_CONFLICT',
                'Este endereço já está cadastrado nesta rede.',
                { address: 'Endereço já cadastrado.' },
              )
            const wallet = {
              ...input,
              id: existing?.id ?? crypto.randomUUID(),
              version: (existing?.version ?? 0) + 1,
            }
            if (existing) wallets[wallets.indexOf(existing)] = wallet
            else wallets.push(wallet)
            for (const [token, connection] of Object.entries(database.connections))
              if (connection.walletId === wallet.id) delete database.connections[token]
            return HttpResponse.json(wallet, { status: existing ? 200 : 201 })
          })
        }),
    ),
  ),
  http.get('/api/wallet-connection', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        sessionUser(database, cookies)
        return HttpResponse.json(database.connections[cookies.kurio_session!] ?? null)
      }),
    ),
  ),
  http.post('/api/wallets/:id/connect', ({ request, params, cookies }) =>
    respond(async () => {
      const { network } = await parseBody(request, z.object({ network: networkSchema }))
      return transaction((database) => {
        const user = sessionUser(database, cookies)!
        const wallet = database.wallets[user.id]?.find((entry) => entry.id === params.id)
        if (!wallet) throw new ApiFault(404, 'NOT_FOUND', 'Carteira não encontrada.')
        if (wallet.network !== network)
          throw new ApiFault(
            422,
            'NETWORK_MISMATCH',
            'Selecione a rede cadastrada nesta carteira.',
            { network: 'Rede incompatível com a carteira.' },
          )
        if (localStorage.getItem('kurio:scenario') === 'wallet-rejected')
          throw new ApiFault(
            409,
            'CONNECTION_REJECTED',
            'A conexão foi recusada pela carteira simulada.',
          )
        const connection = { walletId: wallet.id, network, connectedAt: Date.now() }
        database.connections[cookies.kurio_session!] = connection
        return HttpResponse.json(connection)
      })
    }),
  ),
  http.delete('/api/wallet-connection', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        sessionUser(database, cookies)
        delete database.connections[cookies.kurio_session!]
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  ),
]
