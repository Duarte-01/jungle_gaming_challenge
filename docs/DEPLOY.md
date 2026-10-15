# Publicar na Vercel, passo a passo

O enunciado exige uma URL pública funcionando. A configuração está no repositório, mas a publicação ainda precisa da sua conta e autorização no navegador. Não envie senhas, tokens nem códigos de autenticação pelo chat.

## 1. Criar sua conta

1. Entre em <https://vercel.com/signup>.
2. Escolha **Continue with GitHub** e entre na sua própria conta do GitHub.
3. Se aparecer a escolha de plano, use **Hobby** para este projeto pessoal.
4. Conclua as confirmações de e-mail que o serviço solicitar.

A integração com GitHub permite à Vercel ler o código e publicar atualizações. Quando puder escolher os repositórios autorizados, selecione somente `Duarte-01/jungle_gaming_challenge`.

## 2. Conferir o código no GitHub

O desenvolvimento está na branch `feat/marketplace-base`. A branch `main` ainda contém o estado inicial até você integrar as alterações. **Branch** é uma linha de desenvolvimento; **commit** é um registro salvo; **push** envia esses registros ao GitHub.

1. Abra <https://github.com/Duarte-01/jungle_gaming_challenge>.
2. No seletor de branch, escolha `feat/marketplace-base` e confira os arquivos `src/`, `package.json` e este guia.
3. Abra <https://github.com/Duarte-01/jungle_gaming_challenge/compare/main...feat/marketplace-base>.
4. Revise as alterações e crie o pull request com **Create pull request**. Um título possível é `Implementa marketplace NFT do desafio`.
5. Revise o resultado dos checks, se disponíveis. O workflow foi preparado, mas sua execução no GitHub ainda precisa ser observada. Uma diferença visual entre browsers exige revisar a imagem antes de atualizar baseline.
6. Quando estiver satisfeito com a revisão, use **Merge pull request** e confirme. Confira que `main` passou a conter o projeto.

O merge integra o código na branch principal. Publicar o ambiente do Codex salva o ambiente de trabalho; não executa esse merge nem publica o site.

## 3. Importar na Vercel

1. No painel da Vercel, escolha **Add New → Project**.
2. Selecione a conta do GitHub e importe `jungle_gaming_challenge`.
3. Confira os campos antes de publicar:

| Campo                 | Valor                             |
| --------------------- | --------------------------------- |
| Framework Preset      | Vite                              |
| Root Directory        | `./` (raiz do repositório)        |
| Production Branch     | `main`, depois do merge           |
| Install Command       | `npm ci`                          |
| Build Command         | `npm run build`                   |
| Output Directory      | `dist`                            |
| Node.js               | 24.x, se disponível; mínimo 22.18 |
| Environment Variables | nenhuma obrigatória               |

O arquivo `vercel.json` também registra build e fallback das rotas. Mantenha os mocks ativos: não defina `VITE_ENABLE_MOCKS=false`. Alterar uma variável Vite exige novo build.

4. Clique em **Deploy** e acompanhe o log. Se falhar, leia a primeira mensagem de erro do build; não compartilhe credenciais junto com o log.
5. Ao concluir, abra a URL HTTPS fornecida pela Vercel. Compartilhe essa URL no chat para validarmos o resultado público.
6. Em **Settings → Deployment Protection**, confira se a URL de produção pode ser acessada pelos avaliadores sem login na sua conta. Teste em janela anônima.

As legendas do painel podem mudar. O essencial é importar o repositório correto, publicar o código testado e garantir acesso público.

## 4. Verificar a versão publicada

Faça os passos abaixo no domínio publicado, em desktop e mobile:

1. Abra `/setup`: espere **API simulada conectada** e **Evento recebido via Socket.IO**. Isso verifica REST e transporte dos eventos.
2. Abra diretamente `/nfts/emerald-ape-42` e atualize a página. A tela deve carregar sem erro de rota e mostrar o retrato.
3. Use `/cadastro` com dados fictícios novos; confirme acesso ao perfil depois de atualizar a página. Você também pode entrar com `ana@kurio.test` / `KurioDemo2026!`, uma conta de demonstração já cadastrada.
4. Adicione um NFT ao carrinho, atualize `/carrinho` e confira sua quantidade.
5. Vá a `/pagamento`. Em conta nova, cadastre primeiro uma carteira em `/carteiras`. A conta Ana já possui carteira fictícia. Preencha os dados, conecte a carteira simulada, revise e confirme.
6. Aguarde **Pedido confirmado**, atualize o recibo e confira identificação, valores e o explorador fictício.
7. Em `/setup`, reproduza alteração de preço durante a revisão e timeout após criação, conforme `ETAPA-04.md`. Confira recuperação sem compra duplicada.
8. Abra a URL em janela anônima, sem login na Vercel. O site deve continuar acessível.

O banco da simulação fica no navegador e no domínio. Os dados do ambiente de desenvolvimento não são transferidos ao site publicado; a primeira visita recebe fixtures novas. Cadastros e compras são fictícios, sem envio de e-mail ou fundos reais.

## Atualizações e recuperação

Depois da integração com GitHub, novos commits na branch de produção iniciam outro deploy. Confira o SHA mostrado na Vercel e compare com o commit entregue no GitHub. Guarde a URL de produção para a avaliação.

Se uma rota aberta diretamente devolver 404, confira o projeto/branch e o `vercel.json`. Se imagens ou fontes falharem, confira suas requisições no navegador. Se os mocks não iniciarem, confira o acesso a `/mockServiceWorker.js` e o console. O service worker exige HTTPS no domínio público.

Não é necessário comprar domínio. Netlify é uma alternativa preparada em `netlify.toml`, com saída `dist` e fallback de rotas em `public/_redirects`; ela também exige conta/autorização e validação pública.
