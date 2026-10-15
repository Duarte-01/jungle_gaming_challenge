# Jungle Gaming Challenge

Implementação em andamento do [desafio frontend](https://github.com/junglegaming/frontend-challenge).

**Estado atual:** revisão da etapa 6. Catálogo, conta e compra simulada estão implementados. **Validação local: 129 E2E e 4 unitários aprovados; metas Lighthouse atingidas nas quatro combinações, com 12 medições.** A CI usa um ambiente fixado e os dois jobs automáticos; confira os checks do commit correspondente antes de integrar na `main` ou publicar. Veja a [matriz de requisitos](docs/REQUISITOS.md), os [resultados executados](docs/VALIDACAO.md) e as [medianas Lighthouse](docs/PERFORMANCE.md). Fonte aproximada e diferenças em relação ao Figma estão declaradas em [DESIGN](docs/DESIGN.md). **Não há deploy público validado.**

## Executar

Requisitos: Node.js 22.18+ (ambiente atual: Node 24) e npm.

```bash
npm ci
npm run dev:mocks
```

O Vite informa o endereço local no terminal. Os mocks estão ativos por padrão, inclusive no build de demonstração. `.env.example` documenta `VITE_ENABLE_MOCKS`; definir `false` desativa os mocks e requer uma API real, que não faz parte do desafio. Nenhuma credencial real é necessária.

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run build
npm run preview
npm run browsers:install
npm run test:e2e
npm run test:report
npm run audit:lighthouse
```

Para reproduzir os checks visuais e Lighthouse do GitHub, use o [ambiente Docker fixado](ci/README.md). A distribuição, as fontes e o Chromium influenciam as capturas: usar um browser diferente exige inspecionar as diferenças, não regenerar baselines automaticamente.

O desenvolvimento manual não exige Docker. Em uma máquina local, `npm run browsers:install` instala o browser para os testes funcionais. Nesta nuvem, o download do Playwright é bloqueado; há Chromium do sistema disponível e a imagem de validação preparada. Para uma verificação funcional com o browser do sistema:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Esse comando não substitui a regressão visual no container oficial. Os quatro PNGs originais continuam preservados; `npm run assets:optimize` reproduz os derivados AVIF/WebP usados pelo navegador, conforme [ASSETS](docs/ASSETS.md).

Os testes atuais verificam infraestrutura, catálogo, contas, favoritos, carrinho, carteiras, checkout e pedidos nas larguras 390, 768 e 1440. Incluem recusa, timeout, reconexão, revisão de preços, estoque, cupons, taxas e isolamento de pedidos. Os testes unitários verificam precisão ETH, destinos de retorno após login e validação de eventos de rede. Os resultados executados estão em [VALIDACAO](docs/VALIDACAO.md). As 12 baselines cobrem início, detalhe, carrinho e pagamento nos três tamanhos. Relatórios atuais são gerados em `playwright-report/`, e traces de falhas em `test-results/`. A entrega preserva uma cópia do relatório em `reports/playwright/` e as 12 auditorias HTML/JSON em `reports/lighthouse/`. Os browsers ficam em `.cache/browsers/`.

## Testar a demonstração manualmente

Use somente dados fictícios. As contas abaixo são fixtures públicas da simulação:

| Conta | E-mail             | Senha fictícia   |
| ----- | ------------------ | ---------------- |
| Ana   | `ana@kurio.test`   | `KurioDemo2026!` |
| Bruno | `bruno@kurio.test` | `KurioDemo2026!` |

Abra um NFT, escolha uma edição e adicione ao carrinho. Favoritos exigem login; o carrinho permite visitante e combina seus itens com os da conta ao entrar. Use `KURIO10` para 10% de desconto. `EXPIRED` simula cupom expirado; outros códigos são inválidos.

Ana e Bruno **já estão cadastrados nas fixtures** para permitir testes imediatos. Você também pode usar `/cadastro` com um e-mail fictício novo; o cadastro cria a conta e inicia a sessão. Um e-mail desconhecido não entra pelo formulário de login.

Para comprar, vá do carrinho para `/pagamento`, abra os dados do colecionador no mobile e preencha o telefone, conecte a carteira simulada na rede cadastrada, marque a revisão dos dados e clique em **Revisar pedido**. Confira o resumo antes de **Confirmar compra simulada**. Só o retorno confirmado da API libera o recibo. Se sua base veio da etapa 3 ou a conta é nova, cadastre primeiro a carteira em `/carteiras`; a migração preserva seus dados anteriores. Endereço fictício Ethereum válido: `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.

Acesse `/setup` para selecionar cenários de falha, pagamento recusado, timeout após criar pedido ou pedido pendente. O painel de mercado altera preço/estoque, expira o cupom, interrompe o socket e conclui pedidos pendentes por requisições REST. Os eventos resultantes trafegam pelo Socket.IO. Retorne ao cenário **Padrão** para compras normais. **Restaurar dados de demonstração** apaga contas criadas e alterações locais, incluindo pedidos, carteiras e tentativas, e restaura as fixtures. O controle de reset continua acessível durante a falha simulada de conexão.

Rotas atuais: `/`, `/nfts/:id`, `/login`, `/cadastro`, `/carrinho`, `/favoritos`, `/perfil`, `/carteiras`, `/pagamento`, `/pedidos`, `/pedidos/:id`, `/explorador/:reference` e `/setup`. O explorador é interno e fictício, sem blockchain. A sessão dura 30 minutos e é recuperada pela API depois do refresh. Alterar a senha exige novo login.

Os dados do mock ficam no navegador deste endereço, não no GitHub. Trocar a porta, o domínio ou o navegador cria outro armazenamento. O reset não altera o código-fonte.

## Onde estudar

- [Roteiro dos dois dias](docs/ROTEIRO.md): ordem de implementação e critérios pendentes.
- [Primeira etapa explicada](docs/ETAPA-01.md): percurso da requisição, arquivos e exercício.
- [Segunda etapa explicada](docs/ETAPA-02.md): URL, filtros, mocks e precisão ETH.
- [Terceira etapa explicada](docs/ETAPA-03.md): sessão, isolamento, favoritos otimistas e carrinho.
- [Quarta etapa explicada](docs/ETAPA-04.md): carteiras, revisão, idempotência, recibos e tempo real, com exercício passo a passo.
- [Quinta etapa explicada](docs/ETAPA-05.md): composição dos frames, acessibilidade, novos campos e verificações, com exercício guiado.
- [Sexta etapa explicada](docs/ETAPA-06.md): CI, baselines, carregamento e exercício para interpretar os relatórios.
- [Matriz de requisitos](docs/REQUISITOS.md): exigências, código, evidências e pendências.
- [Referências visuais](docs/DESIGN.md): frames, fonte local, desvios e regressão visual.
- [Performance](docs/PERFORMANCE.md): medianas Lighthouse, condições, relatórios e limitações.
- [Publicação na Vercel](docs/DEPLOY.md): conta, branches, importação e validação pública.
- [Imagens recebidas](docs/ASSETS.md): origem, dimensões e integridade dos PNGs.
- [Contratos REST](docs/CONTRATOS.md): recursos, entradas, respostas e erros implementados.
- [Preparação para apresentação](docs/APRESENTACAO.md): roteiro de estudo e perguntas do treino final.
- [Arquitetura](ARCHITECTURE.md): decisões atuais e limites da base.
- [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

## Publicação

Build: `npm run build`; saída: `dist`; mocks ativos por padrão, sem credenciais privadas. `vercel.json` prepara build e fallback de rotas; `netlify.toml` e `public/_redirects` preparam a alternativa Netlify. A configuração de hospedagem ainda precisa ser validada no serviço publicado.

O código de desenvolvimento está na branch `feat/marketplace-base`. **Integração na `main` e deploy suspensos por solicitação do candidato até concluir a revisão e obter os dois checks verdes do commit correspondente.** A Vercel será configurada depois dessa etapa. **Publicar o ambiente do Codex**, **enviar commits ao GitHub** e **publicar o site** são operações diferentes. O guia [DEPLOY](docs/DEPLOY.md) explica cada passo. Nenhuma URL pública está declarada como validada nesta entrega local.
