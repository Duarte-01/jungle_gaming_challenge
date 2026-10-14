# Arquitetura em evolução

## Estado atual

Esta documentação descreve a base. As regras de negócio do marketplace ainda não estão implementadas. A tela técnica provisória não é uma substituição do Figma.

## Responsabilidades

`app/` compõe os providers e as rotas; `pages/` contém as telas; `components/ui/` contém componentes adaptados do padrão shadcn/ui; `api/` contém contratos e transporte Axios; `mocks/` simula a rede com MSW; `realtime/` gerencia o cliente Socket.IO. Os componentes não têm uma alternativa local que retorna fixtures.

O MSW inicia antes do React. A configuração `VITE_ENABLE_MOCKS=false` desativa o worker. Os mocks ficam ativos por padrão no desenvolvimento e no build de demonstração. Não há backend privado.

## Contratos implementados nesta etapa

`GET /api/health` → `200 { status: "ok", service: "jungle-marketplace-mock" }`.

Socket.IO: cliente envia `health.check`; simulação devolve `health.ready { id, version, transport: "socket.io" }`. É uma verificação de infraestrutura, sem recursos privados. Os eventos `nft.updated` e `order.updated` ainda serão implementados.

## Política inicial de cache

TanStack Query: respostas frescas por 30 segundos, uma nova tentativa para queries e revalidação ao focar a janela. Mutations não têm retries automáticos; criação de pedido precisará de idempotência antes de permitir reenvio. A query de saúde recebe `AbortSignal` e passa o sinal ao Axios para permitir cancelamento. A política final de queries por usuário, logout e eventos ainda está pendente.

## Transporte dos mocks

MSW 2 é usado por compatibilidade com o peer dependency de `@mswjs/socket.io-binding` 0.2. O cliente real `socket.io-client` conecta usando apenas WebSocket. A integração intercepta o protocolo e simula a abertura e os eventos; adicionamos heartbeat Engine.IO para manter a conexão. Não se pretende reproduzir salas, namespaces ou fallback HTTP polling. Os listeners são liberados no unmount.

Endpoint de transporte: `/realtime/`. As rotas são importadas dinamicamente após o início do MSW, porque o Engine.IO captura o construtor WebSocket na avaliação do módulo. O caminho dedicado evita interceptar o WebSocket do próprio Vite.

## Decisões e pendências

Vite simplifica desenvolvimento e build; Tailwind 4 participa pelo plugin do Vite. Um Button no padrão shadcn/ui usa Radix Slot, CVA e a composição `clsx`/`tailwind-merge`. As cores e fontes atuais são provisórias; dependem do acesso ao layout. Nenhuma substituição de asset do Figma foi aprovada ou avaliada.

Os testes iniciais exercitam rede e navegador, mas não comprovam o atendimento ao desafio. Lighthouse está instalado; os scripts específicos, as medições e a análise serão feitos sobre páginas funcionais e assets finais. O deploy ainda não foi executado.

Contratos REST de negócio, estratégia de sessão, hashing de senhas fictícias, persistência, precisão monetária, reconciliação, idempotência e cenários serão documentados com suas implementações.
