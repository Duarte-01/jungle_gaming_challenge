# Contratos REST implementados

Base: `/api`. Todas as chamadas da aplicação passam por Axios. Os handlers MSW são a única implementação de dados e regras da simulação.

## Sessão, conta e perfil

| Método e recurso        | Entrada                             | Resultado                                                                |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `POST /auth/register`   | `{ name, email, password }`         | 201, sessão com usuário; 409 se e-mail já cadastrado                     |
| `POST /auth/login`      | `{ email, password }`               | 200, sessão; 401 para credenciais inválidas                              |
| `GET /session`          | cookie                              | 200 com `{ user, expiresAt }`; usuário null sem sessão; 401 na expiração |
| `POST /auth/logout`     | cookie                              | 204, invalidação da sessão                                               |
| `GET /profile`          | sessão obrigatória                  | 200, perfil do usuário atual                                             |
| `PATCH /profile`        | `{ name, email, phone, avatarUrl }` | 200, perfil atualizado; 409 em conflito de e-mail                        |
| `PUT /profile/password` | `{ currentPassword, newPassword }`  | 204 e invalidação das sessões da conta; 422 se senha atual incorreta     |

Sessão: `{ user: { id, name, email, phone, avatarUrl } | null, expiresAt: number | null, notices?: string[] }`. O horário de expiração está em milissegundos Unix. O identificador opaco fica em cookie, não na resposta JSON. Senhas e hashes não são retornados nos endpoints de perfil/sessão.

## Catálogo e favoritos

| Método e recurso        | Entrada                                                 | Resultado                                                 |
| ----------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `GET /nfts`             | query `q, category, network, min, max, sort, tab, page` | `{ items, total, page, pages, facets }`, até nove itens   |
| `GET /nfts/:id`         | identificador                                           | NFT e edições; 404 se inexistente                         |
| `GET /favorites`        | sessão obrigatória                                      | `{ ids, items }` do usuário atual                         |
| `PUT /favorites/:id`    | sessão obrigatória                                      | favorito incluído de forma idempotente e lista atualizada |
| `DELETE /favorites/:id` | sessão obrigatória                                      | favorito removido de forma idempotente e lista atualizada |

O NFT contém identidade, nome, imagem, coleção, rede, preço ETH, criador, descrição, versão e edições com disponibilidade. Dados tipados em `src/api/catalog.ts`. Cenários de erro de favoritos retornam 503 sem modificar o estado persistido.

## Carrinho e cotação

| Método e recurso          | Entrada                          | Resultado                                                                       |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `GET /cart`               | cookie de visitante ou sessão    | carrinho e cotação atuais                                                       |
| `POST /cart/items`        | `{ nftId, editionId, quantity }` | 201, item adicionado e carrinho atualizado                                      |
| `PATCH /cart/items/:key`  | `{ quantity }`                   | 200, quantidade atualizada                                                      |
| `DELETE /cart/items/:key` | chave do item                    | 200, carrinho sem o item                                                        |
| `POST /cart/coupon`       | `{ code }`                       | 200, cupom aplicado; 422 para inválido/expirado                                 |
| `DELETE /cart/coupon`     | sem corpo                        | 200, cotação sem cupom                                                          |
| `POST /quotes`            | sessão obrigatória               | carrinho com cotação revalidada; 409 se vazio/sem estoque; 422 se cupom expirou |

A chave do item é `nftId:editionId`, codificada com `encodeURIComponent` na URL. Quantidades são números inteiros positivos. O limite é a disponibilidade da edição; violações retornam 409, sem aplicar a alteração.

Carrinho: `{ items, coupon, quote, couponProblem? }`. Cada item contém NFT, edição, quantidade, disponibilidade e total de linha. Cotação: `{ version, subtotalEth, discountEth, networkFeeEth, totalEth }`. Todos os valores ETH são strings decimais, com até 18 casas. Cálculos usam BigInt em wei. A versão inclui regras de preço, revisão do carrinho, NFTs e quantidades.

Cupom `KURIO10`: desconto de 10%, truncado em wei. `EXPIRED`: erro de cupom expirado. Demais códigos: inválidos. Taxa fictícia: 0.005 ETH por rede distinta presente no carrinho. Valores derivam do catálogo persistido e da quantidade atual.

## Falhas

Formato: `{ code, message, fields?: Record<string, string> }`.

| Status | Exemplos                                                                |
| ------ | ----------------------------------------------------------------------- |
| 400    | JSON malformado                                                         |
| 401    | sessão ausente, expirada ou credenciais inválidas                       |
| 404    | NFT, edição ou item inexistente                                         |
| 409    | e-mail em conflito ou quantidade superior ao estoque                    |
| 422    | validação de formulário, cupom inválido/expirado, senha atual incorreta |
| 503    | falha transitória determinística de favorito ou carrinho                |

O usuário atual é derivado da sessão; os recursos privados não aceitam um `userId` escolhido pelo cliente. Não há nesta etapa endpoints privados para consultar outra conta.

## Controles da demonstração

`GET /testing/scenario`, `PUT /testing/scenario { scenario }`, `POST /testing/reset` e `POST /testing/session/expire`. Eles existem apenas na camada MSW, ativada por configuração; não devem existir num backend de produção.

