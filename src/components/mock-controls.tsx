import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getMockScenario,
  mockScenarios,
  resetMocks,
  selectMockScenario,
} from '../api/mock-controls'
import { problemFrom } from '../api/account'
import { queryClient } from '../app/query-client'
import { Button } from './ui/button'

export function MockControls() {
  const scenario = useQuery({ queryKey: ['mock-scenario'], queryFn: getMockScenario })
  const select = useMutation({
    mutationFn: selectMockScenario,
    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
  })
  const reset = useMutation({
    mutationFn: resetMocks,
    onSuccess: () => {
      queryClient.clear()
      window.location.assign('/setup')
    },
  })
  return (
    <section className="mock-controls" aria-label="Controles da demonstração">
      <h2>Cenários da simulação</h2>
      <label htmlFor="mock-scenario">Condição de rede ou falha</label>
      <select
        id="mock-scenario"
        value={scenario.data?.scenario ?? 'default'}
        disabled={select.isPending || scenario.isPending}
        onChange={(event) => select.mutate(event.target.value)}
      >
        {mockScenarios.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p>
        O reset apaga contas e alterações da simulação e restaura os dois usuários de demonstração.
      </p>
      <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
        Restaurar dados de demonstração
      </Button>
      {(select.isError || reset.isError) && (
        <p role="alert">{problemFrom(select.error ?? reset.error).message}</p>
      )}
    </section>
  )
}
