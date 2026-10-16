# Auditorias Lighthouse

Execução: 15/10/2026, build otimizado servido por Vite preview no container de CI. Foram feitas **12 medições**: três por combinação de início/detalhe e mobile/desktop, com imagens, fontes e todas as funcionalidades ativas no cenário padrão dos mocks. Não havia outro browser concorrente. O comando encerrou com **código 0**; todas as medianas atingiram as metas.

## Medianas

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |     LCP |     CLS |     TBT |
| ------- | ------- | ----------: | -------------: | ------------: | --: | ------: | ------: | ------: |
| Início  | mobile  |          90 |            100 |           100 | 100 | 3.578 s | 0.00000 | 74.0 ms |
| Início  | desktop |         100 |            100 |           100 | 100 | 0.670 s | 0.00000 |  0.0 ms |
| Detalhe | mobile  |          91 |            100 |           100 | 100 | 3.515 s | 0.00000 | 29.0 ms |
| Detalhe | desktop |         100 |            100 |           100 | 100 | 0.732 s | 0.00507 |  0.0 ms |

Metas preservadas do enunciado: performance ≥90, acessibilidade ≥95, boas práticas ≥95 e SEO ≥90. Cada coluna usa sua própria mediana das três execuções. LCP mede quando o maior conteúdo ficou visível; CLS mede deslocamentos de layout; TBT mede o bloqueio por tarefas longas. Valores individuais, configuração e versões estão em [summary.json](../reports/lighthouse/summary.json).

## Condições e reprodução

- Debian 13, Node.js 24.19.0, Chromium 155.0.8059.39, Lighthouse 13.5.0 e Vite 8.3.4. Imagem reproduzível e comandos em `ci/README.md`.
- Mobile padrão Lighthouse: 412 × 823, DPR 1,75, CPU simulada 4× mais lenta, RTT 150 ms e throughput 1638,4 Kbps.
- Desktop `--preset=desktop`: 1350 × 940, DPR 1, CPU 1×, RTT 40 ms e throughput 10240 Kbps.
- Throttling `simulate`. Cada medição abre um Chrome novo, com reset de armazenamento padrão, sem login prévio. O mock inicia e usa as fixtures reais da demonstração.
- Cenário padrão com latência sintética de 120 ms em catálogo/detalhe e nas operações comuns; cenários de 2 s, fora de ordem, indisponibilidade, recusa e timeout continuam disponíveis. A auditoria mede esta simulação; não mede uma API de produção.
- Flags headless, no-sandbox e disable-dev-shm-usage. Sem bloqueio de assets/scripts, sem desativar MSW/Socket.IO e sem caminho exclusivo de negócio para Lighthouse.

```bash
npm ci
npm run build
npm run audit:lighthouse
```

Para a regressão oficial, use o container documentado; o script aceita `CHROME_PATH` para outros binários. `lighthouse.config.json` mantém páginas, perfis, três repetições e metas. O script inicia/encerra o preview, salva HTML/JSON e falha quando uma mediana fica abaixo da meta. Também exige dados da rota recebidos pela rede MSW, retrato e fonte carregados; uma tela fatal ou skeleton vazio não pode produzir uma aprovação falsa.

`AUDIT_OUTPUT_DIR` permite diagnósticos em outra pasta. `--runs 1` é útil durante a otimização, mas não substitui a matriz completa. O resumo identifica `scope.completeMatrix`. Antes de medir, o script remove o resumo anterior e os relatórios dos alvos selecionados, evitando misturar resultados. A CI também remove relatórios versionados antes de iniciar o job, para não enviar evidência antiga se instalação/build falharem.

Os 12 pares HTML/JSON locais estão em `reports/lighthouse/`. Os hashes SHA-256 dos arquivos de `dist` em `summary.json` foram comparados e são iguais aos de `reports/validation.json`, relativos aos 150 E2E aprovados.

O domínio público também passou na matriz completa de **12 medições**, preservando todas as metas, na [execução 38841326415](https://github.com/Duarte-01/jungle_gaming_challenge/actions/runs/38841326415). Seus HTML/JSON e medianas estão no artefato **public-deployment-reports**, pasta `reports/deploy/lighthouse`. A tabela acima descreve somente a medição local, sem substituir seus números por inferências sobre o ambiente público. `AUDIT_BASE_URL` e `AUDIT_OUTPUT_DIR` permitem repetir a auditoria em outro domínio/pasta.

## Decisões de performance

UI e mocks são baixados em paralelo; resolvers privados, formulários e Socket.IO são carregados sob demanda. As consultas públicas usam o mesmo QueryClient. O MSW é ativado antes das consultas e da captura de WebSocket pelo Engine.IO. Os hashes das contas públicas são fixtures previamente calculadas; cadastros e login mantêm o processamento real das senhas.

Imagens AVIF reduzem aproximadamente 84% dos bytes dos quatro PNGs. As alternativas WebP/PNG e as fontes locais permanecem disponíveis. Dimensões explícitas e preload ajudam a antecipar recursos e reservar espaço. A coleta de classes Tailwind se limita ao código e HTML da aplicação.

MSW e a UI pública têm custo de JavaScript relevante no mobile. Metas continuam obrigatórias na CI. As medições são do build real, com cenário padrão, e não garantem pontuação idêntica em qualquer hardware. Auditorias automáticas complementam testes manuais de teclado, foco e referência visual.
