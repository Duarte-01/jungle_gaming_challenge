import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { sessionOptions } from '../api/account'
import { queryClient } from '../app/query-client'
import { authEvents } from './events'
import { forgetSession } from './session-cache'

export function SessionSync() {
  const router = useRouter()
  const session = useQuery(sessionOptions)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let handling = false
    const expire = () => {
      if (handling) return
      handling = true
      const current = `${window.location.pathname}${window.location.search}`
      void forgetSession()
        .then(() => {
          setNotice('Sua sessão expirou. Entre novamente para continuar.')
          if (
            /^\/(perfil|favoritos|carteiras|pagamento|pedidos|carrinho)(?:\/|[?]|$)/.test(current)
          ) {
            void router.navigate({ to: '/login', search: { redirect: current }, replace: true })
          }
        })
        .finally(() => {
          handling = false
        })
    }
    authEvents.addEventListener('expired', expire)
    const authenticated = () => setNotice('')
    const feedback = (event: Event) => setNotice((event as CustomEvent<string>).detail)
    authEvents.addEventListener('authenticated', authenticated)
    authEvents.addEventListener('feedback', feedback)
    return () => {
      authEvents.removeEventListener('expired', expire)
      authEvents.removeEventListener('authenticated', authenticated)
      authEvents.removeEventListener('feedback', feedback)
    }
  }, [router])
  useEffect(() => {
    if (!session.data?.expiresAt) return
    const timeout = setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: ['session'] }),
      Math.max(0, session.data.expiresAt - Date.now()) + 50,
    )
    return () => clearTimeout(timeout)
  }, [session.data?.expiresAt])
  const mergeNotices = session.data?.notices?.join(' ')
  if (session.isError)
    return (
      <div className="session-notice" role="alert">
        {session.data?.user
          ? 'Não foi possível recuperar sua sessão.'
          : 'Não foi possível verificar seu acesso. Tente novamente.'}
        <button type="button" disabled={session.isFetching} onClick={() => void session.refetch()}>
          {session.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
        </button>
      </div>
    )
  if (!notice && !mergeNotices) return null
  return (
    <div className="session-notice" role="status">
      {notice || mergeNotices}
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => {
          setNotice('')
          queryClient.setQueryData(['session'], (current: typeof session.data) =>
            current ? { ...current, notices: [] } : current,
          )
        }}
      >
        ×
      </button>
    </div>
  )
}
