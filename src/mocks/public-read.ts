import { http, HttpResponse } from 'msw'
import { readDatabase, transaction } from './database'
import { sessionUser, cartOwner } from './session'
import { cartSnapshot } from './cart-state'
import { respond } from './http'
export const publicReadHandlers = [
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
  http.get('/api/cart', ({ cookies }) =>
    respond(() =>
      transaction((database) =>
        HttpResponse.json(cartSnapshot(database, cartOwner(database, cookies))),
      ),
    ),
  ),
]
