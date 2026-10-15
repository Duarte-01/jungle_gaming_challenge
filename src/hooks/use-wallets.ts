import { useMutation, useQuery } from '@tanstack/react-query'
import { sessionOptions } from '../api/account'
import {
  connectWallet,
  disconnectWallet,
  getConnection,
  getWallets,
  saveWallet,
} from '../api/checkout'
import { queryClient } from '../app/query-client'
import type { Wallet, WalletInput } from '../domain/checkout'
import type { Session } from '../domain/account'
import { sessionGeneration } from '../auth/events'

export function useWallets(onSaveStatus?: (message: string) => void) {
  const session = useQuery(sessionOptions)
  const userId = session.data?.user?.id
  const generation = sessionGeneration()
  const current = () =>
    generation === sessionGeneration() &&
    queryClient.getQueryData<Session>(['session'])?.user?.id === userId
  const prefix = ['private', userId]
  const wallets = useQuery({
    queryKey: [...prefix, 'wallets'],
    queryFn: ({ signal }) => getWallets(signal),
    enabled: Boolean(userId),
  })
  const connection = useQuery({
    queryKey: [...prefix, 'connection'],
    queryFn: ({ signal }) => getConnection(signal),
    enabled: Boolean(userId),
    staleTime: 0,
  })
  const save = useMutation({
    mutationKey: [...prefix, 'save-wallet'],
    mutationFn: ({ input, id }: { input: WalletInput; id?: string }) => saveWallet(input, id),
    onMutate: () => {
      if (current()) onSaveStatus?.('')
    },
    onSuccess: async () => {
      if (current()) {
        onSaveStatus?.('Carteira salva.')
        await queryClient.invalidateQueries({ queryKey: prefix })
      }
    },
  })
  const connect = useMutation({
    mutationKey: [...prefix, 'connect-wallet'],
    mutationFn: ({
      id,
      network,
      provider,
    }: {
      id: string
      network: Wallet['network']
      provider?: Wallet['provider']
    }) => connectWallet(id, network, provider),
    onSuccess: (value) => {
      if (current()) queryClient.setQueryData([...prefix, 'connection'], value)
    },
  })
  const disconnect = useMutation({
    mutationKey: [...prefix, 'disconnect-wallet'],
    mutationFn: disconnectWallet,
    onSuccess: () => {
      if (current()) queryClient.setQueryData([...prefix, 'connection'], null)
    },
  })
  return { wallets, connection, save, connect, disconnect, user: session.data?.user }
}
