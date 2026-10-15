# Referências visuais e decisões de interface

## Material recebido

Em 15/10/2026 foram recebidos os ZIPs `modelo Desktop jungle gaming.zip` e `modelo Mobile jungle gaming.zip`. Os 13 PNGs originais estão em `docs/design-references`, com SHA-256 em `manifest.json`. O ZIP desktop inclui login, cadastro, perfil, carteiras, detalhe, carrinho, pagamento e confirmação. O ZIP mobile inclui login, cadastro, detalhe, carrinho e pagamento. A tela inicial usa as capturas desktop/mobile enviadas anteriormente no chat; essas capturas não estavam nos ZIPs.

Os retratos do catálogo são os quatro PNGs originais de 250 × 250 pixels, documentados em `ASSETS.md`. Os arquivos de imagem não foram modificados. Ampliação e recortes da galeria são apresentações CSS do mesmo retrato, pois não foram recebidas quatro obras alternativas para cada NFT.

## Implementação

A composição acompanha os frames: cabeçalho desktop, navegação inferior mobile, autenticação em diálogo sobre a página no desktop e tela própria no mobile, galeria e coluna de compra, tabela de carrinho no desktop e cards no mobile, sidebar da conta, formulários e recibo centralizado. Componentes compartilhados concentram cabeçalho, rodapé, navegação, sidebar, senha e relacionados.

Tokens principais extraídos das capturas:

| Uso              | Cor       |
| ---------------- | --------- |
| Fundo            | `#140d0a` |
| Superfície       | `#241612` |
| Ação/destaque    | `#d28a4c` |
| Texto principal  | `#f5f1eb` |
| Texto secundário | `#cfb28c` |
| Bordas           | `#3f2319` |

Os tokens estão em `src/index.css`. Tailwind participa da composição e dos utilitários; os componentes shadcn/ui foram adaptados à identidade do projeto.

## Substituições e desvios conhecidos

- **Fonte:** os ZIPs não incluem fonte nem especificação tipográfica. Foi usada IBM Plex Mono 400/600 local, por aproximação à referência. Não foi possível confirmar que seja a fonte original do Figma. Arquivos vêm de `@fontsource/ibm-plex-mono`; licença OFL em `public/licenses/ibm-plex-mono-OFL.txt`. A execução não depende de Google Fonts.
- **Ícones:** Lucide e letras nos benefícios do rodapé substituem símbolos sem asset dedicado. Os logotipos de provedores não foram extraídos dos PNGs.
- **Acessibilidade:** controles pequenos receberam áreas de clique maiores e foco visível; abas permitem setas, Home e End; diálogos controlam e devolvem foco. Textos auxiliares explicam os campos e as operações simuladas.
- **Dados reais da simulação:** preços, estoque, edição e itens do recibo vêm da API. Eles podem diferir dos valores estáticos do frame. Não foram fixados no componente para reproduzir um exemplo visual.
- **Pagamento:** conexão, revisão e confirmação são etapas explícitas. Dados do colecionador ficam em uma seção expansível no mobile. O conteúdo completo ocupa mais altura que o frame mobile de uma tela; rolagem mantém todos os controles e validações disponíveis.
- **Confirmação:** cabeçalho/navegação e detalhes expansíveis do colecionador complementam o recibo. Pedidos pendentes e recusados têm seus próprios estados, sem apresentar recibo confirmado.
- **Telas sem frame mobile:** perfil, carteiras, pedidos e confirmação usam a mesma identidade e adaptação responsiva.
- **Ações auxiliares:** Google/Facebook, recuperação de senha, newsletter, conteúdo editorial e links sociais sem destino fornecido mostram uma explicação de escopo. Não aparentam autenticação, envio ou inscrição bem-sucedidos.

A comparação dos PNGs com as telas foi manual. Não há validação automática de igualdade pixel a pixel com o Figma, e não se afirma fidelidade perfeita. Fonte original e espaçamentos finos ainda podem ser refinados se o arquivo de design fornecer medidas e assets adicionais.

## Regressão visual

`tests/e2e/visual.spec.ts` registra início, detalhe, carrinho e pagamento revisado em 390, 768 e 1440 px. As 12 baselines versionadas ficam em `tests/e2e/visual.spec.ts-snapshots`. Elas representam o resultado implementado e permitem detectar mudanças futuras; não substituem os frames originais como referência de design.

Os testes aguardam consultas, conexão, fontes e decodificação das imagens. Cada contexto começa com armazenamento isolado e usa data fixa; animações são desativadas na captura. A captura não substitui respostas REST ou eventos.

```bash
npm run build
E2E_PREVIEW=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- visual.spec.ts --workers=2
```

As baselines foram produzidas em Linux Debian 13, Chromium 154.0.8037.57 e Playwright 1.64.1. Em outra plataforma/browser, diferenças de renderização devem ser inspecionadas. Atualize com `--update-snapshots` somente após revisar a alteração visual; não use a atualização para esconder uma regressão.
