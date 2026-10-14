# Jungle Gaming Challenge

Implementação em andamento do [desafio frontend](https://github.com/junglegaming/frontend-challenge).

**Estado atual:** etapa 2, início responsivo, catálogo via MSW e detalhe parcial. Imagens originais e revisão de fidelidade visual estão pendentes. Conta, carrinho, pagamento e eventos de negócio ainda não foram implementados. A tela técnica está em `/setup`. Não há deploy público nem auditoria Lighthouse concluída.

## Executar

Requisitos: Node.js 22.18+ (ambiente atual: Node 24) e npm.

```bash
npm ci
npm run dev:mocks
```

O Vite informa o endereço local no terminal. Os mocks estão ativos por padrão, inclusive no build de demonstração. `.env.example` documenta `VITE_ENABLE_MOCKS`; definir `false` desativa os mocks e requer uma API real, que não faz parte do desafio. Nenhuma credencial real é necessária.

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run preview
npm run browsers:install
npm run test:e2e
npm run test:report
```

Em um Linux sem as bibliotecas necessárias ao Chromium, instale as dependências do Playwright conforme sua documentação. No ambiente de nuvem, essa necessidade será diagnosticada durante a execução.

Neste ambiente, o download de browsers de `cdn.playwright.dev` é bloqueado pela política de rede. Use o Chromium já instalado, sem precisar do comando `browsers:install`:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Esse override é opcional: em outra máquina, `npm run browsers:install` e `npm run test:e2e` usam o browser do Playwright normalmente. A versão do Chromium da nuvem deve ser registrada junto dos resultados.

Os testes atuais verificam a infraestrutura, busca, filtros, paginação, histórico, detalhe parcial e recuperação de falhas nas larguras 390, 768 e 1440. Dois testes unitários verificam a precisão dos valores ETH. Eles **não** constituem a cobertura funcional exigida para a entrega final. Relatórios HTML ficam em `playwright-report/`, e traces de falhas em `test-results/`. Os browsers ficam em `.cache/browsers/`, sem depender de escrita na pasta pessoal da máquina.

## Onde estudar

- [Roteiro dos dois dias](docs/ROTEIRO.md): ordem de implementação e critérios pendentes.
- [Primeira etapa explicada](docs/ETAPA-01.md): percurso da requisição, arquivos e exercício.
- [Segunda etapa explicada](docs/ETAPA-02.md): URL, filtros, mocks e precisão ETH.
- [Arquitetura](ARCHITECTURE.md): decisões atuais e limites da base.
- [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

## Publicação futura

Build: `npm run build`; diretório de saída: `dist`. Vercel é a opção inicial, com fallback de rotas em `vercel.json`. O arquivo `public/_redirects` prepara esse fallback para Netlify. A publicação e a validação de acesso direto às rotas ainda estão pendentes. Os mocks precisam permanecer ativos no deploy.

Contratos de negócio, credenciais fictícias, cenários, reset, regressão visual e auditorias serão documentados à medida que forem implementados. Não use esta etapa como entrega final.
