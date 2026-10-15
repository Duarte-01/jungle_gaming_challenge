import { queryClient } from '../app/query-client'
import type { Session } from '../domain/account'
import { advanceSessionGeneration, authEvents } from './events'

export async function discardUserData() {
  const filter = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] === 'private' || query.queryKey[0] === 'cart',
  }
  await queryClient.cancelQueries(filter)
  queryClient.removeQueries(filter)
  for (const mutation of queryClient.getMutationCache().getAll()) {
    if (
      ['private', 'cart-operation', 'favorite-operation'].includes(
        String(mutation.options.mutationKey?.[0]),
      )
    )
      queryClient.getMutationCache().remove(mutation)
  }
}

export async function acceptSession(session: Session) {
  advanceSessionGeneration()
  await queryClient.cancelQueries({ queryKey: ['session'] })
  queryClient.setQueryData<Session>(['session'], { user: null, expiresAt: null })
  await discardUserData()
  queryClient.setQueryData(['session'], session)
  authEvents.dispatchEvent(new Event('authenticated'))
}

export async function forgetSession() {
  advanceSessionGeneration()
  queryClient.setQueryData<Session>(['session'], { user: null, expiresAt: null })
  await queryClient.cancelQueries({ queryKey: ['session'] })
  await discardUserData()
}
