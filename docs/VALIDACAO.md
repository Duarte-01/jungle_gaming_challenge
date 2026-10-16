# Evidências de validação

**Resultado atual: etapa 8, ao final deste documento.** As etapas anteriores são registros históricos; suas listas de pendências descrevem a versão daquela data.

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

## Etapa 5 — frames, campos, acessibilidade e evidências

Execução em 15/10/2026, Debian 13, Node.js 24.19.0, npm 11.9.0, Playwright 1.64.1 e Chromium do sistema 154.0.8037.57. Build de produção, quatro workers, retries desativados.

- TypeScript, lint sem avisos, formatação e build: passaram.
- Unitários: **3 passaram**, sem falhas ou skips.
- Playwright: **129 passaram**, sem falhas, skips ou casos flaky, em aproximadamente 3,7 minutos. São 43 casos em cada uma das larguras 390, 768 e 1440 px.
- Os 129 incluem **12 comparações de screenshots**: início, detalhe, carrinho e pagamento nos três tamanhos. As baselines foram criadas, inspecionadas e depois comparadas sem `--update-snapshots`.
- `npm ci` foi reproduzido com o novo lockfile; checks e build passaram após a reinstalação. As correções posteriores também passaram pela verificação de tipos/lint/build e pela suíte acima.
- Integridade confirmada dos 13 PNGs de referência e dos quatro retratos originais. Fontes são locais e têm licença incluída.

Comando da suíte completa:

```bash
CI=true E2E_PREVIEW=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --workers=4 --retries=0
```

O relatório HTML dessa execução está preservado em `reports/playwright/index.html`. `reports/validation.json` contém estatísticas extraídas do próprio relatório, condições e hashes do build. Os relatórios normais continuam sendo gerados em `playwright-report/`.

Uma execução anterior terminou com 128 aprovações e uma falha de clique no favorito mobile: o aviso global de erro cobria o controle. O teste seguinte passou a fechar o aviso pelo botão disponível antes da nova tentativa, preservando as verificações de falha, rollback e persistência. A execução anterior, seu screenshot e trace estão em `reports/playwright-before-notice-dismiss/`; ela não é apresentada como aprovada. Os testes não usam force click, respostas de negócio via `page.route`, troca de cache ou setters de UI para contornar os fluxos.

Além dos 12 grupos do enunciado cobertos pela suíte anterior, a etapa acrescenta galeria e retorno de foco, abas por teclado, estabilidade do detalhe lento, validação/persistência dos novos campos de perfil, reconexão e nova revisão ao trocar provedor, snapshot de dados do colecionador, mostrar/ocultar senha, feedback de ações fora do escopo e ausência de overflow nas telas da conta. O cadastro com e-mail de identificador curto também consegue salvar o perfil gerado. A busca desktop é aberta pelo ícone real, preserva filtros e volta aberta após refresh. Quantidade digitada no carrinho é confirmada por Enter.

As referências e diferenças visuais estão em `DESIGN.md`. As baselines verificam regressão da implementação; não são prova de igualdade pixel a pixel com o Figma. Fonte original não fornecida. A performance e as 12 auditorias Lighthouse são detalhadas em `PERFORMANCE.md`. A publicação pública e sua validação continuam pendentes da conta/autorização do usuário; configuração de hospedagem não é evidência de deploy. O workflow do GitHub foi preparado, mas sua execução remota ainda não foi validada.

O servidor de desenvolvimento foi reiniciado após a instalação. Um contexto de browser novo completou o caminho catálogo → detalhe → carrinho → login → pagamento → confirmação → refresh do recibo, seguido da verificação REST/Socket.IO em `/setup`, sem erros JavaScript. Isso valida a execução atual de desenvolvimento, além do build E2E; não comprova o deploy público. O lint exclui `reports/**`, que contém JavaScript gerado do visualizador de traces do Playwright; o código da aplicação, testes, scripts e configurações continuam sendo analisados.

## Etapa 6 — reprodução da CI e validação antes da publicação

Execução em 15/10/2026. Container Debian 13, Node.js 24.19.0, npm 11.17.0, Chromium 155.0.8059.39 e Playwright 1.64.1. A instalação limpa também foi reproduzida em diretório novo dentro do container, incluindo o módulo nativo Sharp/libvips. O build desta validação foi produzido com Node 24.19.0/npm 11.9.0 no mesmo checkout Linux; a CI instala e constrói dentro do container.

