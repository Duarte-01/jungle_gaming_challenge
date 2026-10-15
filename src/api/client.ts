import axios from 'axios'
import { notifySessionExpired, sessionGeneration } from '../auth/events'

declare module 'axios' {
  interface AxiosRequestConfig {
    sessionGeneration?: number
  }
}

// Componentes nunca devem receber fixtures diretamente: REST sempre passa aqui.
export const api = axios.create({ baseURL: '/api', timeout: 10_000 })
api.interceptors.request.use((config) => {
  config.sessionGeneration = sessionGeneration()
  return config
})

api.interceptors.response.use(
  (response) => response,
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
