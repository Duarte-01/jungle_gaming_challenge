# Ambiente reproduzível de validação

A regressão visual depende do browser, sistema operacional e fontes. `Dockerfile` fixa Node 24.19.0, Debian 13 e Chromium 155.0.8059.39; Playwright 1.64.1 é fixado no lockfile. A aplicação carrega fontes locais, e as fontes do sistema são instaladas explicitamente.

## Build e suíte completa

Na raiz do repositório, com Docker disponível:

```bash
docker build --tag kurio-validation --file ci/Dockerfile ci
docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
  --mount type=bind,source="$PWD",target=/app --workdir /app \
  --env npm_config_cache=/tmp/npm-cache --env CI=true --env E2E_PREVIEW=true \
  kurio-validation sh -c 'npm ci && node ci/check-browser.mjs && npm run typecheck && npm run lint && npm run format:check && npm run test:unit && npm run build && npm run test:e2e -- --workers=2 --retries=0'
```

Depois, sem E2E ou outro browser concorrente:

```bash
docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
  --mount type=bind,source="$PWD",target=/app --workdir /app \
  --env npm_config_cache=/tmp/npm-cache \
  kurio-validation npm run audit:lighthouse
```

A configuração XDG usa diretórios graváveis em `/tmp`, inclusive quando o UID do runner não existe no container. `check-browser.mjs` verifica a abertura do endpoint CDP usado pelo Lighthouse. Os jobs preservam logs, relatórios e códigos de saída, inclusive em falhas do Docker build.

## Browser e integridade

`install-chromium.sh` baixa os pacotes exatos do pool oficial Debian por HTTPS e verifica os SHA-256 de `chromium.sha256`. O snapshot Debian de 14/10/2026 é uma alternativa de download. Um checksum divergente encerra a instalação. Dependências e fontes usam os metadados assinados do APT.

Atualizar o browser exige revisar as diferenças antes de alterar baselines. Um browser de outro sistema pode ser usado para testes funcionais, mas não reproduz necessariamente os mesmos pixels.

## Proxy com CA corporativa

O build aceita opcionalmente um bundle confiável pelo segredo BuildKit `kurio_ca_bundle`, montado somente durante a instalação:

```bash
docker build --secret id=kurio_ca_bundle,src=/etc/ssl/certs/ca-certificates.crt \
  --tag kurio-validation --file ci/Dockerfile ci
```

O bundle não é gravado na imagem. Validação TLS, assinaturas e checksums permanecem ativos.
