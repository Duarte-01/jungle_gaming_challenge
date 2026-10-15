# Evidências de validação

**Resultado atual: etapa 4, ao final deste documento.** As etapas anteriores são registros históricos; suas listas de pendências descrevem a versão daquela data.

## Etapa 1 — infraestrutura

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

## Etapa 2 — início e catálogo

Após as capturas fornecidas pelo candidato, foram adicionados início responsivo, listagem de 36 NFTs, filtros na URL e detalhe parcial.

- TypeScript, lint sem avisos e build: passaram.
- Precisão ETH: **2 testes unitários passaram**.
- E2E da infraestrutura e catálogo: **21 testes passaram** (7 casos em cada uma das larguras 390, 768 e 1440).
- A execução final de E2E usou o build de produção com `E2E_PREVIEW=true`, concluída em 33 segundos. Uma execução anterior também passou no servidor de desenvolvimento.

Cobertura adicionada: busca e histórico, refresh, filtros combinados, ordenação, paginação, detalhe direto, NFT inexistente, edição esgotada, carregamento lento, erro MSW 503 e nova tentativa. O mobile também verifica o foco do diálogo de filtros e o retorno do foco após Escape.

Os retratos originais ainda faltam. As capturas locais da interface mostram fallbacks, portanto esta execução **não valida fidelidade visual**, assets finais, Lighthouse, favoritos, sessão, carrinho ou compra. Não há baselines visuais finais nem deploy público.

## Etapa 3 — sessão, favoritos, carrinho e perfil

Ambiente: Node.js 24.19.0, Chromium do sistema 154.0.8037.57, Playwright 1.64.1. A execução final usou o build otimizado (`E2E_PREVIEW=true`) e dois workers.

- Build e TypeScript: passaram.
- Lint: passou, sem avisos.
- Prettier: passou.
- Testes unitários: **3 passaram** (precisão ETH e validação do retorno após login).
- Playwright: **57 passaram**, sem falhas ou skips, em aproximadamente 1,4 minuto. São 19 casos em cada um dos três viewports, não 57 cenários diferentes.

Os 12 casos adicionados por viewport verificam cadastro e confirmação de senha, conflito de e-mail e login inválido, carrinho visitante persistente, combinação com carrinho existente e ajuste de estoque, cupons e quantidades, favoritos otimistas e rollback, troca de usuário, expiração e retomada, falha de mutation, perfil/avatar/senha, negação de recursos privados e reset.

O teste de reset espera a interface comprovar o início do MSW antes de emitir requisições de controle, e aguarda o reload real após a restauração. O teste de favoritos aguarda a confirmação posterior à resposta da API antes de recarregar a página. As asserções incluem interface, respostas HTTP e persistência, sem substituir os handlers MSW por respostas do Playwright.

As evidências atuais não validam carteiras, compra idempotente, pagamento, recibos, eventos de negócio, reconexão de pedido, regressão visual final, Lighthouse ou deploy público. As imagens aparecem no chat, mas os arquivos originais ainda não estão acessíveis ao checkout. A composição das novas telas também depende dos frames correspondentes do Figma.

## Etapa 4 — imagens, carteiras, checkout e pedidos

Execução em 15/10/2026, Linux, Node.js 24.19.0, Chromium do sistema 154.0.8037.57, Playwright 1.64.1. A suíte completa usou o build otimizado com `E2E_PREVIEW=true` e dois workers.

- TypeScript e build: passaram.
- Lint: passou, sem avisos.
- Testes unitários: **3 passaram**.
- Playwright: **99 passaram**, sem falhas, skips ou testes desabilitados, em aproximadamente 3,6 minutos. São **33 casos em três viewports** (390, 768 e 1440 px).
- Instalação reproduzida com `npm ci`; TypeScript, lint, Prettier, unitários e build passaram após reinstalar, mantendo os mesmos hashes dos bundles testados.
- Os quatro PNGs originais foram incorporados sem transformação; hashes em `ASSETS.md`. O teste verifica as nove imagens da primeira página e a busca mais recente sob latências diferentes, com cancelamento da requisição anterior.

Os 13 novos casos de compra em cada viewport verificam:

1. Expiração no checkout, preservação do telefone, novo login e reenvio da mesma tentativa.
2. Compra confirmada pela API, recibo, refresh, explorador fictício e carrinho sem os itens comprados.
3. Clique repetido, replay da mesma chave e conflito ao mudar o conteúdo, com um único pedido.
4. Timeout após criação e recuperação do mesmo pedido.
5. Recusa sem recibo e nova compra somente após revisão.
6. Preço atualizado pelo Socket.IO, confirmação antiga bloqueada, eventos duplicados e antigos.
7. Estoque esgotado durante a revisão, com bloqueio e carrinho preservado.
8. Cupom expirado e taxa alterada, exigindo nova revisão.
9. Pedido pendente, interrupção real do transporte simulado, reconexão, refresh e proteção de estado terminal.
10. Snapshot do recibo independente do preço atual e preservação de item adicionado depois da compra.
11. Recusa de conexão da carteira, rede incompatível e desconexão.
12. Validação, edição, cadastro, persistência e conflito de função das carteiras, com isolamento entre contas.
13. Acesso negado ao pedido de outro titular e lista privada vazia para outra conta.

As requisições atravessam o MSW real do projeto. Os controles REST alteram o banco da simulação; eventos percorrem o binding Socket.IO. Não há respostas de negócio injetadas por `page.route` ou alterações diretas do cache para fazer a suíte passar.

A inspeção adicional gerou capturas de início, pagamento revisado e recibo nas três larguras. Pagamento, recibo e carteiras não apresentaram overflow horizontal. Foram inspecionadas visualmente as capturas mobile de início, pagamento e recibo. Isso **não é regressão visual com baseline nem validação de fidelidade ao Figma**; as demais telas de referência ainda faltam.

O timeout de abertura do socket foi ajustado para 1 s após reproduzir uma interrupção durante o handshake. Os testes de reconexão foram repetidos com o transporte real da simulação e passaram; o estado não foi substituído por um controle direto da interface.

O relatório HTML local da execução completa fica em `playwright-report/index.html`. Os resultados e capturas temporárias não são artefatos finais versionados. Ainda faltam baselines visuais, auditorias Lighthouse com relatórios e medianas, comparação dos demais frames e validação de deploy público. Não há evidência de conclusão desses requisitos.
