# Jungle Gaming Challenge

Implementação em andamento do [desafio frontend](https://github.com/junglegaming/frontend-challenge).

**Estado atual:** etapa 3. Início, catálogo, detalhe com adição ao carrinho, cadastro/login/logout, favoritos, perfil/avatar/senha e carrinho com cupom funcionam pela API MSW e persistem após refresh. Pagamento, carteiras, pedidos e eventos de negócio ainda estão pendentes. Os retratos originais foram exibidos no chat, mas os PNGs ainda não estão disponíveis no checkout. Não há deploy público nem auditoria Lighthouse concluída.

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
```

Em um Linux sem as bibliotecas necessárias ao Chromium, instale as dependências do Playwright conforme sua documentação. No ambiente de nuvem, essa necessidade será diagnosticada durante a execução.

Neste ambiente, o download de browsers de `cdn.playwright.dev` é bloqueado pela política de rede. Use o Chromium já instalado, sem precisar do comando `browsers:install`:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Esse override é opcional: em outra máquina, `npm run browsers:install` e `npm run test:e2e` usam o browser do Playwright normalmente. A versão do Chromium da nuvem deve ser registrada junto dos resultados.

Os testes atuais verificam infraestrutura, catálogo, cadastro, login, sessão, favoritos, carrinho, perfil, avatar e senha nas larguras 390, 768 e 1440. Os testes unitários verificam precisão ETH e validação de destinos de retorno após login. Eles **não** constituem a cobertura funcional exigida para a entrega final. Relatórios HTML ficam em `playwright-report/`, e traces de falhas em `test-results/`. Os browsers ficam em `.cache/browsers/`, sem depender de escrita na pasta pessoal da máquina.

## Testar a demonstração manualmente

Use somente dados fictícios. As contas abaixo são fixtures públicas da simulação:

| Conta | E-mail             | Senha fictícia   |
| ----- | ------------------ | ---------------- |
| Ana   | `ana@kurio.test`   | `KurioDemo2026!` |
| Bruno | `bruno@kurio.test` | `KurioDemo2026!` |

Abra um NFT, escolha uma edição e adicione ao carrinho. Favoritos exigem login; o carrinho permite visitante e combina seus itens com os da conta ao entrar. Use `KURIO10` para 10% de desconto. `EXPIRED` simula cupom expirado; outros códigos são inválidos.

Acesse `/setup` para selecionar rede lenta, falha de catálogo/favorito/carrinho, sessão expirada, conflito de cadastro ou falha de conexão. Retorne ao cenário **Padrão** para recuperar o funcionamento. **Restaurar dados de demonstração** apaga contas criadas e alterações locais e restaura catálogo, contas, sessões, carrinhos, favoritos, cupons e cenário conhecidos. O controle de reset continua acessível durante a falha simulada de conexão.

Rotas atuais: `/`, `/nfts/:id`, `/login`, `/cadastro`, `/carrinho`, `/favoritos`, `/perfil` e `/setup`. Use `/carrinho` para testar alterações, remoções e cupons; `/perfil` para dados, avatar e senha. A sessão dura 30 minutos e é recuperada pela API depois do refresh. Alterar a senha exige novo login.

Os dados do mock ficam no navegador deste endereço, não no GitHub. Trocar a porta, o domínio ou o navegador cria outro armazenamento. O reset não altera o código-fonte.

## Onde estudar

- [Roteiro dos dois dias](docs/ROTEIRO.md): ordem de implementação e critérios pendentes.
- [Primeira etapa explicada](docs/ETAPA-01.md): percurso da requisição, arquivos e exercício.
- [Segunda etapa explicada](docs/ETAPA-02.md): URL, filtros, mocks e precisão ETH.
- [Terceira etapa explicada](docs/ETAPA-03.md): sessão, isolamento, favoritos otimistas e carrinho.
- [Contratos REST](docs/CONTRATOS.md): recursos, entradas, respostas e erros implementados.
- [Preparação para apresentação](docs/APRESENTACAO.md): roteiro de estudo e perguntas do treino final.
- [Arquitetura](ARCHITECTURE.md): decisões atuais e limites da base.
- [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

## Publicação futura

Build: `npm run build`; diretório de saída: `dist`. Vercel é a opção inicial, com fallback de rotas em `vercel.json`. O arquivo `public/_redirects` prepara esse fallback para Netlify. A publicação e a validação de acesso direto às rotas ainda estão pendentes. Os mocks precisam permanecer ativos no deploy.

Carteiras, pedidos, cenários de compra/tempo real, regressão visual e auditorias finais serão documentados com sua implementação. Não use esta etapa como entrega final.
