# Roteiro para o treino final

O treino será feito depois de concluir e validar a entrega. Este arquivo guarda os assuntos que você precisa entender, sem apresentar recursos pendentes como prontos.

## Demonstração sugerida

1. Apresentar o problema: descoberta e compra simulada de NFTs em desktop e mobile.
2. Explicar a organização: páginas, contratos, Axios, Query e MSW.
3. Buscar e combinar filtros; demonstrar URL, refresh e histórico.
4. Entrar, favoritar, mostrar uma falha e o rollback.
5. Adicionar ao carrinho, aplicar cupom e explicar a precisão dos valores.
6. Demonstrar compra, timeout recuperado pela mesma chave, recibo e reconciliação em tempo real. Usar os exercícios da etapa 4.
7. Mostrar testes, regressão visual, Lighthouse e deploy — **evidências finais ainda pendentes**.
8. Encerrar com decisões, limitações e o que faria numa aplicação de produção.

## Perguntas que vamos praticar

- Por que separar os dados da interface dos handlers de mocks?
- O que TanStack Router e TanStack Query resolvem de diferente?
- Como evitar que uma resposta antiga substitua a busca atual?
- Como os dados de Ana ficam separados dos dados de Bruno?
- O que é uma atualização otimista e como funciona o rollback?
- Por que usar strings e BigInt para ETH?
- Como preservar o carrinho do visitante ao entrar?
- Como evitar pedidos duplicados mesmo quando a resposta não chega?
- Por que usar o mesmo payload ao reenviar a mesma chave?
- Como conciliar eventos Socket.IO com a API após reconexão?
- Por que o recibo usa uma cópia dos dados da compra?
- Quais limitações do mock impedem usá-lo como autenticação de produção?

Vamos ensaiar respostas com suas palavras e depois fazer uma entrevista simulada com perguntas de acompanhamento. Não é necessário decorar o código; é necessário saber localizar as responsabilidades e explicar o comportamento observado.
