import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { getHealth } from '../api/health'
import { Button } from '../components/ui/button'
import { useRealtimeHealth } from '../realtime/use-realtime-health'
import { MockControls } from '../components/mock-controls'

export function SetupPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: ({ signal }) => getHealth(signal) })
  const realtime = useRealtimeHealth()

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-300">
        Jungle Gaming · Etapa 1
      </p>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
        A base do marketplace começa aqui.
      </h1>
      <p className="mt-6 max-w-2xl leading-relaxed text-slate-300">
        Esta é uma tela técnica provisória. O marketplace será construído a partir do Figma do
        desafio. Primeiro, verificamos que a interface consegue conversar com a API e receber
        eventos pela rede.
      </p>
      <section aria-label="Verificações da base" className="my-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-3 font-semibold">API REST</h2>
          <div role="status" aria-live="polite">
            {health.isPending && (
              <div aria-label="Carregando API" className="shimmer h-6 w-40 rounded bg-slate-700" />
            )}
            {health.isSuccess && (
              <p className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-300" />
                API simulada conectada
              </p>
            )}
            {health.isError && <p>Não foi possível acessar a API. Tente novamente.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-3 font-semibold">Socket.IO</h2>
          <p role="status" aria-live="polite">
            {realtime === 'ready'
              ? 'Evento recebido via Socket.IO'
              : realtime === 'connecting'
                ? 'Conectando ao tempo real…'
                : 'Conexão interrompida'}
          </p>
        </div>
      </section>
      {import.meta.env.VITE_ENABLE_MOCKS !== 'false' && <MockControls />}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => void health.refetch()} disabled={health.isFetching}>
          Verificar API novamente
        </Button>
        <Button asChild variant="outline">
          <a
            href="https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1"
            target="_blank"
            rel="noreferrer"
          >
            Abrir layout no Figma <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </Button>
      </div>
    </main>
  )
}
