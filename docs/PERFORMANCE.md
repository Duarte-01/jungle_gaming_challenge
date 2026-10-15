# Auditorias Lighthouse da etapa 5

Execução: 15/10/2026, build otimizado servido por Vite preview. Foram feitas **12 medições**: três por combinação de início/detalhe e mobile/desktop, com o cenário padrão dos mocks, imagens e fontes locais e todas as funcionalidades ativas. Não havia outro browser de E2E concorrente durante a auditoria.

## Medianas

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |     LCP |     CLS |      TBT |
| ------- | ------- | ----------: | -------------: | ------------: | --: | ------: | ------: | -------: |
| Início  | mobile  |          83 |            100 |           100 | 100 | 4.398 s | 0.01944 | 157.0 ms |
| Início  | desktop |          99 |            100 |           100 | 100 | 0.981 s | 0.00000 |   0.5 ms |
| Detalhe | mobile  |          85 |            100 |           100 | 100 | 4.199 s | 0.00000 |  92.0 ms |
| Detalhe | desktop |          99 |            100 |           100 | 100 | 0.987 s | 0.00507 |   0.0 ms |

Metas do enunciado: performance ≥90, acessibilidade ≥95, boas práticas ≥95 e SEO ≥90. **Performance mobile não atingiu a meta nas duas páginas.** Desktop e as demais categorias atingiram suas metas. O comando encerrou com **código 1**, conforme a configuração; o resultado não é apresentado como aprovação completa da auditoria.

LCP mede quando o maior conteúdo ficou visível; CLS mede deslocamentos de layout; TBT mede o tempo em que tarefas longas bloquearam a thread principal. Cada coluna acima usa sua própria mediana das três execuções. Valores completos e notas individuais estão em [summary.json](../reports/lighthouse/summary.json).

## Condições e reprodução

- Debian 13, Node.js 24.19.0, npm 11.9.0, Chromium 154.0.8037.57, Lighthouse 13.5.0 e Vite 8.3.4.
- Mobile padrão Lighthouse: viewport 412 × 823, DPR 1,75, CPU simulada 4× mais lenta, RTT 150 ms e throughput 1638,4 Kbps.
- Desktop com `--preset=desktop`: 1350 × 940, DPR 1, CPU 1×, RTT 40 ms e throughput 10240 Kbps.
- Método de throttling `simulate`. São condições do Lighthouse, distintas dos viewports E2E 390/768/1440. Os resultados não representam tempo garantido em qualquer aparelho real.
- Cada medição abre um processo Chrome novo; reset de armazenamento padrão do Lighthouse, sem sessão autenticada previamente. O mock inicia e usa as fixtures da demonstração.
- Flags: headless, no-sandbox e disable-dev-shm-usage para Chromium no container. Sem bloqueio de imagens, fontes ou scripts e sem desativar MSW/Socket.IO.

```bash
npm ci
npm run build
npm run audit:lighthouse
```

O script usa Chromium do sistema quando disponível. Para outro binário, informe `CHROME_PATH`. `lighthouse.config.json` mantém páginas, perfis, três repetições e metas. `scripts/lighthouse.mjs` inicia e encerra o preview, salva HTML/JSON e retorna falha se uma mediana ficar abaixo da meta. `AUDIT_BASE_URL` permite medir a publicação depois do deploy; essa auditoria pública ainda não foi realizada.

Arquivos `reports/lighthouse/{home,detail}-{mobile,desktop}-{1,2,3}.report.html/json` preservam as 12 medições. `summary.json` registra versões, condições, observações individuais, medianas e SHA-256 dos arquivos de `dist`. Esses hashes coincidem com `reports/validation.json`, que identifica o build dos 129 E2E aprovados. Mudanças de código exigem novas evidências.

## Diagnóstico dos resultados abaixo da meta

O LCP mobile ficou em aproximadamente 4,2–4,4 s na simulação. Os relatórios apontam JavaScript não utilizado na navegação inicial e custo de execução dos bundles de bootstrap, mocks e dependências compartilhadas. O trecho `browser-*.js` inclui a infraestrutura MSW; módulos compartilhados também carregam contratos de conta/checkout. A aplicação aguarda a interceptação antes de importar o módulo que utiliza Socket.IO e depois consulta os dados por REST. Essa cadeia e seu custo de JavaScript contribuem para o atraso sob CPU/rede simuladas. O tempo de renderização do elemento de LCP aparece no diagnóstico; não basta reduzir o arquivo da imagem.

As imagens originais já são pequenas (250 × 250), têm dimensões explícitas e preload do destaque nas rotas conhecidas. As fontes são locais e têm preload. Rotas de conta/compra são carregadas sob demanda, mas isso ainda não reduz o custo inicial o suficiente para atingir 90 no mobile. Não foram removidos mocks, autenticação, eventos ou assets para elevar a nota.

Próximo trabalho de performance: reduzir o JavaScript inicial e o código compartilhado entre mocks e aplicação, verificando o carregamento sob demanda dos handlers e dependências sem interromper REST, sessão ou a ordem de inicialização Socket.IO. Isso precisa ser medido novamente com os mesmos cenários; é uma possibilidade de melhoria, não uma otimização já entregue.

## Correções verificadas

O detalhe sofria um deslocamento grande durante a troca do skeleton: margem colapsando e rodapé exibido cedo alteravam a composição. O layout de carregamento agora reserva as colunas da galeria/informações e contém a margem. A mediana CLS mobile do detalhe foi 0; o teste lento também verifica que o início do conteúdo permanece no mesmo lugar. As áreas clicáveis dos indicadores foram ampliadas, e a nota automática de acessibilidade chegou a 100 nas quatro combinações. Essa nota complementa os testes de teclado/foco, sem substituir toda avaliação manual de acessibilidade.

A limitação mobile está explicitada conforme o enunciado exige para notas abaixo da meta. Isso permite avaliar a entrega com evidências reais, sem afirmar que todas as metas foram cumpridas.
