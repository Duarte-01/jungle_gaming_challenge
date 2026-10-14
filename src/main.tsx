import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from './app/query-client'
import './index.css'

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'warn' })
  }
  // Socket.IO captura WebSocket ao importar. Carregue as rotas após a interceptação.
  const { router } = await import('./app/router')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  document.getElementById('root')!.textContent = 'Falha ao iniciar o ambiente. Verifique a configuração dos mocks e recarregue a página.'
})
