# Plano de entrega em dois dias

Prazo de trabalho informado: dois dias a partir de 14/10/2026. Confirmar o horário de entrega com a empresa; não presumir que seja o fim do dia 16. Os blocos abaixo são estimativas, não garantias.

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

Não adiar a primeira publicação até o último minuto; publicar uma versão funcional assim que o fluxo estiver estável e atualizar depois.

## Situação atual

- [x] Enunciado lido e stack identificada.
- [x] Base da aplicação criada.
- [ ] Fidelidade visual e assets originais: capturas desktop/mobile do início recebidas; fonte e retratos isolados pendentes.
- [ ] Catálogo e detalhe completos: listagem, filtros na URL e detalhe parcial implementados; favoritos e ações de compra pendentes.
- [ ] Conta, sessão e isolamento de dados.
- [ ] Favoritos e rollback.
- [ ] Carrinho, cotação e precisão ETH.
- [ ] Checkout, idempotência e confirmação.
- [ ] Perfil e carteiras.
- [ ] Eventos de negócio, versões e reconexão.
- [ ] Cenários determinísticos e reset completo.
- [ ] 12 grupos de E2E e regressão visual.
- [ ] Auditorias Lighthouse e relatórios.
- [ ] Deploy público validado.
- [ ] Documentação final e revisão para apresentação.

## Regras para proteger a entrega

Não trocar tecnologias obrigatórias, confirmar compra sem resposta da API, simular eventos diretamente na UI ou desativar testes para obter resultados positivos. Cada recurso deve incluir o tratamento de erro e sua evidência. Lacunas devem ser registradas claramente, sem apresentá-las como concluídas.

O candidato deve conseguir explicar: URL como estado de filtros, cache por usuário, precisão dos preços, idempotência, reconciliação REST/Socket.IO e o que os testes observam.
