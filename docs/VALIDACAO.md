# Evidências de validação

## Escopo

A suíte contém 50 casos executados nos viewports desktop 1440 × 900, tablet 768 × 1024 e mobile 390 × 844. Inclui 12 comparações visuais de início, detalhe, carrinho e pagamento, além de fluxos de sucesso, falha, expiração, isolamento e eventos.

O resultado atual e a duração estão em [`reports/validation.json`](../reports/validation.json); o relatório navegável está em [`reports/playwright/index.html`](../reports/playwright/index.html). Os testes unitários verificam precisão ETH, validação de eventos e destinos internos de autenticação.

## Reprodução

Use o container descrito em [ci/README.md](../ci/README.md), com `CI=true`, `E2E_PREVIEW=true`, dois workers e `--retries=0`. A validação executa tipos, lint, formatação, unitários, build e E2E sobre Vite preview.

As capturas usam Chromium 155.0.8059.39, Debian 13 e fontes locais. Não atualize baselines automaticamente para contornar diferenças de browser ou regressões de layout. Os 13 frames originais são preservados com manifesto de hashes.

## Critérios observados

- URL e REST correspondem aos filtros; refresh/histórico recuperam o estado.
- Cadastro, login, senha, avatar e carteiras usam os handlers reais e persistem.
- Favoritos fazem rollback; carrinho mantém visitante, merge, estoque e precisão.
- Checkout revalida condições, exige conexão/revisão e confirma somente após a API.
- Repetição, timeout e refresh recuperam o mesmo pedido; recibo mantém snapshot.
- Duas contas não compartilham dados privados nem pedidos.
- Eventos passam pelo cliente Socket.IO e toleram versões antigas/duplicatas.
- Rotas privadas, cancelamento da autenticação e falhas de carregamento permitem retorno/recuperação.
- Teclado, foco, formulários, skeletons, responsividade e reflow têm cenários dedicados.

## Lighthouse e identificação do build

São 12 auditorias: três medições por página (início/detalhe) e perfil (mobile/desktop). Resultados, metas, LCP/CLS/TBT e condições estão em [PERFORMANCE.md](PERFORMANCE.md).

Os resumos de E2E e Lighthouse identificam cada arquivo de `dist` por SHA-256. A igualdade dos manifestos confere que os relatórios correspondem ao mesmo build. Cada execução remota também é identificada pelo commit em [GitHub Actions](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/validate.yml).

## Domínio público

A publicação em [junglegamingchallenge.vercel.app](https://junglegamingchallenge.vercel.app/) foi validada pela [execução pública 38841326415](https://github.com/Duarte-01/jungle_gaming_challenge/actions/runs/38841326415), concluída com sucesso em 16/10/2026 UTC (15/10 em Brasília). O pipeline conferiu os **56 arquivos por SHA-256**, executou **nove testes públicos** em 390/768/1440 px e completou **12 medições Lighthouse**, com todas as metas atingidas.

Os testes cobrem acesso anônimo HTTPS, service worker, REST e Socket.IO, assets, acesso direto/refresh das rotas, sessão, cancelamento de autenticação, carrinho persistente, atualização de preço durante a revisão e compra completa com recibo após refresh. O banco da simulação pertence ao armazenamento do navegador; estes testes usam contextos novos e independentes.

[`reports/deploy/verification.json`](../reports/deploy/verification.json) registra o resultado confirmado pela API do GitHub, o commit, a cobertura e o identificador do artefato. O artefato **public-deployment-reports**, disponível na execução acima, contém os hashes observados, relatório Playwright e HTML/JSON Lighthouse do domínio real; a retenção configurada é de 14 dias. O workflow permite nova execução manual com uma URL HTTPS.

## Resultado do build de entrega

A execução completa aprovou **150 E2E**, sem falhas, skips, flaky ou retries, incluindo as 12 comparações visuais. Tipos, lint, formatação, build e quatro unitários passaram. As **12 auditorias Lighthouse** concluíram com código 0 e todas as metas atendidas. Os 56 hashes de `dist` são iguais nos dois resumos de relatórios.
