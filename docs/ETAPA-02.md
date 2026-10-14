# Etapa 2 — catálogo e início responsivo

## O que mudou

A página `/` agora apresenta a composição inicial Kurio baseada nas capturas desktop e mobile fornecidas pelo candidato. A tela técnica da etapa anterior fica em `/setup`.

O catálogo pede dados ao MSW por Axios e TanStack Query. Há 36 NFTs de demonstração, distribuídos em coleções e redes, com quatro páginas de nove itens. Os primeiros nove nomes e preços seguem a referência desktop. Os contadores de filtros refletem as fixtures disponíveis, não os números ilustrativos do Figma.

## Por que guardar filtros na URL

Experimente buscar `Emerald` e pressione Enter. O endereço passa a conter `q=Emerald`. Se atualizar a página ou usar o histórico do navegador, o Router lê esse parâmetro e restaura a consulta.

Isso evita que a busca exista apenas na memória da tela. O endereço também contém coleção, rede, faixa de preço, destaque, ordenação e página. Trocar um filtro reinicia a página em 1.

## Percurso dos dados

1. `src/pages/home.tsx` lê e altera os parâmetros usando TanStack Router.
2. O TanStack Query cria uma chave `['nfts', search]`, que identifica aquela combinação específica de filtros.
3. `src/api/catalog.ts` envia os parâmetros por Axios para `GET /api/nfts`.
4. `src/mocks/catalog.ts` aplica os filtros, a ordenação e a paginação na simulação.
5. A resposta contém os itens, o total, as páginas e os contadores.

O sinal de cancelamento chega ao Axios. Consultas diferentes têm chaves diferentes, evitando que uma resposta anterior substitua a busca atual. Enquanto uma nova consulta roda, a tela sinaliza a atualização. Isso ainda precisará dos cenários específicos de respostas fora de ordem exigidos pelo desafio.

## Preços sem perder precisão

Um valor ETH chega como texto, por exemplo `"0.1"`. `src/lib/eth.ts` transforma esse texto em unidades inteiras (wei) usando BigInt. Assim, `0.1 + 0.2` produz exatamente `0.3` em ETH. Os testes unitários também verificam a menor unidade e rejeitam mais de 18 casas decimais.

A interface pode mostrar o texto recebido. Não usamos ponto flutuante para ordenar ou filtrar os preços. Cotação e compra ainda não estão implementadas.

## Mobile e acessibilidade

No mobile, os filtros abrem em um diálogo Radix com fechamento por Escape, foco contido e retorno ao botão que abriu o painel. As opções de filtro expõem seu estado com `aria-pressed`. Há mensagens de atualização e de erro, skeletons e respeito ao movimento reduzido.

## Pendências reais

- Os quatro retratos originais precisam ser exportados do Figma: Emerald Ape, Sage Nomad, Neon Vessel e Golden Beat.
- Caminhos previstos: `public/images/nfts/emerald-ape.png`, `sage-nomad.png`, `neon-vessel.png` e `golden-beat.png`. O componente apresenta um fallback acessível enquanto não há assets.
- Fonte atual: monospace do sistema, provisória. Tokens, espaçamentos, imagens e componentes precisam de comparação final com o arquivo do Figma.
- A parte inferior desktop foi iniciada, mas newsletter, rodapé completo e detalhes de composição ainda estão pendentes. Os guias usam resumos estáticos expansíveis, sem simular uma página editorial funcional.
- Conta, favoritos e carrinho estão desabilitados nesta etapa. O detalhe é parcial: informações, edição esgotada e limite de quantidade; compra ainda não funciona.
- Regressões visuais finais e Lighthouse ainda não foram executados.

## Cenários desta etapa

Os cenários ficam exclusivamente nos handlers MSW. No console do navegador, `localStorage.setItem('kurio:scenario', 'slow')` ativa latência de dois segundos e `catalog-error` ativa resposta 503 para listagem. `localStorage.removeItem('kurio:scenario')` restaura o padrão; refaça a consulta para observar a mudança. São apenas cenários iniciais, não o reset completo da entrega final.

## Testes

`tests/e2e/catalog.spec.ts` verifica busca, refresh e histórico, combinação de filtros, ordenação, paginação, detalhe direto, NFT inexistente, edição esgotada, carregamento lento, falha HTTP e recuperação. Os testes passam pelos handlers MSW, sem substituir a API por respostas do próprio Playwright.

`npm run test:unit` verifica a precisão ETH com o runner nativo do Node. Para esse comando use Node 22.18+ ou a versão indicada em `.nvmrc` (24.19.0).
