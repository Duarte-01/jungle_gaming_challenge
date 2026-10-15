# Arquitetura em evolução

## Estado atual

Esta documentação descreve a base até a etapa 4. A página inicial segue a composição das capturas fornecidas e usa os quatro retratos originais. Conta, perfil, favoritos, carrinho, carteiras, checkout e pedidos estão implementados. A tela técnica fica em `/setup`. A comparação visual completa depende dos demais frames e da fonte do Figma.

## Responsabilidades

`app/` compõe os providers e as rotas; `pages/` contém as telas; `components/ui/` contém componentes adaptados do padrão shadcn/ui; `api/` contém contratos e transporte Axios; `mocks/` simula a rede com MSW; `realtime/` gerencia o cliente Socket.IO. Os componentes não têm uma alternativa local que retorna fixtures.

O MSW inicia antes do React. A configuração `VITE_ENABLE_MOCKS=false` desativa o worker. Os mocks ficam ativos por padrão no desenvolvimento e no build de demonstração. Não há backend privado.

## Contratos implementados nesta etapa

`GET /api/health` → `200 { status: "ok", service: "jungle-marketplace-mock" }`.

`GET /api/nfts?q=&category=&network=&min=0&max=100&sort=recent&tab=all&page=1` retorna itens, total, página, número de páginas e facets. Página contém até nove itens. Ordenações: `recent` (ordem estável de fixture), `price-asc`, `price-desc`, `name`; destaques: `all`, `new`, `trending`. `GET /api/nfts/:id` retorna um NFT com edições e disponibilidade, ou 404. Valores ETH são strings; filtros e ordenação de preço usam BigInt em wei.

Parâmetros são normalizados pelo Router e pelo MSW. Mudanças de filtro reiniciam a paginação. O cache da listagem usa todos os parâmetros na chave; a query passa AbortSignal ao Axios e mantém dados anteriores enquanto informa atualização. O detalhe usa chave por ID, sem retry para 404. O catálogo pertence ao mesmo banco local dos demais recursos; eventos invalidam as consultas afetadas.

Socket.IO: `health.check`/`health.ready` verifica a infraestrutura. `nft.updated`, `quote.updated` e `order.updated` notificam alterações de negócio. A inscrição privada é validada pelo cookie da conexão, não apenas pelo ID enviado pelo cliente.

## Política inicial de cache

TanStack Query: respostas frescas por 30 segundos, uma nova tentativa para queries e revalidação ao focar a janela. Mutations não têm retries automáticos. Pedido pode ser reenviado somente com a mesma chave e o mesmo conteúdo da tentativa salva. Queries passam AbortSignal ao Axios. Sessão não tem retry automático. Favoritos, carteiras e pedidos usam chaves por usuário; carrinho usa identidade de visitante ou usuário e staleTime zero. Queries e mutations privadas são removidas ao encerrar ou trocar a sessão. Rascunho e tentativa permanecem separados por usuário para recuperação após login.

## Transporte dos mocks

MSW 2 é usado por compatibilidade com o peer dependency de `@mswjs/socket.io-binding` 0.2. O cliente real `socket.io-client` conecta usando apenas WebSocket. A integração intercepta o protocolo e simula a abertura e os eventos; adicionamos heartbeat Engine.IO para manter a conexão. Não se pretende reproduzir salas, namespaces ou fallback HTTP polling. Os listeners são liberados no unmount.

Endpoint de transporte: `/realtime/`. As rotas são importadas dinamicamente após o início do MSW, porque o Engine.IO captura o construtor WebSocket na avaliação do módulo. O caminho dedicado evita interceptar o WebSocket do próprio Vite.

## Decisões e pendências

Vite simplifica desenvolvimento e build; Tailwind 4 participa pelo plugin do Vite. Um Button no padrão shadcn/ui usa Radix Slot, CVA e a composição `clsx`/`tailwind-merge`. As cores e fontes atuais são provisórias; dependem do acesso ao layout. Nenhuma substituição de asset do Figma foi aprovada ou avaliada.

Os testes iniciais exercitam rede e navegador, mas não comprovam o atendimento ao desafio. Lighthouse está instalado; os scripts específicos, as medições e a análise serão feitos sobre páginas funcionais e assets finais. O deploy ainda não foi executado.

Os contratos implementados estão em `docs/CONTRATOS.md`. `docs/ETAPA-04.md` explica compra e tempo real. Os registros das etapas anteriores descrevem o estado histórico; os PNGs então pendentes foram incorporados nesta etapa, conforme `docs/ASSETS.md`.

## Persistência e autenticação da simulação

