# Etapa 3 — sessão, favoritos, carrinho e perfil

## O que você já consegue fazer

Criar uma conta fictícia, entrar, sair, favoritar um NFT, adicionar edições ao carrinho, alterar quantidades, aplicar cupom e editar perfil, avatar e senha. Essas operações passam pela API simulada e sobrevivem ao refresh. Pagamento e carteiras ainda são a próxima etapa.

As telas novas seguem a identidade provisória Kurio. Precisamos dos respectivos frames do Figma para conferir a composição exata. Os quatro retratos enviados aparecem no chat, mas ainda precisam chegar como arquivos acessíveis ao ambiente, por exemplo em um ZIP. Não recriamos as imagens.

## 1. O que é uma sessão?

É o vínculo temporário entre uma requisição e a conta que está usando a aplicação. Informar nome e e-mail na interface não prova quem está fazendo uma requisição: a API precisa verificar a sessão em cada operação privada.

No nosso fluxo:

1. O formulário envia e-mail e senha pelo Axios.
2. O MSW procura a conta, verifica a senha e cria uma sessão de 30 minutos.
3. Um cookie guarda um identificador opaco. Ele não contém a senha.
4. A resposta entrega apenas o perfil público da conta e o horário de expiração.
5. A interface usa essa resposta para mostrar o usuário e liberar as rotas privadas.
6. Depois de um refresh, `GET /api/session` recupera a sessão pela API.

O Router protege `/perfil` e `/favoritos`. A API também protege os recursos: esconder um botão não substitui a verificação da sessão.

**Limite da simulação:** os dados e as sessões ficam no navegador, pois este desafio não possui backend real. O cookie é criado pelo mock e não é HttpOnly. Isso não é uma arquitetura de autenticação para produção: um servidor real deve controlar a sessão, o cookie seguro e a proteção dos dados. Use apenas informações fictícias.

## 2. Por que não salvar a senha em texto?

`src/mocks/password.ts` deriva um hash com PBKDF2/SHA-256, salt aleatório por conta e 120.000 iterações. O banco simulado persiste o hash e o salt; nunca a senha digitada.

Ao entrar novamente, o mock deriva o hash usando o mesmo salt e compara os resultados. Ele não precisa recuperar a senha original. O teste verifica o login e também que a senha cadastrada não foi persistida em claro.

Os logs detalhados do MSW foram desativados para não registrar corpos de requisições de autenticação no console. Os campos de senha não são enviados ao perfil e a mutation de autenticação tem coleta imediata ao perder seus observadores.

## 3. Como separar os usuários no cache?

O TanStack Query usa uma chave para identificar os dados. Estas duas consultas são diferentes:

```ts
;['private', 'collector-ana', 'favorites'][('private', 'collector-bruno', 'favorites')]
```

O carrinho usa `['cart', userId]` ou `['cart', 'guest']`. No logout e na troca de usuário, cancelamos consultas antigas e removemos queries e mutations privadas do cache.

Também existe uma geração de sessão: um número local que muda a cada transição de conta. Uma resposta antiga não deve restaurar dados privados nem interpretar um erro 401 de uma sessão anterior como expiração da sessão nova.

Os testes entram com Ana, salvam favorito e carrinho, saem, entram com Bruno e verificam que os dados de Ana não aparecem. Depois retornam à conta de Ana e recuperam seus itens.

## 4. O que é atualização otimista?

É atualizar a interface antes de a API terminar, para reduzir a sensação de espera. No favorito:

1. O usuário clica no coração.
2. Guardamos o estado anterior daquele NFT.
3. Atualizamos o cache imediatamente.
4. Enviamos a operação pela API.
5. Se a API aceitar, mostramos uma confirmação e reconciliamos a consulta.
6. Se falhar, restauramos somente aquele NFT e mostramos a falha.

Restaurar somente o item afetado evita apagar mudanças feitas em outros favoritos enquanto havia uma requisição em andamento. O aviso global continua funcionando mesmo se a remoção otimista fizer o card sair da tela.

