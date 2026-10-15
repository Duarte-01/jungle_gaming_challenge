# Etapa 6 — corrigir a validação antes de publicar

## Por que o check vermelho importa

O GitHub executa o projeto em outra máquina. Um teste local aprovado não prova que essa máquina também passou. O run `38686726917` teve 117 aprovações e 12 falhas visuais. O job Lighthouse não executava automaticamente: uma condição no YAML o limitava ao disparo manual. Isso foi corrigido; os dois jobs agora executam em push/PR e guardam seus resultados mesmo quando falham.

Uma **baseline** é uma captura aprovada da implementação. O Playwright compara a tela atual com ela. Alterações de browser, sistema e fontes podem mudar os pixels mesmo quando o código é igual. Por isso `ci/Dockerfile` fixa o ambiente usado localmente e no GitHub. A correção foi testada primeiro contra as 12 baselines anteriores, sem atualizá-las. A atualização intencional da tipografia do destaque desktop é uma mudança de design separada.

## Como reduzimos o trabalho da primeira visita

1. O HTML apresenta um carregamento honesto enquanto JavaScript e MSW iniciam. A UI e os módulos dos mocks são baixados em paralelo.
2. Os handlers REST continuam registrados no MSW. Implementações de conta, carteiras e pedidos são carregadas quando recebem a primeira requisição, mantendo os mesmos contratos e validações.
3. Socket.IO é importado depois da ativação do MSW. Isso é necessário porque Engine.IO guarda o construtor WebSocket ao carregar. Importá-lo cedo demais pode escapar da interceptação.
4. As primeiras consultas públicas começam antes da montagem do React e usam o mesmo QueryClient. Não há fixtures injetadas no cache nem respostas alternativas na interface.
5. As contas públicas Ana e Bruno usam hashes PBKDF2 previamente calculados; criar o banco não precisa recalculá-los a cada primeiro acesso. Cadastro e mudança de senha continuam usando salt aleatório e 120.000 iterações.
6. AVIF reduz os bytes dos retratos. WebP sem perda e PNG original são alternativas locais. As dimensões permanecem explícitas para reservar espaço.

O cenário padrão usa 120 ms de latência sintética também no catálogo/detalhe, como as demais operações. Os cenários lentos de 2 s, respostas fora de ordem, indisponibilidade e timeout continuam configuráveis e testados. Os resultados Lighthouse medem esta simulação, não o desempenho de uma API de produção.

## Tipografia recebida

O candidato consultou no Figma três medidas desktop: saudação 14/16 px, peso 500, tracking 10%; título 43/70 px, peso 700; descrição 14/24 px, peso 400. Elas foram aplicadas somente ao destaque desktop. O token `font/family` não revelou seu valor; IBM Plex Mono continua documentada como aproximação. Os pesos 500/700 do destaque têm uma família CSS separada para não mudar acidentalmente outros textos já revisados.

## Exercício guiado

1. Leia os dois jobs de `.github/workflows/validate.yml`. Encontre o comando que faz cada um falhar.
2. Em `src/main.tsx`, acompanhe a ordem: shell → imports → `worker.start` → montagem. Depois encontre a importação dinâmica de Socket.IO.
3. Em `/setup`, escolha carregamento lento. Volte ao catálogo: o skeleton deve aparecer e depois ser substituído pelos dados. Restaure Padrão.
4. Abra o relatório Lighthouse e localize LCP, CLS e TBT. Compare os valores com `docs/PERFORMANCE.md`; uma medição isolada não substitui a mediana exigida.
5. Explique com suas palavras: por que atualizar todas as baselines automaticamente poderia esconder um problema? Por que um hash das contas públicas pode ser fixo, mas um novo cadastro precisa continuar sendo processado?

Não integrar na main nem publicar o site antes da revisão completa e dos checks verdes do commit correspondente. Os requisitos e evidências estão em `REQUISITOS.md`. O deploy ainda será validado separadamente; o treino final usará o projeto e os resultados realmente entregues.
