import axios from 'axios'
import { notifySessionExpired, sessionGeneration } from '../auth/events'

declare module 'axios' {
  interface AxiosRequestConfig {
    sessionGeneration?: number
  }
}

// Componentes nunca devem receber fixtures diretamente: REST sempre passa aqui.
export const api = axios.create({ baseURL: '/api', timeout: 10_000 })
let prepareTransport: (() => Promise<void>) | undefined

export function setTransportReadiness(prepare: () => Promise<void>) {
  prepareTransport = prepare
  return () => {
    if (prepareTransport === prepare) prepareTransport = undefined
  }
}

api.interceptors.request.use(async (config) => {
  config.sessionGeneration = sessionGeneration()
  await prepareTransport?.()
  if (config.sessionGeneration !== sessionGeneration())
    throw new axios.CanceledError('A conta mudou antes do envio da solicitação.')
  return config
})

api.interceptors.response.use(
  (response) => {
    if (
      response.status !== 204 &&
      !/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(
        String(response.headers['content-type'] ?? ''),
      )
    )
      throw new axios.AxiosError(
        'O serviço não respondeu corretamente. Tente novamente.',
        axios.AxiosError.ERR_BAD_RESPONSE,
        response.config,
        response.request,
        response,
      )
    return response
  },
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.sessionGeneration === sessionGeneration() &&
      !/^\/auth\/(?:login|register)$/.test(error.config?.url ?? '')
    )
      notifySessionExpired()
    return Promise.reject(error)
  },
)
