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

| Método e recurso          | Entrada                          | Resultado                                                         |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `GET /cart`               | cookie de visitante ou sessão    | carrinho e cotação atuais                                         |
| `POST /cart/items`        | `{ nftId, editionId, quantity }` | 201, item adicionado e carrinho atualizado                        |
| `PATCH /cart/items/:key`  | `{ quantity }`                   | 200, quantidade atualizada                                        |
| `DELETE /cart/items/:key` | chave do item                    | 200, carrinho sem o item                                          |
| `POST /cart/coupon`       | `{ code }`                       | 200, cupom aplicado; 422 para inválido/expirado                   |
| `DELETE /cart/coupon`     | sem corpo                        | 200, cotação sem cupom                                            |
| `POST /quotes`            | sessão obrigatória               | cotação revalidada; 409 se carrinho vazio ou estoque insuficiente |

A chave do item é `nftId:editionId`, codificada com `encodeURIComponent` na URL. Quantidades são números inteiros positivos. O limite é a disponibilidade da edição; violações retornam 409, sem aplicar a alteração.

Carrinho: `{ items, coupon, quote }`. Cada item contém NFT, edição, quantidade, disponibilidade e total de linha. Cotação: `{ version, subtotalEth, discountEth, networkFeeEth, totalEth }`. Todos os valores ETH são strings decimais, com até 18 casas. Cálculos usam BigInt em wei.

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

## Ainda não implementado

Carteiras, pedidos, idempotência de compra, recibos e eventos `nft.updated`/`order.updated`. O Socket.IO atual valida somente o transporte com `health.check`/`health.ready`. Os contratos correspondentes serão acrescentados com sua implementação e evidência.
