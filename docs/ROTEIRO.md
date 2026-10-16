# Plano de entrega em dois dias

Prazo atualizado pelo candidato: manhã de 16/10/2026. Não foi informado um horário exato; não presumir que seja o fim do dia 16. Os blocos abaixo são estimativas, não garantias.

## Dia 1 — estrutura e fluxo de compra

1. **Base (primeiro bloco):** Vite, React, TypeScript, Router, Query, Axios, Tailwind, componentes shadcn/ui, MSW e transporte Socket.IO. Build, lint e teste de integração da base.
2. **Layout e catálogo:** extrair tokens e assets do Figma; início desktop/mobile, fixtures com filtros e paginação, parâmetros na URL, detalhe direto, carregamento, vazio e erro.
3. **Sessão e carrinho:** API de cadastro/login, sessão persistente e expiração, dois usuários isolados, favoritos otimistas com rollback, carrinho do visitante preservado no login, quantidades e cupom.
4. **Compra:** valores ETH em strings com cálculos exatos; cotação da API, carteiras, revisão, chave de idempotência, pedido pendente/confirmado/recusado e recibo imutável.

## Dia 2 — cenários, evidências e publicação

1. **Conta e tempo real:** perfil, avatar, senha, carteiras; `nft.updated` e `order.updated` com versão, duplicatas, reconexão e isolamento de sessão. Reconfirmação após mudança na cotação.
2. **Cenários e E2E:** executar os 12 grupos do enunciado; incluir falha de pagamento, timeout após criação, expiração, preço alterado e eventos antigos. Regressão visual de início, detalhe, carrinho e checkout com baselines reais.
3. **Acessibilidade e Lighthouse:** teclado, foco, skeletons, motion reduzido, 390/768/1440 px. Três medições por página e perfil para início e detalhe, com medianas e relatórios.
4. **Entrega e ensaio:** publicar, validar rotas e mocks no deploy, documentação, conferir checkout limpo e praticar a explicação do fluxo e dos testes.

Por solicitação do candidato, a integração na main e a publicação ficam suspensas até concluir a revisão e atingir todas as metas. Priorize corrigir os checks; recursos extras não devem atrasar essa validação.

## Situação atual

- [x] Enunciado lido e stack identificada.
- [x] Base da aplicação criada.
- [ ] Fidelidade visual: composição revisada nas etapas 7 e 8 com 13 frames e capturas do início; fonte original e revisão humana final permanecem pendentes, com diferenças declaradas em `DESIGN.md`.
- [x] Catálogo e detalhe funcionais, com galeria e metadados.
- [x] Conta, sessão e isolamento de dados.
- [x] Favoritos e rollback.
- [x] Carrinho, cotação revalidada, cupons e precisão ETH.
- [x] Checkout, idempotência, recuperação e confirmação pela API.
- [x] Perfil, avatar e alteração de senha.
- [x] Carteiras e conexão simulada com validação de rede.
- [x] Eventos de negócio, versões e reconciliação na reconexão.
- [x] Cenários de compra, eventos, reset e controles REST da demonstração.
- [x] 12 grupos de E2E e regressão visual: 150 execuções passaram; 12 baselines versionadas.
- [x] Metas Lighthouse locais: 12 medições, medianas performance mobile 90/91 e desktop 100/100; demais categorias 100. Relatórios e condições em `PERFORMANCE.md`.
- [ ] Deploy público validado.
- [x] Documentação das etapas, contratos, design, performance e guia da Vercel.
- [ ] Identificação profissional do perfil GitHub, solicitada para o fechamento (nome exibido/README e apresentação; sem reescrever o histórico automaticamente).
- [ ] Treino final de apresentação, após validar a publicação.

## Regras para proteger a entrega

Não trocar tecnologias obrigatórias, confirmar compra sem resposta da API, simular eventos diretamente na UI ou desativar testes para obter resultados positivos. Cada recurso deve incluir o tratamento de erro e sua evidência. Lacunas devem ser registradas claramente, sem apresentá-las como concluídas.

O candidato deve conseguir explicar: URL como estado de filtros, cache por usuário, precisão dos preços, idempotência, reconciliação REST/Socket.IO e o que os testes observam.

O treino final de apresentação está registrado em `docs/APRESENTACAO.md`. Ele será feito com os recursos e as evidências reais da entrega, sem antecipar a conclusão de itens pendentes.
