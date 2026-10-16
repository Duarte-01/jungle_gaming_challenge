# Evidências de validação

## Escopo

A suíte contém 54 casos executados nos viewports desktop 1440 × 900, tablet 768 × 1024 e mobile 390 × 844, totalizando 162 E2E. Inclui 12 comparações visuais de início, detalhe, carrinho e pagamento, além de fluxos de sucesso, falha, expiração, isolamento, eventos e retomada após inatividade.

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

## Verificação complementar de acessibilidade

A inspeção com axe-core 4.14.0 verifica as regras WCAG 2 A/AA e WCAG 2.1 A/AA em início, cadastro, login, detalhe, carrinho, perfil, carteiras, pagamento revisado e recibo confirmado. São 27 inspeções, nas larguras de 390, 768 e 1440 px, mais seis verificações de foco visível e navegação com Tab/Shift+Tab dentro do diálogo de autenticação.

Essa revisão identificou controles cujo nome acessível substituía o texto visível. Os rótulos de conta, edições e compra foram ajustados para incluir esse texto, permitindo sua identificação também por comandos de voz. O resultado do build corrigido está em [`reports/accessibility.json`](../reports/accessibility.json), com versão da ferramenta, resultados por tela e hashes do build. Uma inspeção automatizada não comprova todos os critérios de acessibilidade nem substitui uso com tecnologias assistivas.

## Lighthouse e identificação do build

São 12 auditorias: três medições por página (início/detalhe) e perfil (mobile/desktop). Resultados, metas, LCP/CLS/TBT e condições estão em [PERFORMANCE.md](PERFORMANCE.md).

Os resumos de E2E e Lighthouse identificam cada arquivo de `dist` por SHA-256. A igualdade dos manifestos confere que os relatórios correspondem ao mesmo build. Cada execução remota também é identificada pelo commit em [GitHub Actions](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/validate.yml).

## Domínio público

A publicação em [junglegamingchallenge.vercel.app](https://junglegamingchallenge.vercel.app/) tem um [workflow de verificação pública](https://github.com/Duarte-01/jungle_gaming_challenge/actions/workflows/deploy.yml). Após a Vercel confirmar um deploy de produção, o workflow faz checkout do commit publicado, confere os **56 arquivos por SHA-256**, executa **12 testes públicos** em 390/768/1440 px e completa **12 medições Lighthouse**, preservando todas as metas. O resultado de cada execução permanece vinculado ao commit correspondente.

Os testes cobrem acesso anônimo HTTPS, REST e Socket.IO, assets, acesso direto/refresh das rotas, sessão, cancelamento de autenticação, carrinho persistente, atualização de preço durante a revisão e compra completa com recibo após refresh. Encerram o processo real do service worker como visitante e antes de confirmar a compra. O banco da simulação pertence ao armazenamento do navegador; estes testes usam contextos novos e independentes.

O artefato **public-deployment-reports**, disponível em cada execução, contém `reports/deploy/build.json` com os hashes observados e o commit, relatório Playwright e HTML/JSON Lighthouse do domínio real; a retenção configurada é de 14 dias. O workflow permite nova execução manual com uma URL HTTPS.

## Regressão de retomada da aba

O problema relatado em 16/10/2026 foi reproduzido encerrando o service worker via Chromium DevTools Protocol e revalidando a sessão após 31 segundos de inatividade simulada. Antes da correção, a consulta escapou do MSW e retornou **404** no cenário equivalente a uma hospedagem estática. Repetir a consulta sem reativar o cliente mantinha a falha.

Os quatro casos de `worker-recovery.spec.ts` verificam recuperação automática do visitante, nova tentativa após falha com carrinho preservado, persistência da conta com uma única mutation de perfil e exigência de login para sessão realmente expirada. A API da hospedagem estática é representada apenas por 404 quando o MSW deixa uma solicitação escapar; respostas de negócio continuam sendo produzidas pelos handlers reais. O teste público repete o encerramento sem essa simulação de hospedagem.

## Resultado do build de entrega

A execução completa aprovou **162 E2E**, sem falhas, skips, flaky ou retries, incluindo as 12 comparações visuais. Tipos, lint, formatação, build e quatro unitários passaram. As **12 auditorias Lighthouse** concluíram com código 0 e todas as metas atendidas. Os 56 hashes de `dist` são iguais nos dois resumos de relatórios.
