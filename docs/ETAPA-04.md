# Etapa 4 — carteiras, compra e tempo real

Nesta etapa, o carrinho passa a gerar pedidos pela API simulada. Também incorporamos os quatro PNGs originais recebidos no ZIP. A compra é fictícia: não há dinheiro, assinatura real de carteira nem blockchain.

## Primeiro: por que Ana já consegue entrar?

Ana e Bruno são contas previamente cadastradas nas fixtures, isto é, dados iniciais da demonstração. Isso permite que quem avalia teste duas identidades sem preencher cadastros primeiro. Não existe login automático de qualquer e-mail: uma conta desconhecida precisa passar por `/cadastro`.

O cadastro valida nome, e-mail, senha e confirmação, envia `POST /api/auth/register`, cria o usuário no banco da simulação e inicia sua sessão. Assim, o caminho de quem acabou de se cadastrar e o caminho de quem usa uma conta de demonstração chegam ao mesmo sistema de sessão. Usamos somente dados fictícios.

## Faça sua primeira compra passo a passo

1. Atualize sua cópia do código na branch `feat/marketplace-base`. Se a cópia foi baixada como ZIP, baixe a branch atualizada; os arquivos do seu computador não se atualizam sozinhos.
2. No terminal da pasta do projeto, execute `npm ci` e `npm run dev:mocks`. Abra o endereço informado pelo Vite no seu próprio computador.
3. Entre como `ana@kurio.test`, senha fictícia `KurioDemo2026!`, ou cadastre sua própria conta fictícia.
4. Abra Emerald Ape, escolha uma edição disponível e clique em **Adicionar ao carrinho**. No carrinho, teste o cupom `KURIO10` e confira subtotal, desconto, taxa e total.
5. Abra **Gerenciar carteiras** no pagamento ou vá a `/carteiras`. Contas novas precisam cadastrar uma carteira. Nome: `Minha carteira`; rede: Ethereum; função: Principal; endereço fictício: `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.
6. Se você já tinha dados da etapa 3, eles foram preservados; cadastre a carteira caso a lista esteja vazia. Não é necessário apagar sua conta nem usar o reset para continuar.
7. Volte ao pagamento, preencha um telefone fictício como `+55 11 99999-1234`, escolha carteira e rede compatíveis e clique em **Conectar carteira simulada**.
8. Marque que revisou os dados e clique em **Revisar pedido**. Esse botão consulta novamente a API. Leia os valores antes de clicar em **Confirmar compra simulada**.
9. Aguarde o pedido. Ele começa pendente e só exibe **Pedido confirmado** e recibo quando a API confirma. Recarregue a página: o pedido e seus valores continuam disponíveis.
10. Abra **Explorar transação simulada** e depois **Meus pedidos**. Volte ao carrinho para conferir a retirada dos itens comprados.

Carteiras são privadas por conta, com no máximo uma Principal e uma Secundária. A rede da conexão deve corresponder à rede da carteira. Endereços Ethereum/Polygon aceitam `0x` e 40 caracteres hexadecimais; Solana usa o formato base58 definido pelo schema. Essa validação de formato não verifica existência de carteira na rede. Editar a carteira invalida sua conexão anterior.

## O que acontece quando você confirma?

`pages/checkout.tsx` reúne os dados. `api/checkout.ts` envia a requisição com Axios. `mocks/order-handlers.ts` representa o servidor e verifica sessão, carteira conectada, rede, estoque, cupom e versão da cotação. O componente não determina sozinho o sucesso.

A cotação é o orçamento atual da compra. Seu identificador combina versão das regras de preço, revisão do carrinho, versão dos NFTs e quantidades. Se algo mudou desde a revisão, o servidor recusa a versão antiga. O usuário precisa ver o novo resumo e confirmar novamente; nenhuma compra aceita silenciosamente um preço novo.

Os valores viajam como strings ETH. Os cálculos usam BigInt em wei, a menor unidade representada no projeto. Isso evita arredondamentos típicos de números com ponto flutuante. A taxa inicial fictícia é 0.005 ETH por rede distinta dos itens; o pagamento permanece uma simulação, inclusive quando há itens de várias redes.

## Como evitamos duas compras acidentais?

**Idempotência** significa que repetir a mesma operação identificada produz o mesmo resultado. Antes do primeiro envio, salvamos uma chave UUID e os dados completos da tentativa, separados por usuário. O servidor associa usuário + chave ao pedido. Mesma chave e mesmos dados devolvem o pedido existente; mesma chave com outros dados retorna conflito 409.

O bloqueio do botão e uma trava de clique ajudam na interface, mas a proteção principal está na API. Ela continua funcionando quando há timeout, refresh ou reenvio. Existe no máximo um pedido pendente por usuário. Uma tentativa sem resposta permanece salva e é consultada antes de permitir o reenvio do mesmo conteúdo. Ela não é descartada por logout, pois pode precisar ser recuperada quando o titular entrar novamente.

No cenário didático de timeout, a API salva o pedido e demora 1.500 ms para responder; o cliente espera 700 ms na criação. Assim reproduzimos uma resposta perdida sem impedir que a compra exista. Esses tempos curtos servem à demonstração; não são recomendação para um gateway de produção.

## Pedido, estoque e recibo

O pedido percorre `pending → confirmed` ou `pending → declined`. Um estado terminal não volta a pendente nem troca para o outro resultado. O estoque fica reservado na criação. Confirmação mantém a reserva consumida; recusa devolve as unidades disponíveis.

O pedido guarda um **snapshot**, uma cópia dos itens, preço, desconto, taxa, total, cliente e carteira naquele momento. O recibo usa essa cópia. Mudar o preço do catálogo depois não reescreve uma compra anterior. Só pedidos confirmados têm recibo e referência de transação fictícia.

Ao confirmar, subtraímos do carrinho atual apenas as quantidades compradas. Se você adicionar outro NFT enquanto o pedido está pendente, esse item permanece. Em caso de recusa, o carrinho é preservado e uma nova revisão permite outra tentativa.

## O que o Socket.IO faz aqui?

REST responde a consultas e comandos. Socket.IO avisa que um recurso mudou: `nft.updated`, `quote.updated` e `order.updated`. Cada aviso carrega ID e versão. Eventos repetidos ou antigos são descartados; um aviso aceito faz o TanStack Query consultar novamente a API.

Se a conexão cair, podemos perder avisos. Ao reconectar, revalidamos os recursos ativos pela API. Pedidos pendentes também são consultados periodicamente. O estado persistido é a fonte de recuperação após refresh; não dependemos apenas do último evento recebido.

Os eventos privados dependem do cookie da conexão e do usuário inscrito. Logout remove listeners e desconecta o cliente. A geração da sessão impede que uma resposta atrasada da conta anterior altere a interface da conta atual.

## Exercícios para entender as falhas

Use `/setup`. Os controles enviam requisições REST para o mock, que publica os eventos pelo Socket.IO real da simulação.

| Exercício                                        | O que observar                                           |
| ------------------------------------------------ | -------------------------------------------------------- |
| Selecione pagamento recusado e compre            | O carrinho continua; não aparece recibo de sucesso       |
| Selecione timeout após criar pedido              | A tentativa recupera o mesmo pedido, sem duplicar        |
| Selecione pedido pendente                        | Atualize a página; o pedido continua pendente            |
| Interrompa o socket e conclua o pedido no painel | A reconexão reconcilia a compra pela API                 |
| Altere o preço de um NFT do carrinho             | Nova revisão e confirmação são obrigatórias              |
| Zere o estoque da edição                         | A compra fica bloqueada e o item permanece para correção |
| Expire o cupom ou altere a taxa                  | O resumo precisa ser revisto                             |
| Entre como Bruno e abra o pedido da Ana          | A API nega acesso                                        |

Volte ao cenário Padrão para compras normais. O cenário não desfaz uma alteração já persistida no mercado. O botão de restauração apaga os dados locais de demonstração e deve ser usado somente quando você quiser começar de novo.

## Onde acompanhar no código

| Arquivo                        | Responsabilidade                                 |
| ------------------------------ | ------------------------------------------------ |
| `domain/checkout.ts`           | Tipos e validação de carteiras, compra e eventos |
| `mocks/wallet-handlers.ts`     | Carteiras por usuário e conexão simulada         |
| `lib/checkout-storage.ts`      | Rascunho e tentativa por usuário                 |
| `mocks/order-handlers.ts`      | Criação, idempotência e acesso aos pedidos       |
| `mocks/order-state.ts`         | Reserva, resolução e atualização do carrinho     |
| `pages/orders.tsx`             | Pedido, recibo, lista e explorador fictício      |
| `mocks/socket-handler.ts`      | Protocolo Socket.IO e autorização dos eventos    |
| `realtime/market-realtime.tsx` | Duplicatas, versões, invalidação e reconexão     |
| `tests/e2e/checkout.spec.ts`   | Comportamentos de compra observados no navegador |

O banco é local ao navegador e à origem, com fila por instância. Ele não oferece um servidor compartilhado entre máquinas ou transações entre abas. Autenticação, carteiras e pagamentos são demonstrações conforme o escopo frontend. Para produção, essas responsabilidades exigiriam um backend e um provedor adequados.

A validação executada fica em `VALIDACAO.md`. Ainda faltam composição dos demais frames, baselines visuais, Lighthouse, deploy e ensaio final. Uma suíte funcional verde não comprova fidelidade visual nem publicação.
