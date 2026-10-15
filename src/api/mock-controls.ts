import { api } from './client'

export const mockScenarios = [
  { value: 'default', label: 'Padrão' },
  { value: 'slow', label: 'Rede lenta' },
  { value: 'catalog-error', label: 'Falha no catálogo' },
  { value: 'favorite-error', label: 'Falha ao salvar favorito' },
  { value: 'cart-error', label: 'Falha ao atualizar carrinho' },
  { value: 'session-expired', label: 'Sessão expirada' },
  { value: 'register-conflict', label: 'Conflito no cadastro' },
  { value: 'offline', label: 'Falha de conexão' },
] as const

export async function getMockScenario() {
  return (await api.get<{ scenario: string }>('/testing/scenario')).data
}
export async function selectMockScenario(scenario: string) {
  return (await api.put('/testing/scenario', { scenario })).data
}
export async function resetMocks() {
  await api.post('/testing/reset')
}