- `npm ci`, TypeScript, lint, formatação e build: passaram.
- Unitários: **4 passaram**, sem falhas/skips, incluindo rejeição de evento de rede malformado.
- E2E no build de produção: **129 passaram**, sem falhas, skips, flaky ou retries, em aproximadamente 5,5 minutos, com dois workers. São 43 casos em cada uma das larguras 390, 768 e 1440.
- As **12 comparações visuais** passaram. Antes das mudanças de design, as 12 baselines antigas já tinham passado no novo container sem alteração. Após a revisão das medidas fornecidas pelo candidato, somente início desktop foi atualizado: o diff ficou restrito ao destaque, sem mudança das tolerâncias. As outras 11 capturas permanecem intactas.
- A compra completa agora percorre os links reais de catálogo → detalhe → carrinho → pagamento → recibo. As demais condições de erro, isolamento e eventos continuam exercitando MSW/Axios e o cliente Socket.IO.
- A verificação de conta desktop inclui largura CSS 720 equivalente ao reflow de uma janela de 1440 com zoom 200%. Ela verifica overflow e conteúdo de perfil/carteiras/pedidos; não é uma emulação de todos os efeitos do zoom físico do navegador.
- Os quatro PNGs originais não foram alterados. Os nove cards são verificados com as imagens AVIF realmente decodificadas. WebP sem perda é comparado aos pixels RGBA dos originais durante a geração.

Relatório completo desta execução: `reports/playwright/index.html`. Estatísticas extraídas do próprio relatório, ferramentas e hashes do build: `reports/validation.json`. Comando reproduzível em `ci/README.md`. O histórico da falha de aviso mobile da etapa anterior permanece preservado e identificado; não é apresentado como execução aprovada.

O run remoto anterior `38686726917` falhou em 12 screenshots, com 117 outros testes aprovados. O ambiente de renderização anterior diferia: baselines Debian/Chromium 154 e runner Ubuntu/browser Playwright 156. A CI passou a usar o container fixado, e o Lighthouse deixou de depender exclusivamente de workflow_dispatch. Ambos os jobs executam independentemente em push/PR; upload de artefatos continua com always. A aprovação local não é apresentada como aprovação desse run antigo.

As auditorias completas, seus alvos e condições estão em `PERFORMANCE.md`. Fonte original continua desconhecida: `font/family` não revelou o valor no Figma. As medidas fornecidas foram aplicadas, e as diferenças declaradas estão em `DESIGN.md`. A matriz de exigências e evidências está em `REQUISITOS.md`. Por solicitação do candidato, não foi feito merge na main nem deploy; o domínio público ainda precisa ser validado na etapa posterior.

As 12 auditorias atuais terminaram com código 0: medianas de performance início/detalhe mobile 90/91 e desktop 100/100; acessibilidade, boas práticas e SEO 100 nas quatro combinações. A matriz completa foi conferida e os hashes de dist coincidem com os E2E. Metas e condições não foram reduzidas.

O servidor de desenvolvimento foi iniciado novamente em 5173. Em contexto novo com Chromium do sistema 154, foram verificados REST e Socket.IO em /setup, nove retratos AVIF decodificados, navegação catálogo → detalhe e ausência de erros JavaScript. Os estilos computados confirmaram as três medidas fornecidas pelo candidato para o destaque desktop. Essa verificação é da instância atual; não comprova restauração em nova máquina nem domínio publicado.

## Etapa 7 — revisão dos frames e nova validação completa

Execução em 15/10/2026, sobre o build otimizado, usando o mesmo container Debian 13/Chromium 155/Playwright 1.64.1 da CI.

- TypeScript, lint, formatação e build: passaram.
- Unitários: **4 passaram**, sem falhas ou skips.
- Playwright: **135 passaram**, sem falhas, flaky, retries ou skips, em **329,6 segundos**, com dois workers. São **45 casos em cada uma das larguras 390, 768 e 1440**, incluindo as **12 comparações visuais**.
- A execução completa usou comparação normal; não usou `--update-snapshots`. As baselines foram atualizadas antes, após inspeção dos ajustes contra as referências. Tolerâncias não foram ampliadas e asserções não foram removidas.
- Novo cenário do slider verifica duas alças, teclado, limites sem inversão, parâmetros REST, refresh, limpeza, clique na trilha e arraste. Novo cenário de conta sem carteiras cria o primeiro registro pelo formulário inicialmente aberto e confirma feedback e persistência. O pagamento mobile verifica expansão/recolhimento dos itens mantendo o total.
- O input de avatar foi corrigido para não causar overflow em reflow/zoom. O teste de perfil continua enviando uma imagem real, verificando decodificação, persistência e erros da API.
- Os 13 frames originais mantêm seus hashes SHA-256. Não foram substituídos por capturas da implementação. A comparação manual e as limitações de fonte/resolução estão em `DESIGN.md`.

Relatório atual: `reports/playwright/index.html`. Estatísticas extraídas do próprio HTML e hashes dos 56 arquivos de `dist`: `reports/validation.json`. Comando: o container documentado executou `npm run test:e2e -- --workers=2 --retries=0`, com `CI=true` e `E2E_PREVIEW=true`.

