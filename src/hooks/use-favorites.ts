import { useMutation, useQuery } from '@tanstack/react-query'
import { problemFrom, sessionOptions } from '../api/account'
import { getFavorites, setFavorite, type Favorites } from '../api/cart'
import type { Nft } from '../api/catalog'
import { queryClient } from '../app/query-client'
import type { Session } from '../domain/account'
import { notifyFeedback, sessionGeneration } from '../auth/events'

export function useFavorites() {
  const session = useQuery(sessionOptions)
  const userId = session.data?.user?.id
  const queryKey = ['private', userId, 'favorites']
  const mutationKey = ['favorite-operation', userId]
  const generation = sessionGeneration()
  const favorites = useQuery({
    queryKey,
    queryFn: ({ signal }) => getFavorites(signal),
    enabled: Boolean(userId),
  })
  const stillCurrent = () =>
    generation === sessionGeneration() &&
    Boolean(userId) &&
    queryClient.getQueryData<Session>(['session'])?.user?.id === userId
  const mutation = useMutation({
    mutationKey,
    mutationFn: ({ nft, favorite }: { nft: Nft; favorite: boolean }) =>
      setFavorite(nft.id, favorite),
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Favorites>(queryKey)
      const wasFavorite = previous?.ids.includes(nft.id) ?? false
      if (stillCurrent())
        queryClient.setQueryData<Favorites>(queryKey, (data) => {
          const ids = (data?.ids ?? []).filter((id) => id !== nft.id)
          const items = (data?.items ?? []).filter((item) => item.id !== nft.id)
          return {
            ids: favorite ? [...ids, nft.id] : ids,
            items: favorite ? [...items, nft] : items,
          }
        })
      return { wasFavorite }
    },
    onError: (error, { nft }, context) => {
      if (stillCurrent()) notifyFeedback(problemFrom(error).message)
      if (stillCurrent())
        queryClient.setQueryData<Favorites>(queryKey, (current) => {
          const ids = (current?.ids ?? []).filter((id) => id !== nft.id)
          const items = (current?.items ?? []).filter((item) => item.id !== nft.id)
          return {
            ids: context?.wasFavorite ? [...ids, nft.id] : ids,
            items: context?.wasFavorite ? [...items, nft] : items,
          }
        })
    },
    onSuccess: (_data, { favorite }) => {
      if (stillCurrent())
        notifyFeedback(favorite ? 'NFT adicionado aos favoritos.' : 'NFT removido dos favoritos.')
    },
    onSettled: () => {
      if (stillCurrent() && queryClient.isMutating({ mutationKey }) === 1)
        void queryClient.invalidateQueries({ queryKey })
    },
  })
  return { favorites, mutation, user: session.data?.user, sessionLoading: session.isPending }
}
