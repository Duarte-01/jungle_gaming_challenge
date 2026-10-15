import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '../app/query-client'
import { sessionOptions } from '../api/account'
import {
  addCartItem,
  applyCoupon,
  getCart,
  removeCartItem,
  removeCoupon,
  setCartQuantity,
  type Cart,
} from '../api/cart'
import type { Session } from '../domain/account'
import { sessionGeneration } from '../auth/events'

type CartOperation =
  | { action: 'add'; nftId: string; editionId: string; quantity: number }
  | { action: 'quantity'; key: string; quantity: number }
  | { action: 'remove'; key: string }
  | { action: 'coupon'; code: string }
  | { action: 'remove-coupon' }

export function useCart() {
  const session = useQuery(sessionOptions)
  const identity = session.data?.user?.id ?? 'guest'
  const queryKey = ['cart', identity]
  const generation = sessionGeneration()
  const cart = useQuery({
    queryKey,
    queryFn: ({ signal }) => getCart(signal),
    enabled: session.isSuccess,
    staleTime: 0,
  })
  const mutation = useMutation({
    scope: { id: `cart:${identity}` },
    mutationKey: ['cart-operation', identity],
    mutationFn: (operation: CartOperation) => {
      switch (operation.action) {
        case 'add':
          return addCartItem(operation)
        case 'quantity':
          return setCartQuantity(operation.key, operation.quantity)
        case 'remove':
          return removeCartItem(operation.key)
        case 'coupon':
          return applyCoupon(operation.code)
        case 'remove-coupon':
          return removeCoupon()
      }
    },
    onSuccess: (data: Cart) => {
      const current = queryClient.getQueryData<Session>(['session'])?.user?.id ?? 'guest'
      if (current === identity && generation === sessionGeneration())
        queryClient.setQueryData(queryKey, data)
    },
    onSettled: () => {
      const current = queryClient.getQueryData<Session>(['session'])?.user?.id ?? 'guest'
      if (current === identity && generation === sessionGeneration())
        void queryClient.invalidateQueries({ queryKey })
    },
  })
  return { cart, mutation, identity, session }
}
