# Relatórios de qualidade

| Arquivo | Conteúdo |
| --- | --- |
| `playwright/index.html` | Relatório HTML da suíte E2E completa sobre o build otimizado |
| `validation.json` | Contagens, ambiente, comando, duração e hashes dos arquivos de `dist` |
| `accessibility.json` | Inspeção WCAG das nove telas em três larguras, verificações de teclado e hashes do build |
| `lighthouse/*.report.html` / `*.report.json` | Três auditorias de cada combinação início/detalhe × mobile/desktop |
| `lighthouse/summary.json` | Medianas, LCP/CLS/TBT, configuração, versões e hashes do build |
| Artefato `public-deployment-reports` | Hashes observados, relatório Playwright e Lighthouse do domínio público, vinculados ao commit de cada execução |

Resultados e reprodução: [VALIDACAO.md](../docs/VALIDACAO.md), [PERFORMANCE.md](../docs/PERFORMANCE.md) e [ambiente de CI](../ci/README.md). Os hashes permitem conferir que E2E e Lighthouse avaliaram o mesmo build.

Execuções novas geram `playwright-report/` e `test-results/`. Traces são preservados para falhas; a CI publica os relatórios e logs como artefatos. Uma execução sem falhas não gera traces de erro. As baselines estão em `tests/e2e/visual.spec.ts-snapshots`, separadas dos frames originais em `docs/design-references`.

A auditoria é feita com mocks, imagens e fontes reais da demonstração. Metas abaixo do mínimo causam saída 1. O relatório de uma versão não comprova alterações posteriores nem substitui validação do domínio público.