As **12 auditorias Lighthouse finais concluíram com código 0**. Medianas de performance: início/detalhe mobile **90/91**, desktop **100/100**. Acessibilidade, boas práticas e SEO: **100** nas quatro combinações. Os hashes dos 56 arquivos de `dist` em `reports/lighthouse/summary.json` coincidem com os de `reports/validation.json`. Metas e configuração de medição não foram reduzidas. Métricas LCP/CLS/TBT e condições estão em `PERFORMANCE.md`.

A revisão dos seis critérios eliminatórios está em `REQUISITOS.md`. Fonte original, validação humana de fidelidade e deploy público continuam separados dos checks automáticos. Main e publicação permanecem suspensos por solicitação do candidato. Os checks remotos devem ser conferidos no commit correspondente; aprovação local não é apresentada como execução remota.

### Reprodução do erro de construção remota

O run `38804230419`, do commit `04ecde3`, falhou nos dois passos de Docker build, antes dos testes/auditorias. Uma construção local sem cache reproduziu `Version '155.0.8059.39-1~deb13u1' ... was not found`: o índice APT tinha substituído a versão fixada. Isso não é registrado como falha de um teste da aplicação nem como Lighthouse executado.

A instalação foi corrigida para baixar os pacotes oficiais exatos por HTTPS e validar os SHA-256 versionados. Os arquivos de execução e scripts de manutenção conferidos coincidem com a imagem anterior (47 itens, sem diferenças; oito arquivos de documentação omitidos pela imagem slim). A construção limpa da imagem `kurio-validation:chromium-155-reproducible` concluiu com código 0; o preflight CDP e as **12 comparações visuais passaram sem atualizar qualquer baseline** em 21,6 segundos. Os dois jobs da CI repetem instalação limpa, build e validação nessa configuração.

Os relatórios de 135 E2E e 12 Lighthouse acima foram produzidos com a imagem anterior já preparada, contendo a mesma versão do browser; a aplicação e os 56 hashes de `dist` não mudaram nesta correção de instalação. O workflow também passou a guardar o log da própria construção Docker, com status de erro preservado por `bash`/`pipefail`, para que uma falha nesse passo não deixe o resumo sem diagnóstico. Detalhes de download, integridade, certificado do proxy e fonte alternativa em `ci/README.md`.

## Etapa 8 — cancelamento, recuperação e campos do pagamento

Execução final no build otimizado, com `CI=true`, `E2E_PREVIEW=true`, dois workers e `--retries=0`, no container `kurio-validation:chromium-155-reproducible` (Node 24.19.0, Chromium 155.0.8059.39 / Debian 13). **150 E2E passaram em 358.1 s**, correspondendo a 50 casos em desktop 1440 px, tablet 768 px e mobile 390 px. Não houve falhas, skips, retries ou flaky. Tipos, lint, formatação, build e quatro unitários também passaram.

Cinco novos casos por viewport cobrem links do rodapé/navegação mobile, rotas privadas abertas diretamente, cancelamento pelo X e Escape, carrinho preservado após cancelar pagamento e atualizar o login, falha no download do módulo e falha de sessão ao voltar à aba. O teste de pagamento confere a ordem dos rótulos e observa o endereço secundário no snapshot REST do pedido. Os testes do catálogo verificam texto editorial e cor branca da faixa.

O X antes tentava o destino protegido e era redirecionado de volta ao login. Agora cancela para uma página pública, enquanto o sucesso mantém o destino solicitado. A recuperação de erro fatal recarrega o documento para descartar importações rejeitadas pelo React.lazy. As simulações de rede passaram; a causa exata do episódio raro relatado pelo candidato permanece não confirmada.

Uma rodada intermediária encontrou o X oculto no mobile e seletores que precisavam acompanhar os controles responsivos. O X foi tornado visível; os testes passaram a usar a troca de cadastro disponível no mobile, o link da mensagem de confirmação do carrinho e a expansão do perfil antes de alterar a rede. Os 15 novos cenários foram aprovados nos três tamanhos antes da execução completa final.

Oito baselines foram atualizadas após revisão das mudanças visuais de texto, cor e formulário. A execução completa acima repetiu as **12 comparações visuais sem `--update-snapshots`**, sem relaxar tolerâncias. Os 13 frames originais continuam com os mesmos hashes do manifesto.

As **12 medições Lighthouse concluíram com código 0 e todas as metas atendidas**. Performance: home/mobile: 90; home/desktop: 100; detail/mobile: 91; detail/desktop: 100. Os resultados das demais categorias estão na tabela de `PERFORMANCE.md`. Os 56 hashes de `dist` coincidem nos resumos de Playwright e Lighthouse. Resultados individuais e condições em `PERFORMANCE.md`.

Os relatórios correntes de `reports/playwright`, `reports/validation.json` e `reports/lighthouse` pertencem a esta etapa. Os relatos de etapas anteriores acima são históricos. Os checks remotos precisam corresponder ao commit revisado; não se confunde aprovação local com CI. Main e deploy público continuam suspensos por solicitação do candidato.