Valores de cenário: `default`, `slow`, `catalog-error`, `favorite-error`, `cart-error`, `session-expired`, `register-conflict`, `offline`. Controles continuam disponíveis durante a falha simulada de conexão para permitir recuperação. A interface fica em `/setup`. O reset restaura catálogo, contas, hashes, sessões, favoritos, carrinhos, cupons e cenário conhecidos desta etapa.

## Carteiras e conexão

Todos exigem sessão e usam o titular do cookie.

| Método e recurso            | Entrada                             | Resultado                                                     |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `GET /wallets`              | sessão                              | lista privada                                                 |
| `POST /wallets`             | `{ label, address, network, role }` | 201, carteira; 409 em função/endereço duplicado               |
| `PATCH /wallets/:id`        | mesmos campos                       | 200, versão incrementada; desconecta a carteira editada       |
| `GET /wallet-connection`    | sessão                              | conexão da sessão ou null                                     |
| `POST /wallets/:id/connect` | `{ network }`                       | conexão simulada; 422 para rede incompatível; 409 para recusa |
| `DELETE /wallet-connection` | sessão                              | 204                                                           |

Carteira: `{ id, version, label, address, network, role }`. `network`: Ethereum, Polygon ou Solana; `role`: primary ou secondary, no máximo uma de cada por usuário. Conexão: `{ walletId, network, connectedAt }`. Nenhuma operação transfere fundos.

## Pedidos e idempotência

| Método e recurso           | Entrada                                                                                                                        | Resultado                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /orders`             | header `Idempotency-Key`; `{ customer: { name, email, phone }, walletId, walletVersion, network, quoteVersion, agreed: true }` | 201 pending; 200 replay da mesma tentativa; 409 conteúdo conflitante/cotação antiga/estoque/conexão/pedido pendente; 422 validação/cupom |
| `GET /orders`              | sessão                                                                                                                         | lista dos pedidos do titular                                                                                                             |
| `GET /orders/attempt/:key` | sessão                                                                                                                         | pedido da mesma tentativa; 404 se ainda não existe                                                                                       |
| `GET /orders/:id`          | sessão                                                                                                                         | pedido; 404 inexistente; 403 de outro titular                                                                                            |

A chave contém 16–100 caracteres alfanuméricos, `_` ou `-`; o cliente gera UUID. A associação é por usuário e chave, com fingerprint do corpo validado. Replay retorna o mesmo pedido mesmo após mudança do mercado. Conteúdo diferente retorna `IDEMPOTENCY_CONFLICT`. Um pedido pendente por usuário; `ORDER_IN_PROGRESS` informa `details.orderId` para retomada.

Pedido contém `id`, `userId`, `status`, `version`, `createdAt`, `settledAt?`, `transactionReference`, `snapshot` e `refusalReason?`. O snapshot independente contém itens, cotação, cupom, carteira, cliente e rede. Estados: pending, confirmed, declined. Somente confirmed possui referência e recibo; a referência aponta para explorador interno simulado. Recusa preserva carrinho e libera estoque; confirmação retira apenas as quantidades compradas.

## Eventos de negócio

Transporte Socket.IO em `/realtime/`, interceptado pelo MSW com binding de protocolo. `session.subscribe { userId }` retorna `session.ready` somente quando o cookie pertence ao usuário e está válido; caso contrário, `session.denied`.

Eventos `nft.updated`, `quote.updated`, `order.updated`: `{ id, sequence, type, resourceId, version, ownerId?, actorId?, reason? }`. `order.updated` é privado. `reason` pode ser reservation ou market. Duplicatas e versões antigas são descartadas. Recurso alterado provoca reconsulta REST; reconexão reconcilia consultas ativas. `health.check`/`health.ready` continua disponível para infraestrutura.

## Controles acrescentados na etapa 4

Novos cenários: `out-of-order`, `wallet-rejected`, `payment-declined`, `order-timeout`, `order-pending`. O cenário de respostas fora de ordem demora mais para a busca Emerald que para as demais, permitindo observar cancelamento da busca antiga.

| Endpoint de teste (POST)       | Corpo                                     | Efeito                                                           |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------- |
| `/testing/nfts/:id`            | `{ priceEth?, editionId?, available? }`   | muda mercado, incrementa versão e publica NFT                    |
| `/testing/pricing`             | `{ expireCoupon?, networkFeeEth? }`       | muda regra e publica cotação                                     |
| `/testing/realtime/disconnect` | `{ durationMs }` entre 250 e 10000        | fecha transporte e bloqueia reconexão pelo intervalo             |
| `/testing/orders/:id/settle`   | `{ outcome: confirmed ou declined }`      | resolve pedido próprio pendente, preserva estado terminal        |
| `/testing/events/replay`       | `{ type, resourceId, version?, copies? }` | retransmite evento duplicado/antigo; verifica titular se privado |

O reset agora também limpa carteiras, conexões, pedidos, idempotência, eventos, rascunhos e tentativas. Erros podem incluir `details` além de `code`, `message` e `fields`; campos aninhados usam caminhos como `customer.phone`. Os controles são exclusivos da demonstração MSW.
