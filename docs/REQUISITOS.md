# Conferência do enunciado

Referência: [frontend-challenge](https://github.com/junglegaming/frontend-challenge), consultado em 15/10/2026. Esta matriz aponta implementação e evidência; aprovação dos testes não equivale a fidelidade perfeita ao Figma ou a validação do domínio publicado.

| Exigência                              | Implementação                                                                   | Evidência executável                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| React e TypeScript                     | `src/app`, `src/pages`                                                          | typecheck e build                                                                                      |
| TanStack Router                        | rotas, validateSearch e beforeLoad em `src/app/router.tsx`                      | histórico, refresh, rotas privadas e detalhe direto                                                    |
| Query e Axios/REST                     | `src/api`, `src/hooks`, `src/app/query-client.ts`                               | respostas HTTP e UI nos E2E                                                                            |
| Tailwind e shadcn/ui                   | plugin Vite, utilitários, `components/ui/button.tsx`                            | build e ações de compra                                                                                |
| MSW e Socket.IO efetivos               | handlers REST, binding WebSocket, `socket.io-client`                            | `foundation.spec.ts` e cenários de checkout                                                            |
| Início e catálogo                      | destaques, busca, filtros, ordenação, paginação na URL                          | `catalog.spec.ts`, `assets-network.spec.ts`                                                            |
| Detalhe                                | galeria, edição, quantidade, indisponível, inexistente                          | `catalog.spec.ts`, `design-interactions.spec.ts`                                                       |
| Cadastro/login/logout/expiração        | handlers de conta, cookies, guard e cache por usuário                           | `account-cart.spec.ts`, `checkout.spec.ts`                                                             |
| Favoritos otimistas e rollback         | mutation por item e reconciliação                                               | `account-cart.spec.ts`                                                                                 |
| Carrinho e cupom                       | visitante, merge no login, estoque, cupom, cotação                              | `account-cart.spec.ts`                                                                                 |
| Precisão ETH                           | strings no transporte e BigInt em wei                                           | `tests/unit/eth.test.mjs` e totais E2E                                                                 |
| Pagamento completo                     | dados, carteira/rede, conexão, revisão e confirmação REST                       | `checkout.spec.ts`: catálogo → detalhe → carrinho → pagamento → recibo                                 |
| Idempotência e falhas                  | chave + fingerprint, tentativa recuperável, pendente/recusado                   | clique repetido, conflito e timeout em `checkout.spec.ts`                                              |
| Recibo imutável e isolamento           | snapshot do pedido e titular validado na API                                    | refresh, preço posterior, itens novos e outra conta em `checkout.spec.ts`                              |
| Perfil/avatar/senha                    | schemas e handlers com validação e persistência                                 | `account-cart.spec.ts`, `design-interactions.spec.ts`                                                  |
| Carteiras                              | principal/secundária, campos, rede/provedor e edição                            | `checkout.spec.ts`, `design-interactions.spec.ts`                                                      |
| Eventos                                | nft.updated/order.updated/quote.updated, versão, duplicatas e geração de sessão | `checkout.spec.ts`; validação de payload em unitário                                                   |
| Reconexão                              | limpeza de listeners, inscrição validada e reconciliação REST                   | pedido pendente, interrupção e refresh em `checkout.spec.ts`                                           |
| Cenários configuráveis/reset           | `/setup`, controles REST, fixtures com dois usuários                            | falha, lento, fora de ordem, indisponível, recusa, timeout e reset                                     |
| Responsividade e acessibilidade        | 390/768/1440, teclado, foco, labels, feedback, reduced-motion                   | `catalog.spec.ts`, `design-interactions.spec.ts` e Lighthouse                                          |
| Reflow equivalente a zoom desktop 200% | largura CSS 720 em viewport desktop original de 1440                            | conta/carteiras/pedidos em `design-interactions.spec.ts`; não simula todo comportamento do zoom físico |
| Skeletons shimmer                      | catálogo, detalhe e resumo; espaço reservado                                    | lento/recuperação em `catalog.spec.ts` e detalhe estável em `design-interactions.spec.ts`              |
| Regressão visual                       | quatro telas × três viewports, baselines versionadas                            | `visual.spec.ts`, ambiente fixado em `ci/Dockerfile`                                                   |
| Lighthouse                             | três medições × duas páginas × dois perfis, metas obrigatórias                  | `lighthouse.config.json`, relatórios HTML/JSON e `PERFORMANCE.md`                                      |
| Contratos, cache e limitações          | `CONTRATOS.md`, `ARCHITECTURE.md`, `DESIGN.md`                                  | revisão documental e comandos no README                                                                |
| Checkout limpo                         | lockfile e assets locais, sem backend privado                                   | `npm ci`, build e CI                                                                                   |

## Revisão que permanece separada

- **Família tipográfica original:** o Figma mostrou apenas `font/family`. Medidas do destaque desktop fornecidas pelo candidato foram aplicadas. IBM Plex Mono continua sendo aproximação declarada; baselines comprovam regressão da implementação, não igualdade com o Figma.
- **Deploy obrigatório:** ainda não realizado/validado. A integração na main e a publicação estão suspensas por solicitação do candidato até concluir revisão e checks verdes do commit correspondente. Depois será necessário testar HTTPS, acesso anônimo, refresh das rotas e REST/Socket.IO no domínio público.
- **Apresentação:** ensaio final solicitado para depois da validação pública; material preparatório em `APRESENTACAO.md`.

Não acrescentar autenticação Google real, blockchain, pagamento real ou páginas editoriais para tentar compensar um requisito pendente. Esses recursos estão fora do escopo. Prioridade: comportamento exigido, fidelidade, evidências e explicação compreensível pelo candidato.
