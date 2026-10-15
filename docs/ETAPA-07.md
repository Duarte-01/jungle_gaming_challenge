# Etapa 7 — comparar o desenho com a aplicação

Um teste de captura pode passar mesmo quando a aplicação difere do Figma. Ele compara a tela com uma imagem da própria implementação, chamada baseline. Por isso, primeiro revisamos os frames originais e corrigimos a interface; depois atualizamos as baselines e executamos os testes novamente, sem o modo de atualização.

## O exemplo da faixa de preço

O desenho pede duas alças: uma para o mínimo e outra para o máximo. Dois campos numéricos atendiam à filtragem, mas mudavam a interação e a composição visual. Agora usamos dois controles nativos `input type="range"`, com nomes acessíveis, teclado e foco visível. Não acrescentamos uma biblioteca de slider ao carregamento inicial.

A faixa inicial é 0,02–12,30 ETH, como no frame; a escala padrão termina em 16 ETH. Se uma URL trouxer um limite maior, a escala se adapta, com proteção para valores extremos. A alça trabalha em passos de 0,01 ETH; parâmetros decimais recebidos pela URL continuam preservados como strings. `Number` é usado somente para desenhar a posição da alça; comparações de limites e cálculos monetários usam conversão exata para wei.

Mover uma alça altera o rascunho do filtro. **Aplicar** envia os dois limites para o estado da URL, reinicia a paginação e provoca uma consulta Axios, interceptada pelo MSW. Atualizar a página restaura o filtro pela URL. Selecionar novamente uma coleção ou rede remove aquele filtro; **Limpar filtros** volta à faixa inicial. As contagens vêm da API, e não foram copiadas dos números ilustrativos do Figma.

O novo E2E usa as setas, tenta cruzar as alças, observa os parâmetros REST, atualiza a página, limpa os filtros, clica na trilha e arrasta uma alça. Assim, verifica o comportamento real, além da aparência.

## O que mudou nas outras telas

- **Início mobile:** busca e destaque voltaram às posições medidas na captura; o pequeno retrato sobreposto foi incluído; as imagens dos cards recuperaram a proporção quadrada dentro da moldura. A ordenação fica no drawer de filtros. O resultado da busca continua anunciado para leitores de tela.
- **Login e cadastro:** composição do diálogo desktop e do fundo; logotipo e posição dos campos no cadastro mobile; botão **Criar perfil** no mobile e **Criar conta** no desktop. A orientação da senha foi associada ao campo e posicionada depois da confirmação.
- **Perfil:** campos em duas colunas, avatar com prévia e controles **Alterar/Remover**, formulário mais compacto, telefone em **Dados adicionais** e saída na sidebar. Perfil e senha continuam usando operações independentes; alterar a senha encerra a sessão.
- **Carteiras:** formulário principal aberto ao entrar, colunas e campos alinhados, outra carteira resumida abaixo. O nome de exibição é lido do perfil; para alterá-lo, use Dados do perfil. A função principal/secundária continua sendo validada pela API. O feedback de salvamento é mantido na página para sobreviver à troca do formulário ao cadastrar a primeira carteira; um E2E cria uma conta nova e verifica esse caminho.
- **Detalhe:** estrelas e avaliações no desktop, ordem visual das edições, descrição resumida no mobile, compra e carrinho nas proporções do frame e compartilhamento por links convencionais. Edição esgotada permanece desabilitada; quantidade respeita o estoque.
- **Carrinho:** margens e alinhamento dos cards mobile, indicação de taxa estimada e resumo no fim da área disponível. Um carrinho com um item não precisa inventar os quatro itens ilustrativos do frame.
- **Pagamento:** cartões compactos, endereço abreviado com o valor completo acessível, total visível e botão para expandir itens e taxas no mobile. Conexão, revisão e confirmação continuam explícitas; o botão de confirmação acompanha a rolagem do formulário, sem cobrir outros controles.
- **Recibo e rodapé:** hierarquia, espaçamentos, símbolos locais e composição dos blocos. O recibo continua vindo do snapshot confirmado pela API.

Os refinamentos de apresentação ficam em `src/styles/frame-alignment.css`, importado depois dos estilos de base. As regras de negócio permanecem nos hooks, contratos e handlers correspondentes. Os PNGs recebidos não foram alterados.

## Exercício de revisão

1. Abra a demonstração e, no mobile, entre em **Abrir filtros**.
2. Foque **Preço mínimo em ETH** com Tab e pressione a seta para a direita. Observe a faixa exibida.
3. Clique em **Aplicar**, feche o drawer e atualize a página. Abra os filtros novamente e confira o valor.
4. Limpe os filtros e escolha **Menor preço** dentro do drawer. Observe a URL e a nova ordem.
5. Entre com a conta fictícia Ana, abra Perfil e altere o avatar. Abra **Dados adicionais** para editar o telefone e salve.
6. Em Carteiras, edite um endereço. Teste um endereço inválido antes de salvar um válido; atualize a página.
7. Faça uma compra, abra **Ver itens e valores**, confira o total, conecte a carteira e revise. Confirme somente depois da cotação revisada.

Para apresentar essa etapa, explique: “Primeiro comparei a implementação com as referências. Corrigi a composição e preservei os contratos e as validações. Depois revisei as capturas e executei novamente os testes e as auditorias.” Consulte os resultados efetivamente concluídos em `VALIDACAO.md` e `PERFORMANCE.md`.

## Limites da comparação

Foram recebidos 13 PNGs de frames e capturas do início. Eles permitem inspecionar composição, cores e proporções, mas não revelam o valor de `font/family`. O acesso direto ao Figma retornou bloqueio do proxy neste ambiente; a sessão Google do navegador do candidato não é compartilhada com o ambiente de execução. Não são necessárias senhas ou tokens no chat.

A família IBM Plex Mono continua sendo uma aproximação declarada. Uma exportação SVG com texto editável, sem **Outline text**, pode ajudar a identificar a família em vez de consultar texto por texto. Os retratos originais têm 250 × 250 pixels; ampliá-los não cria os detalhes presentes em uma fonte de maior resolução.

Não se afirma igualdade de 100%, pontuação garantida ou conclusão da entrega pública. O deploy e sua validação continuam pendentes e suspensos por solicitação do candidato; o treino final e a identificação profissional do perfil GitHub ficam para o fechamento.

## Por que uma CI pode falhar com testes locais aprovados

A primeira execução remota desta etapa falhou antes dos testes: o Debian atualizou o índice e deixou de listar a versão do Chromium fixada no Dockerfile. A imagem já preparada na nuvem ainda continha essa versão. Uma construção local sem cache reproduziu o erro, separando o problema de instalação do comportamento da aplicação.

A correção mantém os mesmos binários e fixa também seus arquivos e SHA-256. O instalador busca o pacote oficial, verifica sua integridade e só então instala. A CI continua construindo do zero e executando todos os checks. A imagem reconstruída precisa passar pelas mesmas capturas, sem alterar PNGs para esconder esse erro. Os detalhes técnicos estão em `ci/README.md`.
