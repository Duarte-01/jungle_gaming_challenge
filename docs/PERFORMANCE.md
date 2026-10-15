# Auditorias Lighthouse — etapa 7

Execução: 15/10/2026, build otimizado servido por Vite preview no container de CI. Foram feitas **12 medições**: três por combinação de início/detalhe e mobile/desktop, com imagens, fontes e todas as funcionalidades ativas no cenário padrão dos mocks. Não havia outro browser concorrente. O comando encerrou com **código 0**; todas as medianas atingiram as metas.

## Medianas

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |     LCP |     CLS |     TBT |
| ------- | ------- | ----------: | -------------: | ------------: | --: | ------: | ------: | ------: |
| Início  | mobile  |          90 |            100 |           100 | 100 | 3.509 s | 0.00000 | 91.5 ms |
| Início  | desktop |         100 |            100 |           100 | 100 | 0.702 s | 0.00000 |  0.0 ms |
| Detalhe | mobile  |          91 |            100 |           100 | 100 | 3.501 s | 0.00000 | 36.0 ms |
| Detalhe | desktop |         100 |            100 |           100 | 100 | 0.721 s | 0.00507 |  0.0 ms |

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

Os 12 pares HTML/JSON estão em `reports/lighthouse/`. Os hashes SHA-256 dos arquivos de `dist` em `summary.json` foram comparados e são iguais aos de `reports/validation.json`, relativos aos 135 E2E aprovados. A auditoria do domínio público ainda não aconteceu. `AUDIT_BASE_URL` permite executá-la depois do deploy.

## O que mudou desde a etapa 5

A etapa 5 tinha performance mobile 83/85, abaixo da meta, e o comando retornava 1. O run remoto antigo também falhou nas capturas; seu Lighthouse estava restrito ao disparo manual. Esses resultados históricos não são apresentados como aprovações.

A implementação passou a baixar UI e mocks em paralelo, carregar resolvers privados e Socket.IO sob demanda, antecipar consultas no mesmo QueryClient e evitar schemas de formulários na inicialização pública. A ativação do MSW continua precedendo as consultas e a captura de WebSocket pelo Engine.IO. Os hashes das duas contas públicas são preparados nas fixtures, sem derivação desnecessária durante a primeira visita. Novos cadastros e login mantêm o processamento real de senhas.

As imagens AVIF reduzem cerca de 84% dos bytes dos quatro PNGs. AVIF usa compressão com perda declarada; WebP é verificado sem perda e PNG original permanece como alternativa. Dimensões, preload do retrato e fontes locais ajudam a reservar espaço e antecipar recursos. A coleta de classes Tailwind se limita ao código e HTML da aplicação, evitando CSS gerado a partir dos visualizadores de relatórios.

A UI pública e MSW ainda representam um custo relevante de JavaScript. O início mobile atingiu exatamente a meta, portanto os checks devem continuar obrigatórios para novas alterações; não é uma garantia de mesma nota em todo hardware. O cenário lento e os fluxos de erro continuaram passando nos E2E. As notas automáticas de acessibilidade complementam testes de teclado/foco, sem comprovar sozinhas toda a acessibilidade ou fidelidade ao Figma.

## Revisão visual da etapa 7

A matriz foi repetida depois dos ajustes dos frames e da descrição acessível dos campos. Os 12 relatórios atuais pertencem ao mesmo build dos 135 E2E aprovados, conferido arquivo por arquivo por SHA-256. O início mantém mediana 90 em performance mobile; o detalhe mantém 91. As demais metas foram preservadas, sem omitir imagens, fontes, mocks ou cenários para a auditoria.

A composição mobile foi alinhada às referências: proporções das imagens, destaque, filtros, hierarquia e espaços. O slider usa controles nativos e as marcas são representações locais; não foi adicionada dependência de slider nem solicitação de fontes/logos externos. As diferenças funcionais necessárias e a família tipográfica aproximada continuam declaradas em `DESIGN.md`. A nota local não garante o mesmo resultado em qualquer hardware ou no futuro deploy.
