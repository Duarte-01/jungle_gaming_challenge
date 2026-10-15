import { redirect } from '@tanstack/react-router'
import { sessionOptions } from '../api/account'
import { queryClient } from '../app/query-client'
import { safeReturnTo } from '../domain/account'

export async function requireSession({ location }: { location: { href: string } }) {
  const session = await queryClient.fetchQuery({ ...sessionOptions, staleTime: 0 })
  if (!session.user)
    throw redirect({ to: '/login', search: { redirect: safeReturnTo(location.href) } })
  return { user: session.user }
}
