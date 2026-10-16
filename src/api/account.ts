import { isAxiosError } from 'axios'
import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type {
  ApiProblem,
  LoginInput,
  ProfileInput,
  RegisterInput,
  Session,
  User,
} from '../domain/account'

export async function getSession(signal?: AbortSignal): Promise<Session> {
  try {
    return (await api.get<Session>('/session', { signal })).data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401)
      return { user: null, expiresAt: null }
    throw error
  }
}

export const sessionOptions = queryOptions({
  queryKey: ['session'],
  queryFn: ({ signal }) => getSession(signal),
  staleTime: 30_000,
  retry: false,
})
export async function login(input: LoginInput) {
  return (await api.post<Session>('/auth/login', input)).data
}
export async function register(input: RegisterInput) {
  return (await api.post<Session>('/auth/register', input)).data
}
export async function logout() {
  await api.post('/auth/logout')
}
export async function updateProfile(input: ProfileInput) {
  return (await api.patch<User>('/profile', input)).data
}
export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  await api.put('/profile/password', input)
}

export function problemFrom(error: unknown): ApiProblem {
  if (isAxiosError<ApiProblem>(error) && error.response?.data?.message) return error.response.data
  if (isAxiosError(error) && error.code === 'ERR_BAD_RESPONSE')
    return {
      code: 'INVALID_RESPONSE',
      message: 'O serviço não respondeu corretamente. Tente novamente.',
    }
  return {
    code: 'NETWORK_ERROR',
    message: 'Não foi possível conectar. Confira sua conexão e tente novamente.',
  }
}
