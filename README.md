# Kurio — NFT Marketplace

[![Validate marketplace](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/validate.yml/badge.svg?branch=main)](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/validate.yml)
[![Validate public deployment](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/deploy.yml)

Marketplace responsivo de NFTs desenvolvido por **Zandor Duarte** para o [desafio frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge), com base no [Figma fornecido](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

A aplicação implementa descoberta, conta do colecionador, carteiras e compra completa com API REST e eventos Socket.IO simulados na camada de rede. A confirmação depende do estado do pedido na API. Todas as credenciais, carteiras, transações e referências de exploração são fictícias.

**Demonstração pública:** [junglegamingchallenge.vercel.app](https://junglegamingchallenge.vercel.app/).

A verificação do domínio publicado é executada pelo workflow [Validate public deployment](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/deploy.yml) após a Vercel confirmar um deploy de produção. O pipeline confere os 56 arquivos, executa 12 testes públicos nos três viewports e realiza 12 medições Lighthouse. Os relatórios são anexados à execução do commit correspondente. Evidências e condições em [VALIDACAO.md](docs/VALIDACAO.md).

## Stack

React 19, TypeScript 6, TanStack Router, TanStack Query, Axios, Tailwind CSS 4, componente Button no padrão shadcn/ui com Radix, MSW 2, socket.io-client, Playwright, Lighthouse e Vite. Zod valida os contratos de entrada; valores em ETH usam strings decimais e BigInt em wei.

## Execução local

Requisitos: Node.js **22.18+** e npm. A CI usa Node **24.19.0**, Debian 13 e Chromium 155.0.8059.39 em [container reproduzível](ci/README.md).

```bash
npm ci
npm run dev:mocks
```

O Vite informa o endereço no terminal. Não é necessário backend, extensão de carteira, serviço privado nem credencial real. Imagens e fontes são locais.

### Variáveis de ambiente

| Variável            | Padrão | Comportamento                                                                             |
| ------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa MSW em desenvolvimento e no build publicado. `false` exige uma API real compatível. |

O arquivo `.env.example` documenta a configuração. Variáveis Vite são incorporadas no build; mudanças exigem novo build. Mantenha os mocks ativos na demonstração.

### Comandos

| Comando                             | Finalidade                                                                |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev` / `npm run dev:mocks` | Desenvolvimento com mocks por padrão                                      |
| `npm run build`                     | Verificação TypeScript e build otimizado em `dist`                        |
| `npm run preview`                   | Servir o build localmente                                                 |
| `npm run typecheck`                 | Verificação de tipos                                                      |
| `npm run lint`                      | Análise estática com oxlint                                               |
| `npm run format:check`              | Conferência Prettier                                                      |
| `npm run test:unit`                 | Precisão ETH, destinos de autenticação e eventos                          |
| `npm run browsers:install`          | Instalar Chromium para Playwright                                         |
| `npm run test:e2e`                  | E2E e regressão visual nos três viewports                                 |
| `npm run test:deploy`               | Validar o domínio indicado por `DEPLOY_BASE_URL` nos três tamanhos        |
| `npm run test:report`               | Abrir o relatório HTML atual                                              |
| `npm run audit:lighthouse`          | Três medições de início/detalhe em mobile/desktop, com metas obrigatórias |
| `npm run assets:optimize`           | Reproduzir derivados AVIF/WebP dos PNGs preservados                       |

Para comparar as baselines exatamente como na CI, use [ci/README.md](ci/README.md). Outros sistemas/browsers podem produzir diferenças de renderização que precisam de inspeção. Os testes funcionais podem usar o Chromium instalado pelo Playwright; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permite indicar outro executável.

## Avaliar os fluxos

### Credenciais fictícias

| Conta | E-mail             | Senha            |
| ----- | ------------------ | ---------------- |
| Ana   | `ana@kurio.test`   | `KurioDemo2026!` |
| Bruno | `bruno@kurio.test` | `KurioDemo2026!` |

As duas contas já existem nas fixtures e têm carteiras simuladas. O cadastro permite criar outra conta fictícia; cadastre sua carteira em `/carteiras` antes de comprar. Endereço Ethereum fictício válido: `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.

1. No início, combine busca, filtros, ordenação e paginação; atualize a página e use o histórico para conferir a restauração pela URL.
2. Abra um NFT, escolha edição/quantidade e adicione ao carrinho. O visitante mantém seus itens após refresh e os combina com o carrinho da conta ao entrar.
3. Use `KURIO10` para 10% de desconto. `EXPIRED` representa cupom expirado; códigos desconhecidos são inválidos.
4. Em `/pagamento`, confira o perfil e preencha o telefone; no mobile, expanda **Perfil do colecionador**. Selecione carteira/rede/provedor, conecte a carteira simulada, marque a revisão e use **Revisar pedido**.
5. Confira os valores antes de **Confirmar compra simulada**. O pedido passa por pendente e só apresenta recibo após confirmação da API. Atualize o recibo para conferir seu snapshot.
6. Em perfil/carteiras, altere dados e avatar e confira a persistência. Alterar a senha invalida as sessões e exige novo login.

Os dados ficam no armazenamento do navegador, separados por origem. Outro domínio, porta, navegador ou janela anônima recebe uma base independente. A sessão dura 30 minutos. Não use dados pessoais nem senhas reais.

### Cenários e reset

Acesse `/setup`, selecione um cenário e navegue para o fluxo desejado. A seleção persiste até voltar a **Padrão** ou executar **Restaurar dados de demonstração**. O reset apaga alterações, contas criadas, pedidos, carteiras, rascunhos e tentativas e restaura as fixtures.

| Cenário                              | Reprodução e resultado esperado                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Rede lenta / latência variável       | Observe skeletons; envie buscas sucessivas. A resposta antiga não substitui a busca atual.                                                |
| Falha no catálogo / falha de conexão | Provoque uma consulta, confira o erro, retorne a Padrão e use **Tentar novamente**.                                                       |
| Falha ao salvar favorito             | Favorite um item autenticado. A mutation falha e restaura o estado anterior.                                                              |
| Falha ao atualizar carrinho          | Altere uma quantidade; o erro preserva os itens. Volte a Padrão e repita.                                                                 |
| Sessão expirada                      | Acesse uma rota privada. Após login, o destino e os dados do checkout são recuperados.                                                    |
| Conflito no cadastro                 | Envie o formulário; o erro de e-mail é associado ao campo.                                                                                |
| Carteira recusada                    | Use **Conectar carteira simulada**. A recusa impede a compra até uma conexão válida.                                                      |
| Pagamento recusado                   | Finalize a revisão. O pedido recusado preserva os itens e permite nova tentativa.                                                         |
| Timeout após criar o pedido          | Confirme a compra. A recuperação consulta/reenvia a mesma chave sem duplicar o pedido.                                                    |
| Pedido pendente                      | Confirme e interrompa o socket ou atualize a página. O mesmo pedido é recuperado. Use os controles de confirmação/recusa para encerrá-lo. |

O painel **Eventos e recuperação** altera preço, esgota edição, expira cupom, interrompe o socket e resolve pedidos pendentes via REST. Para reproduzir uma mudança enquanto o checkout permanece aberto, execute no console do navegador **nessa mesma aba**:

```js
await fetch('/api/testing/nfts/emerald-ape-42', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priceEth: '2.19' }),
})
```

A versão da cotação perde validade e exige nova revisão. O transporte usa o cliente Socket.IO; o painel e os endpoints não injetam dados nos componentes. O mock de eventos pertence à instância da página; notificações entre abas independentes não são simuladas.

Rotas: `/`, `/nfts/:nftId`, `/login`, `/cadastro`, `/perfil`, `/carteiras`, `/favoritos`, `/carrinho`, `/pagamento`, `/pedidos`, `/pedidos/:orderId`, `/explorador/:reference` e `/setup`.

## Qualidade e evidências

A suíte cobre 54 casos em **390, 768 e 1440 px**, totalizando **162 E2E**, incluindo 12 comparações visuais. Quatro testes unitários cobrem invariantes de precisão, redirecionamento e eventos. Os cenários incluem encerramento real do service worker durante a navegação, nova tentativa, carrinho preservado e sessão expirada. O workflow executa tipos, lint, formatação, unitários, build, E2E e Lighthouse; falhas mantêm seu código de saída e geram artefatos.

Os relatórios versionados estão em `reports/playwright/`, `reports/validation.json` e `reports/lighthouse/`. Novas execuções produzem `playwright-report/` e `test-results/`; traces são gerados para falhas e enviados pela CI. Os resumos identificam os arquivos do build por SHA-256. Consulte [validação](docs/VALIDACAO.md) e [performance](docs/PERFORMANCE.md) para resultados e condições; baselines verificam regressão da implementação e não equivalem a comparação automática com o Figma.

## Arquitetura e documentação

- [ARCHITECTURE.md](ARCHITECTURE.md): responsabilidades, sessão, carrinho, cache, idempotência, tempo real e limitações.
- [Contratos REST e eventos](docs/CONTRATOS.md).
- [Matriz de requisitos](docs/REQUISITOS.md).
- [Decisões visuais e acessibilidade](docs/DESIGN.md).
- [Origem e integridade dos assets](docs/ASSETS.md).
- [Auditorias Lighthouse](docs/PERFORMANCE.md).
- [Ambiente de CI reproduzível](ci/README.md).

## Hospedagem

Vercel: preset Vite, raiz do repositório, `npm ci`, `npm run build`, saída `dist`, Node 24.x e branch `main`. Não são necessárias variáveis secretas. `vercel.json` configura o fallback das rotas e impede cache persistente do service worker. Alternativas: Netlify (`netlify.toml`/`public/_redirects`) e Cloudflare Pages.

O domínio público exige HTTPS para o service worker. Após publicar, confira `/setup`, acesso direto e refresh de `/nfts/emerald-ape-42`, autenticação, carrinho, confirmação da compra e eventos. Alterar o domínio não transfere os dados locais da simulação.

Para repetir os testes no domínio publicado, sem iniciar servidor local:

```bash
DEPLOY_BASE_URL=https://seu-dominio-publicado npm run test:deploy
```

Esse parâmetro pertence apenas ao runner de testes. O relatório público fica em `reports/deploy/playwright/` e verifica REST/Socket.IO, assets, refresh de rotas, carrinho, autenticação, revisão de preço e recibo.
