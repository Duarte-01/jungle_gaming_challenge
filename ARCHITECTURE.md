# Arquitetura em evolução

## Estado atual

Esta documentação descreve a base e a primeira versão do catálogo. A página inicial segue a composição das capturas fornecidas, com assets originais pendentes. A tela técnica fica em `/setup`. Conta, sessão, perfil, favoritos e carrinho estão implementados. Carteiras, compra e eventos de negócio ainda estão pendentes.

## Responsabilidades

`app/` compõe os providers e as rotas; `pages/` contém as telas; `components/ui/` contém componentes adaptados do padrão shadcn/ui; `api/` contém contratos e transporte Axios; `mocks/` simula a rede com MSW; `realtime/` gerencia o cliente Socket.IO. Os componentes não têm uma alternativa local que retorna fixtures.

O MSW inicia antes do React. A configuração `VITE_ENABLE_MOCKS=false` desativa o worker. Os mocks ficam ativos por padrão no desenvolvimento e no build de demonstração. Não há backend privado.

## Contratos implementados nesta etapa

`GET /api/health` → `200 { status: "ok", service: "jungle-marketplace-mock" }`.

`GET /api/nfts?q=&category=&network=&min=0&max=100&sort=recent&tab=all&page=1` retorna itens, total, página, número de páginas e facets. Página contém até nove itens. Ordenações: `recent` (ordem estável de fixture), `price-asc`, `price-desc`, `name`; destaques: `all`, `new`, `trending`. `GET /api/nfts/:id` retorna um NFT com edições e disponibilidade, ou 404. Valores ETH são strings; filtros e ordenação de preço usam BigInt em wei.

Parâmetros são normalizados pelo Router e pelo MSW. Mudanças de filtro reiniciam a paginação. O cache da listagem usa todos os parâmetros na chave; a query passa AbortSignal ao Axios e mantém dados anteriores enquanto informa atualização. O detalhe usa chave por ID, sem retry para 404. O catálogo agora pertence ao mesmo banco local dos demais recursos. A sincronização de alterações por eventos será acrescentada na etapa de tempo real.

Socket.IO: cliente envia `health.check`; simulação devolve `health.ready { id, version, transport: "socket.io" }`. É uma verificação de infraestrutura, sem recursos privados. Os eventos `nft.updated` e `order.updated` ainda serão implementados.

## Política inicial de cache

TanStack Query: respostas frescas por 30 segundos, uma nova tentativa para queries e revalidação ao focar a janela. Mutations não têm retries automáticos; criação de pedido precisará de idempotência antes de permitir reenvio. A query de saúde recebe `AbortSignal` e passa o sinal ao Axios para permitir cancelamento. Sessão não tem retry automático. Favoritos usam chaves por usuário; carrinho usa identidade de visitante ou usuário e staleTime zero. Queries e mutations privadas são removidas ao encerrar ou trocar a sessão. Eventos de negócio ainda estão pendentes.

## Transporte dos mocks

MSW 2 é usado por compatibilidade com o peer dependency de `@mswjs/socket.io-binding` 0.2. O cliente real `socket.io-client` conecta usando apenas WebSocket. A integração intercepta o protocolo e simula a abertura e os eventos; adicionamos heartbeat Engine.IO para manter a conexão. Não se pretende reproduzir salas, namespaces ou fallback HTTP polling. Os listeners são liberados no unmount.

Endpoint de transporte: `/realtime/`. As rotas são importadas dinamicamente após o início do MSW, porque o Engine.IO captura o construtor WebSocket na avaliação do módulo. O caminho dedicado evita interceptar o WebSocket do próprio Vite.

## Decisões e pendências

Vite simplifica desenvolvimento e build; Tailwind 4 participa pelo plugin do Vite. Um Button no padrão shadcn/ui usa Radix Slot, CVA e a composição `clsx`/`tailwind-merge`. As cores e fontes atuais são provisórias; dependem do acesso ao layout. Nenhuma substituição de asset do Figma foi aprovada ou avaliada.

Os testes iniciais exercitam rede e navegador, mas não comprovam o atendimento ao desafio. Lighthouse está instalado; os scripts específicos, as medições e a análise serão feitos sobre páginas funcionais e assets finais. O deploy ainda não foi executado.

Os contratos de sessão, perfil, favoritos, carrinho e cotação estão em `docs/CONTRATOS.md`. Pedidos, idempotência e reconciliação de eventos ainda não estão implementados. `docs/ETAPA-02.md` registra as substituições provisórias de fonte, as imagens pendentes e os cenários iniciais de catálogo.

## Persistência e autenticação da simulação

`mocks/database.ts` mantém um banco versionado em `kurio:db:v1` com catálogo, contas, hashes, sessões, favoritos e carrinhos. Gravações passam por uma fila por instância para preservar alterações concorrentes. Esse mecanismo não é um servidor compartilhado nem oferece sincronização transacional entre abas; é uma persistência local para a demonstração.

Senhas fictícias usam PBKDF2/SHA-256 com 120.000 iterações e salt aleatório. Cookies separam visitante e sessão, com identificadores opacos; a expiração de 30 minutos é verificada nos handlers. O cookie do mock é legível por JavaScript e o banco local pode ser inspecionado pelo usuário da máquina: isso não representa segurança de backend em produção. Nenhuma senha em claro é persistida no banco e o logging detalhado de requisições do MSW está desativado.

O cliente trata 401, preserva o caminho interno para retomar o fluxo e usa gerações de sessão para descartar respostas de uma conta anterior. O retorno após login rejeita destinos externos, caracteres de controle e ciclos de autenticação. Hashes nunca são retornados pelos recursos de conta. Alteração de senha invalida as sessões da conta.

## Favoritos e carrinho

Favoritos atualizam o cache de forma otimista, guardam o estado anterior do item e fazem rollback se a API falhar. Rollback não substitui alterações em outros itens. A confirmação acessível é emitida após a resposta da API. A reconciliação é feita quando termina a última mutation concorrente de favoritos daquela conta. Avisos globais continuam visíveis se um card removido otimisticamente sair da árvore.

O carrinho deriva o proprietário dos cookies; o cliente não escolhe um userId. Operações do cliente usam um scope de mutation por identidade. O login combina itens por NFT/edição com o carrinho já salvo na conta, limita quantidades ao estoque e informa ajustes. Logout não transforma o carrinho da conta em carrinho visitante.

Cotação, desconto e taxa vêm da API e usam BigInt em wei; o transporte usa strings decimais. A regra fictícia atual é KURIO10 (10%, truncado em wei) e 0.005 ETH por rede distinta. O token de versão da cotação acompanha a revisão do carrinho e as versões dos NFTs; isso ainda não implementa confirmação nem idempotência de pedidos.

## Validação e desenvolvimento

Schemas Zod são usados no formulário e no handler. A API pode retornar erros de campo mesmo após validação no cliente, como e-mail em conflito e senha atual incorreta. Prettier padroniza a formatação; oxlint, TypeScript, testes unitários e Playwright verificam o código. As telas novas seguem a identidade provisória, com comparação aos frames correspondentes ainda pendente.

O painel em `/setup` altera cenários por REST e restaura as fixtures. Dados de negócio não são injetados diretamente nos componentes ou no cache pelos controles. Avisos internos da aplicação sobre respostas HTTP não são apresentados como eventos de negócio Socket.IO; estes continuam pendentes.
