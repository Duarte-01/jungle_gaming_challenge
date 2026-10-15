# Ambiente reproduzível de validação

As capturas visuais dependem do browser, das fontes e do sistema operacional. O runner Ubuntu com o Chromium distribuído pelo Playwright não reproduziu as baselines geradas em Debian. O workflow agora executa os dois jobs no mesmo container definido em `Dockerfile`.

- Base Node 24.19.0 / Debian 13 fixada por digest.
- Chromium 155.0.8059.39 e Playwright 1.64.1 fixados. As baselines anteriores, geradas com Chromium 154 no Debian 13, foram comparadas sem atualização no novo container antes de alterar o design.
- `XDG_CONFIG_HOME` e `XDG_CACHE_HOME` apontam para diretórios graváveis em `/tmp`, inclusive quando o UID do runner não existe em `/etc/passwd`. Sem configuração XDG, esse caso produziu erro de crashpad na reprodução local. O preflight abre o Chromium pelo mesmo launcher/CDP usado pelo Lighthouse e mostra stderr se falhar.
- Fontes do sistema instaladas explicitamente; a aplicação usa fontes locais.
- Se a versão fixada desaparecer do repositório APT, o build deve falhar. Atualize a versão deliberadamente, inspecione as diferenças e execute novamente os testes. Não remova a fixação para silenciar o problema.

Na raiz do projeto, com Docker disponível:

```bash
docker build --tag kurio-validation --file ci/Dockerfile ci
docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
  --mount type=bind,source="$PWD",target=/app --workdir /app \
  --env npm_config_cache=/tmp/npm-cache --env XDG_CACHE_HOME=/tmp/kurio-cache \
  --env CI=true --env E2E_PREVIEW=true \
  kurio-validation sh -c 'npm ci && npm run typecheck && npm run lint && npm run format:check && npm run test:unit && npm run build && npm run test:e2e -- --workers=2 --retries=0'
```

Depois, sem E2E concorrente:

```bash
docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
  --mount type=bind,source="$PWD",target=/app --workdir /app \
  --env npm_config_cache=/tmp/npm-cache --env XDG_CACHE_HOME=/tmp/kurio-cache \
  kurio-validation npm run audit:lighthouse
```

O segundo comando usa o build produzido pelo primeiro. O Dockerfile define os caminhos do Chromium para ambos os runners. No GitHub, cada job instala e constrói sua própria cópia. Os logs completos são guardados, e falhas recebem um trecho limitado no job summary. Lighthouse executa em push/PR e não depende do sucesso do outro job; uma falha E2E não deve ocultar a auditoria. Relatórios e traces são enviados mesmo em falhas.

Desenvolvimento local pode usar o browser do Playwright, mas a regressão visual oficial deve usar este ambiente. Nunca atualize as capturas sem inspecionar a alteração nem aumente tolerâncias para obter aprovação. Publicação do ambiente Codex, push, integração na main e deploy são operações diferentes. Main e deploy permanecem suspensos até a revisão solicitada pelo candidato.

## Pacotes fixados fora do índice APT

Em 15/10/2026, o run `38804230419` falhou na construção dos dois containers: o índice APT já não oferecia `155.0.8059.39-1~deb13u1`. Os testes e o Lighthouse nem chegaram a executar. A imagem local previamente construída continuava funcionando; o erro foi reproduzido com `--no-cache`.

`install-chromium.sh` baixa os dois pacotes exatos do pool oficial Debian por HTTPS e verifica os SHA-256 de `chromium.sha256` antes da instalação. Há uma alternativa no snapshot de 14/10/2026 se o pool responder com falha de download. Um checksum incorreto encerra a construção; não troca a versão ou aceita outro hash. Dependências e fontes continuam sendo resolvidas pelo APT com os metadados assinados da distribuição.

Os arquivos e scripts de manutenção dos pacotes baixados foram comparados com a imagem anterior: 47 itens conferidos sem diferenças; oito arquivos de documentação eram omitidos pela distribuição slim. O Chromium permanece 155.0.8059.39. Não é necessário regenerar capturas para contornar a indisponibilidade do índice.

Para builds atrás de um proxy corporativo que usa uma CA própria, o Dockerfile aceita opcionalmente o segredo BuildKit `kurio_ca_bundle`, contendo o bundle de certificados confiáveis da máquina. Ele só é montado durante a instalação e não é gravado na imagem. Exemplo, se esse for o caminho do bundle confiável da sua máquina:

```bash
docker build --secret id=kurio_ca_bundle,src=/etc/ssl/certs/ca-certificates.crt \
  --tag kurio-validation --file ci/Dockerfile ci
```

No GitHub público, o bundle normal do sistema é suficiente. Nesta nuvem foi verificado o download pelo pool oficial com o bundle confiável fornecido ao build; o domínio `snapshot.debian.org` é bloqueado pelo proxy e a alternativa de download não foi exercitada localmente. Não use `curl -k`, repositórios `trusted=yes` ou flags para ignorar assinaturas/checksums.

A construção limpa corrigida e o preflight CDP concluíram com sucesso nesta nuvem. As 12 capturas passaram na imagem reconstruída sem modificar baselines. O workflow guarda também a saída do Docker build no arquivo de log enviado como artefato; o shell mantém `pipefail`, para que `tee` não transforme uma falha em sucesso.
