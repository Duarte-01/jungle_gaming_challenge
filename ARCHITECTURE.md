# Arquitetura em evolução

## Estado atual

Esta documentação descreve a base até a etapa 6. A página inicial segue a composição das capturas fornecidas e usa os quatro retratos originais. Conta, perfil, favoritos, carrinho, carteiras, checkout e pedidos estão implementados. A tela técnica fica em `/setup`. Os 13 frames recebidos foram usados na revisão; fonte original não fornecida, substituições e desvios conhecidos estão em `docs/DESIGN.md`.

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

Endpoint de transporte: `/realtime/`. A UI é baixada em paralelo aos mocks. A importação de socket.io-client acontece na criação assíncrona do socket, depois da ativação do MSW, porque Engine.IO captura o construtor WebSocket na avaliação do módulo. O caminho dedicado evita interceptar o WebSocket do próprio Vite.

## Decisões e pendências

Vite simplifica desenvolvimento e build; Tailwind 4 participa pelo plugin do Vite. Um Button no padrão shadcn/ui usa Radix Slot, CVA e a composição `clsx`/`tailwind-merge`. Cores foram extraídas dos PNGs recebidos. IBM Plex Mono local (400/600 na UI e 500/700 no destaque desktop) é uma aproximação, pois os exports não especificam a fonte. Lucide substitui ícones sem arquivo dedicado. Os quatro retratos permanecem originais; a galeria apresenta recortes CSS da mesma arte. As decisões visuais e ajustes de acessibilidade estão em `docs/DESIGN.md`.

Playwright cobre fluxos e falhas, com baselines para quatro telas nos três viewports. Lighthouse mede início/detalhe três vezes por perfil, no build real com mocks padrão; relatórios e análise estão em `docs/PERFORMANCE.md`. Resultados e condições atuais devem ser conferidos em `docs/PERFORMANCE.md`; resultados antigos abaixo da meta não autorizam a publicação. O deploy público ainda exige autorização no serviço e validação da URL.

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

Schemas Zod são usados no formulário e no handler. A API pode retornar erros de campo mesmo após validação no cliente, como e-mail em conflito e senha atual incorreta. Prettier padroniza a formatação; oxlint, TypeScript, testes unitários e Playwright verificam o código. As telas seguem a composição dos frames recebidos, com diferenças explícitas em `docs/DESIGN.md`.

O painel em `/setup` altera cenários por REST e restaura as fixtures. Dados de negócio não são injetados diretamente nos componentes ou no cache pelos controles. Avisos internos sobre respostas HTTP continuam separados dos eventos de negócio Socket.IO. Testes verificam respostas, interface e persistência usando os handlers reais da simulação.

## Composição visual e carregamento

`components/` compartilha cabeçalho, rodapé, navegação mobile, sidebar, galeria e relacionados. Login/cadastro usam diálogo Radix no desktop e tela própria no mobile; ações auxiliares fora do escopo exibem explicações sem simular sucesso. Controles têm labels, foco visível, erros associados e mensagens de status. As abas implementam navegação por setas, Home e End.

O bootstrap apresenta um shell de carregamento, baixa a UI em paralelo aos mocks e aguarda a ativação do MSW antes de montar o React ou emitir consultas. As consultas públicas são antecipadas no mesmo QueryClient. Rotas privadas são carregadas por React.lazy; início e detalhe pertencem ao módulo público inicial. Não há variante exclusiva da aplicação para auditorias. Fontes e imagens são locais; há preload das fontes locais e do retrato de destaque para rotas conhecidas. Skeletons preservam a composição e respeitam movimento reduzido.

Perfil, carteira e pedido incluem os campos adicionais dos frames. Schemas normalizam os campos antigos com defaults compatíveis; a migração acrescenta metadados sem substituir preços ou snapshots de pedidos. O fingerprint de idempotência antigo é normalizado pelo schema atual antes da comparação. Trocar rede, carteira ou provedor invalida a conexão/revisão apropriada; o snapshot registra o provedor efetivamente conectado.

O pagamento mobile usa rolagem e dados expansíveis para preservar conexão, revisão e confirmação explícitas; ocupa mais altura que o frame estático. O recibo mantém navegação e detalhes do colecionador expansíveis. Novas telas sem frame mobile usam a mesma identidade responsiva. Essas decisões não equivalem a fidelidade pixel a pixel comprovada.

## Carregamento e ambiente de CI

Os handlers de operações privadas registram suas rotas imediatamente e carregam os resolvers sob demanda. A primeira requisição aguarda a implementação real do handler, sem bypass de rede ou alternativa de negócio na UI. Catálogo, sessão e consulta do carrinho permanecem disponíveis na inicialização. Helpers sem dependências de schemas evitam carregar validação dos formulários no bootstrap público; os formulários e mutations mantêm Zod. O payload de evento recebe validação explícita na fronteira, incluindo inteiros seguros e enums.

Os hashes PBKDF2 das duas contas públicas de demonstração são fixtures previamente calculadas. Cada conta possui salt e hash próprios; login continua verificando a senha com o algoritmo real. Cadastros e mudanças de senha geram novos salts aleatórios. A inicialização não precisa derivar novamente duas senhas conhecidas.

Os retratos usam picture AVIF/WebP/PNG e dimensões explícitas. Os PNGs originais e sua integridade permanecem disponíveis; AVIF é compressão com perda declarada e WebP é verificado sem perda de pixels. Não há variante exclusiva para Lighthouse. A latência sintética padrão de catálogo/detalhe é 120 ms, consistente com as demais operações; cenários lentos e fora de ordem continuam ativos e reproduzíveis.

O container `ci/Dockerfile` fixa Node, distribuição e Chromium. Os jobs de validação e Lighthouse executam independentemente em push/PR e mantêm as metas do enunciado. Consulte `ci/README.md` para reproduzir e `docs/ETAPA-06.md` para a explicação. A matriz do escopo está em `docs/REQUISITOS.md`. Por solicitação do candidato, main e deploy permanecem suspensos até a revisão e a aprovação dos checks.
