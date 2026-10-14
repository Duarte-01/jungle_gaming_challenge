# Evidências da etapa 1

Execução: 14/10/2026, ambiente Linux de desenvolvimento na nuvem.

Ferramentas: Node.js 24.19.0, npm 11.9.0, Playwright 1.64.1, Chromium do sistema 154.0.8037.57.

- Build de produção: passou.
- TypeScript: passou.
- Lint: passou.
- Playwright: **6 testes passaram**, 2 por viewport (390, 768 e 1440 px).
- A mesma suíte também passou no build otimizado servido por `vite preview`: **6 testes passaram**. São os mesmos casos em dois modos, não 12 comportamentos distintos.
- Instalação reproduzida com `npm ci`; typecheck, lint e build passaram após a reinstalação.

Os testes demonstram a resposta HTTP interceptada pelo MSW e um evento trafegando pelo cliente Socket.IO, nova consulta, refresh, retorno de rota inexistente e ausência de overflow horizontal na tela provisória. Contextos de browser são isolados por teste.

Comando usado para E2E:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Para repetir no build otimizado:

```bash
npm run build
E2E_PREVIEW=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

O download do Chromium do Playwright foi bloqueado pelo proxy (`403 Domain forbidden` para `cdn.playwright.dev`). O override documentado usa o Chromium já instalado; isso não é validação com o binário originalmente vinculado à versão do Playwright. Nenhuma verificação TLS foi desativada.

Não executados nesta etapa: os fluxos funcionais do marketplace, regressão visual com o Figma, auditorias Lighthouse e validação de deploy. Não há evidência de conclusão desses requisitos.

Relatório HTML da execução atual: `playwright-report/index.html`, gerado localmente e ignorado pelo Git. A entrega final precisará incluir os relatórios requeridos de maneira reproduzível.
