# Imagens originais

Fonte: arquivo `Imagens projeto jungle gaming.zip` fornecido pelo candidato em 15/10/2026. O ZIP contém quatro PNGs de 250 × 250 pixels. Foram copiados sem conversão, recorte ou geração de novas imagens para `public/images/nfts/`.

| Arquivo no projeto | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `emerald-ape.png`  | `358616ec920e300cd0dc8e5470f19481dc0a5115b413826624b5d34fc14a607a` |
| `sage-nomad.png`   | `66c1e3e83dd0a4ae875c13e7c4576987d3c014280e155f1807689b59fda43272` |
| `neon-vessel.png`  | `77075cabfcf0b2bee451dc14e03655e1ae90abd2e165ffe746da058fd23292b2` |
| `golden-beat.png`  | `f821c01cb38ab4ce4b51888d0bc8e7af18e6ca97417a9ee04d70c55226db7277` |

As variantes do catálogo reutilizam esses quatro retratos, conforme as capturas disponíveis. Há teste de carregamento dos nove cards da primeira página, com verificação da resolução natural. Posteriormente foram recebidos os frames de detalhe, conta, carteira e pagamento, preservados em `docs/design-references/`. Os ZIPs não incluem fonte ou ícones separados. A fonte local aproximada, sua licença e os desvios conhecidos estão em [DESIGN](DESIGN.md).

## Derivados para a execução

`npm run assets:optimize` usa Sharp 0.35.5 e gera AVIF (qualidade 90, chroma 4:4:4) e WebP (lossless, exact). AVIF tem compressão com perda: é uma aproximação visual da arte, não identidade de pixels. O script decodifica e compara cada WebP com o PNG original e falha se os pixels RGBA diferirem. Os PNGs continuam disponíveis sem alteração.

| Retrato     |  PNG original |         AVIF |
| ----------- | ------------: | -----------: |
| Emerald Ape | 113.615 bytes | 18.393 bytes |
| Sage Nomad  | 111.819 bytes | 17.801 bytes |
| Neon Vessel | 107.424 bytes | 15.869 bytes |
| Golden Beat | 117.014 bytes | 20.357 bytes |

A redução total dos quatro retratos em AVIF é de aproximadamente 84%. Dimensões, opções e SHA-256 de todos os arquivos estão em `public/images/nfts/manifest.json`. O componente `NftImage` usa `<picture>` com fontes AVIF/WebP e `<img>` PNG. Browser incompatível escolhe a alternativa suportada; não há dependência de CDN de imagens.
