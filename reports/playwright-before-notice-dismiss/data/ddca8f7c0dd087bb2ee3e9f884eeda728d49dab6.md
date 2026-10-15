# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account-cart.spec.ts >> favorito otimista faz rollback na falha e persiste no sucesso
- Location: tests/e2e/account-cart.spec.ts:199:1

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - status [ref=e3]:
    - text: Não foi possível atualizar o favorito. Tente novamente.
    - button "Fechar aviso" [ref=e4] [cursor=pointer]: ×
  - status [ref=e5]: connected
  - generic [ref=e6]:
    - generic [ref=e7]:
      - link "Voltar ao mercado" [ref=e8] [cursor=pointer]:
        - /url: /?q=&category=&network=&min=%220%22&max=%22100%22&sort=recent&tab=all&page=1
      - button "Sair da conta" [ref=e13] [cursor=pointer]
    - main [ref=e17]:
      - generic [ref=e18]:
        - region "Galeria do NFT" [ref=e19]:
          - button "Ver arte em tamanho ampliado" [ref=e21] [cursor=pointer]:
            - 'img "Emerald Ape #042" [ref=e23]'
        - generic [ref=e24]:
          - generic [ref=e25]:
            - 'heading "Emerald Ape #042" [level=1] [ref=e26]'
            - generic [ref=e27]:
              - text: "4.8"
              - generic [ref=e30]: (19)
          - paragraph [ref=e31]: Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.
          - group "Edição:" [ref=e32]:
            - button "Edição original · 5 disponíveis" [pressed] [ref=e34] [cursor=pointer]: 1/50
            - button "Edição única · 1 disponíveis" [ref=e35] [cursor=pointer]: 1/1
            - button "Edição aberta · 10 disponíveis" [ref=e36] [cursor=pointer]: ABERTA
            - button "Edição limitada · Esgotada" [disabled] [ref=e37]: 1/10
          - generic [ref=e38]:
            - generic [ref=e39]:
              - generic [ref=e40]: Qtd.
              - button "Diminuir quantidade" [disabled] [ref=e41]
              - generic [ref=e43]: Quantidade
              - spinbutton "Quantidade" [ref=e44]: "1"
              - button "Aumentar quantidade" [ref=e45] [cursor=pointer]
            - generic [ref=e47]: 1.19 ETH
            - button "Adicionar ao carrinho" [ref=e48] [cursor=pointer]: Comprar NFT
            - 'button "Favoritar Emerald Ape #042" [ref=e51] [cursor=pointer]'
            - link "Ver carrinho" [ref=e54] [cursor=pointer]:
              - /url: /carrinho
          - generic [ref=e60]:
            - generic [ref=e61]:
              - term [ref=e62]: "ID do token:"
              - definition [ref=e63]: "#042"
            - generic [ref=e64]:
              - term [ref=e65]: "Coleção:"
              - definition [ref=e66]: Kurio Apes
            - generic [ref=e67]:
              - term [ref=e68]: "Atributos:"
              - definition [ref=e69]: Óculos, Esmeralda, Raro
          - paragraph [ref=e70]: Criado por Kurio Studio · Ethereum
      - generic [ref=e71]:
        - tablist "Informações do NFT" [ref=e72]:
          - tab "Detalhes do NFT" [selected] [ref=e73] [cursor=pointer]
          - tab "Avaliações de colecionadores (19)" [ref=e74] [cursor=pointer]
        - tabpanel "Detalhes do NFT" [ref=e75]:
          - paragraph [ref=e76]: Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores. Cada atributo faz parte dos metadados desta coleção de demonstração.
          - paragraph [ref=e77]: Explore identidade, movimento e luz em uma coleção de arte digital. Nesta demonstração, a compra e a propriedade são simuladas.
          - generic [ref=e78]:
            - term [ref=e79]: "Rede:"
            - definition [ref=e80]: Ethereum
            - term [ref=e81]: "Contrato:"
            - definition [ref=e82]: Referência simulada da coleção Kurio Apes.
            - term [ref=e83]: "Direitos autorais:"
            - definition [ref=e84]: A aquisição de um token não transfere automaticamente os direitos autorais da obra.
      - region "Mais desta coleção" [ref=e85]:
        - heading "Mais desta coleção" [level=2] [ref=e86]
        - generic [ref=e87]:
          - article [ref=e88]:
            - link [ref=e89] [cursor=pointer]:
              - /url: /nfts/cosmic-bloom-118
              - 'img "Cosmic Bloom #118" [ref=e91]'
              - 'heading "Cosmic Bloom #118" [level=3] [ref=e92]'
              - paragraph [ref=e93]: 1.29 ETH
          - article [ref=e94]:
            - link [ref=e95] [cursor=pointer]:
              - /url: /nfts/violet-nomad-314
              - 'img "Violet Nomad #314" [ref=e97]'
              - 'heading "Violet Nomad #314" [level=3] [ref=e98]'
              - paragraph [ref=e99]: 1.39 ETH
        - generic "Mais itens da coleção" [ref=e100]:
          - button "Grupo 1 da coleção" [pressed] [ref=e101] [cursor=pointer]
          - button "Grupo 2 da coleção" [ref=e102] [cursor=pointer]
          - button "Grupo 3 da coleção" [ref=e103] [cursor=pointer]
    - contentinfo [ref=e104]:
      - generic [ref=e105]:
        - link "KURIO" [ref=e106] [cursor=pointer]:
          - /url: /?q=&category=&network=&min=%220%22&max=%22100%22&sort=recent&tab=all&page=1
        - paragraph [ref=e107]: Feito para colecionadores,criadores e cultura
      - paragraph [ref=e108]: © 2026 Kurio. Propriedade digital para todos.
```