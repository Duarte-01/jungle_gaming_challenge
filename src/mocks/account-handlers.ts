import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { changePasswordSchema, loginSchema, profileSchema, registerSchema } from '../domain/account'
import type { Favorites } from '../api/cart'
import { clearSessionCookie, readDatabase, resetDatabase, transaction } from './database'
import { ApiFault, controlResponse, parseBody, respond } from './http'
import { hashPassword, matchesPassword } from './password'
import { createSession, sessionUser } from './session'

function favoriteSnapshot(
  database: Awaited<ReturnType<typeof readDatabase>>,
  userId: string,
): Favorites {
  const ids = database.favorites[userId] ?? []
  return { ids, items: database.nfts.filter((nft) => ids.includes(nft.id)) }
}

export const accountHandlers = [
  http.get('/api/session', ({ cookies }) =>
    respond(async () => {
      const database = await readDatabase()
      const user = sessionUser(database, cookies, false)
      return HttpResponse.json({
        user,
        expiresAt: cookies.kurio_session
          ? (database.sessions[cookies.kurio_session]?.expiresAt ?? null)
          : null,
      })
    }),
  ),
  http.post('/api/auth/register', ({ request, cookies }) =>
    respond(async () => {
      const input = await parseBody(request, registerSchema)
      const password = await hashPassword(input.password)
      return transaction((database) => {
        if (
          database.users.some(({ user }) => user.email === input.email) ||
          localStorage.getItem('kurio:scenario') === 'register-conflict'
        )
          throw new ApiFault(409, 'EMAIL_CONFLICT', 'Este e-mail já está cadastrado.', {
            email: 'Este e-mail já está cadastrado.',
          })
        const user = {
          id: crypto.randomUUID(),
          name: input.name,
          email: input.email,
          phone: '',
          avatarUrl: null,
        }
        database.users.push({ user, password })
        return HttpResponse.json(createSession(database, user, cookies), { status: 201 })
      })
    }),
  ),
  http.post('/api/auth/login', ({ request, cookies }) =>
    respond(async () => {
      const input = await parseBody(request, loginSchema)
      const database = await readDatabase()
      const record = database.users.find(({ user }) => user.email === input.email)
      if (!record || !(await matchesPassword(input.password, record.password)))
        throw new ApiFault(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
      return transaction((fresh) => {
        const current = fresh.users.find(({ user }) => user.id === record.user.id)
        if (!current || current.password.hash !== record.password.hash)
          throw new ApiFault(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
        return HttpResponse.json(createSession(fresh, current.user, cookies))
      })
    }),
  ),
  http.post('/api/auth/logout', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        if (cookies.kurio_session) {
          delete database.sessions[cookies.kurio_session]
          delete database.connections[cookies.kurio_session]
        }
        clearSessionCookie(cookies.kurio_session)
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  ),
  http.get('/api/profile', ({ cookies }) =>
    respond(() => transaction((database) => HttpResponse.json(sessionUser(database, cookies)))),
  ),
  http.patch('/api/profile', ({ request, cookies }) =>
    respond(async () => {
      const input = await parseBody(request, profileSchema)
      return transaction((database) => {
        const user = sessionUser(database, cookies)!
        if (
          database.users.some(
            (record) => record.user.id !== user.id && record.user.email === input.email,
          )
        )
          throw new ApiFault(409, 'EMAIL_CONFLICT', 'Este e-mail já está cadastrado.', {
            email: 'Este e-mail já está cadastrado.',
          })
        Object.assign(user, input)
        return HttpResponse.json(user)
      })
    }),
  ),
  http.put('/api/profile/password', ({ request, cookies }) =>
    respond(async () => {
      const input = await parseBody(request, changePasswordSchema)
      const database = await readDatabase()
      const user = sessionUser(database, cookies)!
      const record = database.users.find((entry) => entry.user.id === user.id)!
      if (!(await matchesPassword(input.currentPassword, record.password)))
        throw new ApiFault(422, 'PASSWORD_MISMATCH', 'Senha atual incorreta.', {
          currentPassword: 'Senha atual incorreta.',
        })
      const password = await hashPassword(input.newPassword)
      return transaction((fresh) => {
        sessionUser(fresh, cookies)
        const current = fresh.users.find((entry) => entry.user.id === user.id)!
        if (current.password.hash !== record.password.hash)
          throw new ApiFault(409, 'PASSWORD_CHANGED', 'A senha foi alterada. Entre novamente.')
        current.password = password
        for (const [token, session] of Object.entries(fresh.sessions))
          if (session.userId === user.id) {
            delete fresh.sessions[token]
            delete fresh.connections[token]
          }
        clearSessionCookie(cookies.kurio_session)
        return new HttpResponse(null, { status: 204 })
      })
    }),
  ),
  http.get('/api/favorites', ({ cookies }) =>
    respond(() =>
      transaction((database) => {
        const user = sessionUser(database, cookies)!
        return HttpResponse.json(favoriteSnapshot(database, user.id))
      }),
    ),
  ),
  ...(['put', 'delete'] as const).map((method) =>
    http[method]('/api/favorites/:id', ({ params, cookies }) =>
      respond(() =>
        transaction((database) => {
          const user = sessionUser(database, cookies)!
          if (!database.nfts.some((nft) => nft.id === params.id))
            throw new ApiFault(404, 'NOT_FOUND', 'NFT não encontrado.')
          if (localStorage.getItem('kurio:scenario') === 'favorite-error')
            throw new ApiFault(
              503,
              'TRANSIENT_FAILURE',
              'Não foi possível atualizar o favorito. Tente novamente.',
            )
          const ids = new Set(database.favorites[user.id] ?? [])
          if (method === 'put') ids.add(String(params.id))
          else ids.delete(String(params.id))
          database.favorites[user.id] = [...ids]
          return HttpResponse.json(favoriteSnapshot(database, user.id))
        }),
      ),
    ),
  ),
  http.post('/api/testing/reset', () =>
    controlResponse(async () => {
      await resetDatabase()
      return HttpResponse.json({ status: 'reset' })
    }),
  ),
  http.get('/api/testing/scenario', () =>
    controlResponse(() =>
      HttpResponse.json({ scenario: localStorage.getItem('kurio:scenario') ?? 'default' }),
    ),
  ),
  http.post('/api/testing/session/expire', ({ cookies }) =>
    controlResponse(() =>
      transaction((database) => {
        const token = cookies.kurio_session
        if (token && database.sessions[token]) database.sessions[token].expiresAt = Date.now() - 1
        return HttpResponse.json({ status: 'expired' })
      }),
    ),
  ),
  http.put('/api/testing/scenario', ({ request }) =>
    controlResponse(async () => {
      const { scenario } = await parseBody(
        request,
        z.object({
          scenario: z.enum([
            'default',
            'slow',
            'catalog-error',
            'favorite-error',
            'cart-error',
            'session-expired',
            'register-conflict',
            'wallet-rejected',
            'payment-declined',
            'order-timeout',
            'order-pending',
            'out-of-order',
            'offline',
          ]),
        }),
      )
      if (scenario === 'default') localStorage.removeItem('kurio:scenario')
      else localStorage.setItem('kurio:scenario', scenario)
      return HttpResponse.json({ scenario })
    }),
  ),
]