`mocks/database.ts` mantém um banco versionado em `kurio:db:v1` com catálogo, contas, hashes, sessões, favoritos, carrinhos, carteiras, conexões, pedidos, chaves idempotentes e eventos. Novos campos são acrescentados sem apagar o banco anterior; carteiras das fixtures são criadas somente em banco novo/reset. Gravações passam por uma fila por instância para preservar alterações concorrentes. Esse mecanismo não é um servidor compartilhado nem oferece sincronização transacional entre abas; é uma persistência local para a demonstração.

Senhas fictícias usam PBKDF2/SHA-256 com 120.000 iterações e salt aleatório. Cookies separam visitante e sessão, com identificadores opacos; a expiração de 30 minutos é verificada nos handlers. O cookie do mock é legível por JavaScript e o banco local pode ser inspecionado pelo usuário da máquina: isso não representa segurança de backend em produção. Nenhuma senha em claro é persistida no banco e o logging detalhado de requisições do MSW está desativado.

O cliente trata 401, preserva o caminho interno para retomar o fluxo e usa gerações de sessão para descartar respostas de uma conta anterior. O retorno após login rejeita destinos externos, caracteres de controle e ciclos de autenticação. Hashes nunca são retornados pelos recursos de conta. Alteração de senha invalida as sessões da conta.

## Favoritos e carrinho

Favoritos atualizam o cache de forma otimista, guardam o estado anterior do item e fazem rollback se a API falhar. Rollback não substitui alterações em outros itens. A confirmação acessível é emitida após a resposta da API. A reconciliação é feita quando termina a última mutation concorrente de favoritos daquela conta. Avisos globais continuam visíveis se um card removido otimisticamente sair da árvore.

O carrinho deriva o proprietário dos cookies; o cliente não escolhe um userId. Operações do cliente usam um scope de mutation por identidade. O login combina itens por NFT/edição com o carrinho já salvo na conta, limita quantidades ao estoque e informa ajustes. Logout não transforma o carrinho da conta em carrinho visitante.

Cotação, desconto e taxa vêm da API e usam BigInt em wei; o transporte usa strings decimais. A regra fictícia inicial é KURIO10 (10%, truncado em wei) e 0.005 ETH por rede distinta. O token de versão inclui regras de preço, revisão do carrinho, NFTs e quantidades. A criação do pedido revalida essa versão, estoque, cupom e carteira; mudança exige nova revisão e confirmação.

## Compra e recuperação

Uma tentativa salva UUID e payload antes do primeiro POST. O handler associa chave e conteúdo normalizado ao usuário. Repetir a chave recupera o pedido; conteúdo diferente retorna 409. Só um pedido pendente é permitido por usuário. A confirmação visual depende do estado da API.

O pedido reserva estoque ao ser criado, guarda uma cópia independente dos itens, preços, cupom, taxas, carteira e coletor, e avança de pending para confirmed ou declined. Estados terminais não regridem. Confirmação subtrai apenas as quantidades compradas do carrinho atual; recusa devolve o estoque e preserva itens. Referência e recibo só aparecem após confirmed; o explorador interno é fictício.

Timeout da criação é 700 ms para tornar reproduzível o cenário didático em que o MSW salva o pedido e retarda a resposta por 1.500 ms. O cliente consulta a tentativa antes de permitir reenvio idempotente. Não é uma configuração sugerida para gateway real. Timers resolvem pedidos da demonstração; GET e reconexão também concluem estados vencidos após refresh.

## Eventos e reconexão

Eventos têm ID, sequência, recurso e versão. O cliente descarta IDs repetidos e versões antigas, compara também com o cache e invalida consultas REST. Eventos privados exigem usuário e geração de sessão atuais. Logout remove listeners e desconecta; o servidor mock verifica sessão e destinatário antes de emitir pedidos.

Reconexão revalida recursos REST ativos, sem depender de receber todo o histórico perdido. Pedidos pendentes têm polling de 1 s como recuperação adicional. O socket usa timeout de abertura de 1 s e backoff de 250–1.000 ms para recuperar interrupções de handshake na simulação. O painel de testes muda o banco via REST e transmite eventos pelo protocolo Socket.IO; não injeta os valores no cache dos componentes.

## Validação e desenvolvimento

Schemas Zod são usados no formulário e no handler. A API pode retornar erros de campo mesmo após validação no cliente, como e-mail em conflito e senha atual incorreta. Prettier padroniza a formatação; oxlint, TypeScript, testes unitários e Playwright verificam o código. As telas novas seguem a identidade provisória, com comparação aos frames correspondentes ainda pendente.

O painel em `/setup` altera cenários por REST e restaura as fixtures. Dados de negócio não são injetados diretamente nos componentes ou no cache pelos controles. Avisos internos sobre respostas HTTP continuam separados dos eventos de negócio Socket.IO. Testes verificam respostas, interface e persistência usando os handlers reais da simulação.