**Uma distinção para a apresentação:** coração preenchido é o estado otimista; a mensagem de confirmação é emitida depois da resposta da API. O teste verifica as duas coisas separadamente.

## 5. Como preservar o carrinho no login?

O visitante tem um identificador próprio. Ao entrar:

- A API encontra o carrinho já existente na conta.
- Combina seus itens com os do visitante por NFT e edição.
- Soma quantidades e respeita a disponibilidade atual.
- Informa quando precisou reduzir uma quantidade por limite de estoque.
- Esvazia apenas o carrinho do visitante que foi transferido.

O carrinho de uma conta não vira o carrinho de outra no logout. Se uma sessão expirar durante uma alteração, a API rejeita a alteração, preserva os itens anteriores e a aplicação pede login com retorno ao carrinho.

## 6. Quem calcula o total?

A API simulada. A página mostra a cotação devolvida pelo servidor; ela não inventa descontos nem confirma preços por conta própria.

Exemplo reproduzível:

| Operação                      | Valor      |
| ----------------------------- | ---------- |
| 2 × Emerald Ape a 1.19 ETH    | 2.38 ETH   |
| Cupom KURIO10 (10%)           | −0.238 ETH |
| Taxa de uma rede na simulação | 0.005 ETH  |
| Total                         | 2.147 ETH  |

Os cálculos usam BigInt em wei. Os valores trafegam como strings decimais. O desconto é truncado na menor unidade, e a taxa é 0.005 ETH por rede distinta presente no carrinho. Esta é uma regra fictícia documentada, não uma cobrança de blockchain.

A cotação também tem uma versão. A criação idempotente de pedidos e a reconfirmação de preço serão implementadas na etapa de pagamento; a versão, sozinha, ainda não representa uma compra.

## 7. Como validar formulários?

TypeScript verifica o código, mas uma requisição ainda pode conter dados inválidos. Usamos schemas Zod compartilhados pelo formulário e pelo handler para verificar os dados em execução.

Mesmo com validação no formulário, a API repete a validação. Ela também pode rejeitar um e-mail já usado ou uma senha atual incorreta. Os erros aparecem associados aos campos. O retorno após login aceita somente caminhos internos e evita ciclos de autenticação.

No perfil, imagens são restritas a PNG, JPEG ou WebP de até 250 KB. O avatar confirmado é persistido na simulação. Alterar a senha invalida as sessões da conta e pede novo login.

## 8. Como praticar sem depender dos testes automatizados?

1. Entre com `ana@kurio.test`, senha fictícia `KurioDemo2026!`.
2. Abra Emerald Ape, favorite e aguarde a confirmação.
3. Adicione duas unidades ao carrinho e aplique `KURIO10`.
4. Atualize a página: os dados devem permanecer.
5. Saia e entre com `bruno@kurio.test`, mesma senha fictícia: o carrinho e os favoritos devem estar vazios.
6. Para testar falha, abra `/setup`, escolha a falha de favorito e repita uma tentativa. O coração deve retornar ao estado anterior.
7. Volte ao cenário Padrão para recuperar o funcionamento. O reset em `/setup` apaga alterações da demonstração e restaura as fixtures.

## O que estudar nos arquivos

- `domain/account.ts`: contratos e schemas de validação.
- `api/account.ts` e `api/cart.ts`: requisições Axios.
- `mocks/account-handlers.ts` e `mocks/cart-handlers.ts`: regras e respostas HTTP.
- `mocks/database.ts`: persistência e fila de gravações por instância.
- `auth/guard.ts`: proteção de rotas.
- `auth/session-cache.ts`: transição entre contas e limpeza de dados.
- `hooks/use-favorites.ts`: atualização otimista, rollback e reconciliação.
- `hooks/use-cart.ts`: consultas e operações do carrinho.
- `tests/e2e/account-cart.spec.ts`: navegador exercitando os fluxos e as falhas.

Tente explicar primeiro: **quem decide o total, o que diferencia o carrinho visitante do autenticado e o que acontece se o favorito falhar?** Esses três pontos serão parte do nosso treino de apresentação.
