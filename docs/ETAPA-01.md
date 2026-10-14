# Etapa 1 — entender a base

## O que estamos construindo

Um marketplace simulado: o usuário encontra um NFT, adiciona ao carrinho e compra com uma carteira fictícia. O desafio exige que essas ações funcionem, mesmo sem um backend real. Por isso começamos pela comunicação, antes de montar todas as telas.

## Como uma requisição percorre o projeto

1. `src/main.tsx` ativa os mocks antes de renderizar o React. Isso evita requisições antes de o servidor simulado estar pronto.
2. `src/app/router.tsx` decide qual página corresponde ao endereço do navegador.
3. `src/pages/setup.tsx` pede a saúde da API usando `useQuery`.
4. `src/api/health.ts` usa o cliente Axios de `src/api/client.ts` para enviar `GET /api/health`.
5. `src/mocks/handlers.ts` intercepta essa requisição na rede e devolve a resposta simulada.
6. O TanStack Query recebe a resposta, atualiza seu cache e o React mostra o resultado.

O componente não importa os dados fictícios. Isso nos permite testar falhas e, futuramente, trocar o servidor sem reescrever a interface.

## Vocabulário essencial

- **Componente:** função que descreve um pedaço da interface. `SetupPage` é um componente.
- **Tipo:** descrição da forma de um dado. `HealthResponse` define os campos esperados; não valida automaticamente uma resposta em execução.
- **Hook:** função React que participa do ciclo de vida do componente. `useQuery` acompanha uma requisição.
- **Cache:** armazenamento temporário de respostas. Evita repetir toda requisição a cada renderização.
- **Handler:** função que responde a uma requisição ou evento na simulação.
- **Build:** transformação do código de desenvolvimento nos arquivos que serão publicados.
- **Teste E2E:** navegador executando ações e observando o resultado, como um usuário.

## E o tempo real?

`src/realtime/use-realtime-health.ts` cria um cliente Socket.IO. Ele envia `health.check`; o MSW recebe pela integração `@mswjs/socket.io-binding` e devolve `health.ready`. A tela mostra o evento recebido. Ainda não são os eventos de preço e pedido exigidos no desafio; esta etapa verifica o transporte que será usado por eles.

O hook remove os listeners e encerra a conexão quando seu componente sai da tela. Isso evita acumular conexões. A aplicação usa WebSocket; a simulação não implementa fallback de polling.

## Seu primeiro exercício

Abra `src/pages/setup.tsx` e encontre o título da página. Observe como o texto aparece dentro de uma tag `h1`: React combina HTML com JavaScript usando JSX. Depois encontre `health.isPending`, `health.isSuccess` e `health.isError`: cada condição mostra uma interface diferente para a mesma requisição.

Não precisa instalar todas as bibliotecas por conta própria: elas já estão registradas no `package.json`. `npm ci` instala as versões do `package-lock.json`. Antes da próxima etapa, procure explicar com suas palavras quem pede os dados e quem responde.

## O que esta etapa não demonstra

Não demonstra compra, autenticação, segurança entre usuários, catálogo, fidelidade visual nem performance final. Esses comportamentos serão construídos e testados nas próximas etapas do roteiro.
