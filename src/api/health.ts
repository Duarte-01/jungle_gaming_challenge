import { api } from './client'
import type { HealthResponse } from './contracts'

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health', { signal })
  return data
}
