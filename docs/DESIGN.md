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

Na etapa 7, os 13 PNGs foram novamente abertos e comparados com capturas locais das nove telas em 1440 e 414 px, incluindo início e adaptações sem frame. Ajustes ficam em `src/styles/frame-alignment.css`. O acesso direto ao Figma recebeu 403 do proxy; não há acesso à sessão Google do navegador do candidato. Uma exportação SVG com texto editável pode ajudar a resolver a família tipográfica.

A comparação dos PNGs com as telas foi manual. Não há validação automática de igualdade pixel a pixel com o Figma, e não se afirma fidelidade perfeita. Fonte original e espaçamentos finos ainda podem ser refinados se o arquivo de design fornecer medidas e assets adicionais.

## Regressão visual

`tests/e2e/visual.spec.ts` registra início, detalhe, carrinho e pagamento revisado em 390, 768 e 1440 px. As 12 baselines versionadas ficam em `tests/e2e/visual.spec.ts-snapshots`. Elas representam o resultado implementado e permitem detectar mudanças futuras; não substituem os frames originais como referência de design.

Os testes aguardam consultas, conexão, fontes e decodificação das imagens. Cada contexto começa com armazenamento isolado e usa data fixa; animações são desativadas na captura. A captura não substitui respostas REST ou eventos.

```bash
npm run build
E2E_PREVIEW=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- visual.spec.ts --workers=2
```

As baselines foram produzidas em Linux Debian 13, Chromium 154.0.8037.57 e Playwright 1.64.1. A CI usa agora o container Debian 13/Chromium 155 descrito em `ci/README.md`; as 12 capturas anteriores passaram nele antes da alteração de tipografia. Em outra plataforma/browser, diferenças de renderização devem ser inspecionadas. Atualize com `--update-snapshots` somente após revisar a alteração visual; não use a atualização para esconder uma regressão.

Na etapa 6, somente `inicio-desktop-linux.png` foi atualizado após inspecionar a captura e o diff: a diferença ficou restrita ao destaque desktop, incluindo título, saudação, descrição e posição do botão. A mudança aplica as medidas fornecidas pelo candidato. As outras 11 baselines foram preservadas; tolerâncias e asserções não foram reduzidas.

## Revisão por tela — etapa 7

| Tela        | Referência                       | Ajustes desta rodada                                                                                                                      |
| ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Início      | Capturas do chat, desktop/mobile | Duas alças, faixa inicial 0,02–12,30 ETH, sidebar compacta, composição do destaque, cards mobile, navegação e conteúdo editorial resumido |
| Login       | PNG desktop e mobile             | Composição do diálogo/fundo e símbolos locais de autenticação                                                                             |
| Cadastro    | PNG desktop e mobile             | Logotipo mobile, início do formulário, campos contíguos de senha, botão Criar perfil e orientação acessível                               |
| Perfil      | PNG desktop; adaptação mobile    | Colunas, avatar, telefone expansível e saída na sidebar                                                                                   |
| Carteiras   | PNG desktop; adaptação mobile    | Formulário principal aberto, campos em colunas e resumo da outra carteira                                                                 |
| Detalhe     | PNG desktop e mobile             | Estrelas, ordem das edições, resumo mobile, compra e links de compartilhamento                                                            |
| Carrinho    | PNG desktop e mobile             | Margens, conteúdo dos cards, proporções e indicação de taxa estimada                                                                      |
| Pagamento   | PNG desktop e mobile             | Cartões compactos, endereço abreviado, total e detalhamento expansível, confirmação mobile sem sobrepor controles                         |
| Confirmação | PNG desktop; adaptação mobile    | Hierarquia do cabeçalho do recibo e espaçamento, preservando snapshot e navegação                                                         |

Diferenças de estado permanecem explícitas: a conta autenticada mostra seu nome/saída; as fixtures retornam suas contagens, preços e itens; edição indisponível fica desabilitada. A confirmação não declara transação real em blockchain. O perfil usa ações independentes de salvar dados e alterar senha. O pagamento preserva rede, conexão, validação e revisão, mesmo ocupando mais altura que o frame estático.

As 12 baselines foram atualizadas nesta rodada após a inspeção das alterações, usando Chromium 155 no container fixado. A captura aguarda fontes, consultas e imagens e volta ao início da página para não depender da posição da última interação. A execução completa posterior usa comparação normal, sem `--update-snapshots`; seus resultados estão em `VALIDACAO.md`. Não houve aumento de tolerâncias.

No perfil desktop em 1440 × 1080, foram conferidos também os retângulos dos inputs pelo navegador: nome em y=188, e-mail em y=291, apelido em y=394, senha atual em y=533, nova senha em y=624 e confirmação em y=715. Esses topos coincidem com as medidas tomadas no PNG recebido nessa condição. Isso demonstra alinhamento das caixas; não comprova identidade de todos os pixels, da fonte ou de estados com erros.
