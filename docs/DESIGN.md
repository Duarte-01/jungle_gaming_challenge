# Referências visuais e decisões de interface

## Material recebido

Em 15/10/2026 foram recebidos os ZIPs `modelo Desktop jungle gaming.zip` e `modelo Mobile jungle gaming.zip`. Os 13 PNGs originais estão em `docs/design-references`, com SHA-256 em `manifest.json`. O ZIP desktop inclui login, cadastro, perfil, carteiras, detalhe, carrinho, pagamento e confirmação. O ZIP mobile inclui login, cadastro, detalhe, carrinho e pagamento. A tela inicial usa as capturas desktop/mobile enviadas anteriormente no chat; essas capturas não estavam nos ZIPs.

Os retratos do catálogo são os quatro PNGs originais de 250 × 250 pixels, documentados em `ASSETS.md`. Os PNGs originais não foram modificados; a UI prefere derivados AVIF e oferece WebP/PNG como alternativas, conforme `ASSETS.md`. Ampliação e recortes da galeria são apresentações CSS do mesmo retrato, pois não foram recebidas quatro obras alternativas para cada NFT.

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

- **Fonte:** os ZIPs não incluem fonte. O Figma mostrou ao candidato somente o token `font/family`, sem revelar o nome da família. Foi usada IBM Plex Mono local, por aproximação à referência (400/600 na UI; 500/700 isolados no destaque desktop). Não foi possível confirmar que seja a fonte original do Figma. As medidas fornecidas posteriormente pelo candidato foram aplicadas ao destaque desktop: saudação 14/16 px, peso 500 e tracking 10%; título 43/70 px e peso 700; descrição 14/24 px e peso 400. Arquivos vêm de `@fontsource/ibm-plex-mono`; licença OFL em `public/licenses/ibm-plex-mono-OFL.txt`. A execução não depende de Google Fonts.
- **Ícones:** Lucide e SVGs locais representam navegação, compartilhamento e redes sociais. Os benefícios mantêm W/C/D da referência; os provedores usam símbolos ilustrativos locais. Não são assets extraídos do Figma.
- **Acessibilidade:** controles pequenos receberam áreas de clique maiores e foco visível; abas permitem setas, Home e End; diálogos controlam e devolvem foco. Textos auxiliares explicam os campos e as operações simuladas.
- **Dados reais da simulação:** preços, estoque, edição e itens do recibo vêm da API. Eles podem diferir dos valores estáticos do frame. Não foram fixados no componente para reproduzir um exemplo visual.
- **Pagamento:** conexão, revisão e confirmação são etapas explícitas. Dados do colecionador ficam em uma seção expansível no mobile. O conteúdo completo ocupa mais altura que o frame mobile de uma tela; rolagem mantém todos os controles e validações disponíveis.
- **Confirmação:** cabeçalho/navegação e detalhes expansíveis do colecionador complementam o recibo. Pedidos pendentes e recusados têm seus próprios estados, sem apresentar recibo confirmado.
- **Telas sem frame mobile:** perfil, carteiras, pedidos e confirmação usam a mesma identidade e adaptação responsiva.
- **Ações auxiliares:** Google/Facebook, recuperação de senha, newsletter, conteúdo editorial e links sociais sem destino fornecido mostram uma explicação de escopo. Não aparentam autenticação, envio ou inscrição bem-sucedidos.

## Verificação visual

Os frames originais são preservados com hashes. A implementação foi inspecionada em desktop e mobile; as baselines Playwright cobrem início, detalhe, carrinho e pagamento em três larguras. As comparações verificam regressões da implementação. Não há comparação automática de igualdade com o Figma.

`src/styles/frame-alignment.css` reúne os ajustes sobre a base. A autenticação mobile acrescenta X visível com área de toque de 44 × 44 px. O slider tem duas alças nativas e suporte a teclado. O formulário de pagamento mantém os rótulos e a ordem dos campos principais da referência, com dados de contato e conexão necessários ao fluxo funcional.
