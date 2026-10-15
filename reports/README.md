# Relatórios de validação — etapa 7

- `playwright/index.html`: cópia do relatório HTML da execução completa de E2E sobre o build de produção. O resumo e as condições estão em `docs/VALIDACAO.md`.
- `lighthouse/*.report.html` e `*.report.json`: três medições de cada combinação de início/detalhe e mobile/desktop.
- `lighthouse/summary.json`: resultados individuais, medianas, versões, configuração e hashes dos arquivos do build auditado.
- `playwright-before-notice-dismiss/`: histórico de uma execução com 128 aprovações e uma falha mobile; inclui screenshot e trace. Nessa execução o teste tentava clicar no favorito sob um aviso. A versão seguinte fecha o aviso pelo controle disponível antes de tentar novamente, preservando as asserções de rollback e persistência.
- `validation.json`: identificação do build e da execução de E2E preservada nesta entrega.

Os relatórios de uma execução não comprovam alterações posteriores. Reproduza os comandos da documentação depois de mudar o código. Os endereços internos presentes nos relatórios correspondem à medição local; não são o deploy público obrigatório.

O Lighthouse retorna código 1 quando uma mediana não atinge a meta. Consulte `docs/PERFORMANCE.md`; relatórios completos e boas notas em outras categorias não apagam esse resultado.

Traces de testes com falha são gerados em `test-results/`; o workflow os inclui como artefato em falhas de CI. Uma execução sem falhas não gera traces de erro. As baselines ficam em `tests/e2e/visual.spec.ts-snapshots`, separadas dos frames de referência em `docs/design-references`.
