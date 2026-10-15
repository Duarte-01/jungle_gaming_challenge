import { expect, test, type Page } from '@playwright/test'

async function control(page: Page, path: string, body: unknown = {}) {
  return page.evaluate(
    async ({ path, body }) => {
      const response = await fetch(`/api/testing/${path}`, {
        method: path === 'scenario' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(`Controle ${path}: HTTP ${response.status}`)
      return response.json()
    },
    { path, body },
  )
}
async function login(page: Page, email = 'ana@kurio.test', redirect = '/nfts/emerald-ape-42') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}
async function prepare(page: Page, scenario = 'default', coupon = false, fromCatalog = false) {
  await login(page, 'ana@kurio.test', fromCatalog ? '/' : '/nfts/emerald-ape-42')
  if (fromCatalog) {
    await expect(page.locator('.nft-card')).toHaveCount(9)
    await page.locator('.nft-card').first().getByRole('link').first().click()
  }
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  if (coupon) {
    await page.goto('/carrinho')
    await page.getByLabel('Cupom de desconto').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar cupom' }).click()
    await expect(page.getByText('Cupom aplicado:', { exact: false })).toBeVisible()
  }
  await control(page, 'scenario', { scenario })
  if (fromCatalog) {
    await page
      .locator('.detail-feedback')
      .getByRole('link', { name: 'Ver carrinho', exact: true })
      .click()
    await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
    await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  } else await page.goto('/pagamento')
  await expect(page.getByLabel('Telefone do colecionador')).toBeAttached()
  if (!(await page.getByLabel('Telefone do colecionador').isVisible()))
    await page.getByText('Dados do colecionador', { exact: false }).first().click()
  await page.getByLabel('Telefone do colecionador').fill('+55 11 99999-1234')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByText('Carteira conectada à rede Ethereum.')).toBeVisible()
  await page.getByLabel('Revisei meus dados e os valores desta compra simulada.').check()
  await page.getByRole('button', { name: 'Revisar pedido', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
}
async function orders(page: Page) {
  return page.evaluate(async () => (await fetch('/api/orders')).json())
}

test('sessão expirada no checkout preserva dados e retoma a mesma tentativa após login', async ({
  page,
}) => {
  await prepare(page)
  await control(page, 'session/expire')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Telefone do colecionador')).toHaveValue('+55 11 99999-1234')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByText('Carteira conectada à rede Ethereum.')).toBeVisible()
  await page.getByRole('button', { name: 'Reenviar mesma tentativa' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  expect(await orders(page)).toHaveLength(1)
})

test('compra completa confirma apenas após a API e gera recibo e exploração simulada', async ({
  page,
}) => {
  await prepare(page, 'default', false, true)
  await expect(page.getByTestId('checkout-total')).toHaveText('1.195 ETH')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recibo da coleção' })).toBeVisible()
  await expect(page.getByTestId('checkout-total')).toHaveText('1.195 ETH')
  const id = await page.getByTestId('order-id').textContent()
  await page.reload()
  await expect(page.getByTestId('order-id')).toHaveText(id!)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  await page.getByRole('link', { name: 'Explorar transação simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Explorador simulado' })).toBeVisible()
  await expect(page.getByText('Estado: confirmado')).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('clique repetido, replay e conflito de conteúdo mantêm um único pedido', async ({ page }) => {
  await prepare(page)
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) => request.url().endsWith('/api/orders') && request.method() === 'POST',
    ),
    page.getByRole('button', { name: 'Confirmar compra simulada' }).dblclick({ delay: 20 }),
  ])
  const input = request.postDataJSON()
  const key = request.headers()['idempotency-key']
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const id = await page.getByTestId('order-id').textContent()
  const result = await page.evaluate(
    async ({ input, key }) => {
      const send = async (body: unknown) => {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
          body: JSON.stringify(body),
        })
        return { status: response.status, body: await response.json() }
      }
      return {
        replay: await send(input),
        conflict: await send({
          ...input,
          customer: { ...input.customer, phone: '+55 11 88888-0000' },
        }),
      }
    },
    { input, key },
  )
  expect(result.replay.status).toBe(200)
  expect(result.replay.body.id).toBe(id)
  expect(result.conflict.status).toBe(409)
  expect(result.conflict.body.code).toBe('IDEMPOTENCY_CONFLICT')
  expect(await orders(page)).toHaveLength(1)
})

test('timeout após criar pedido recupera a mesma compra', async ({ page }) => {
  await prepare(page, 'order-timeout')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const id = await page.getByTestId('order-id').textContent()
  expect(await orders(page)).toHaveLength(1)
  await page.reload()
  await expect(page.getByTestId('order-id')).toHaveText(id!)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
})

test('pagamento recusado preserva itens e uma nova revisão permite outra tentativa', async ({
  page,
}) => {
  await prepare(page, 'payment-declined')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recibo da coleção' })).toHaveCount(0)
  await control(page, 'scenario', { scenario: 'default' })
  await page.getByRole('button', { name: 'Revisar compra novamente' }).click()
  await page.getByRole('button', { name: 'Revisar pedido', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const all = await orders(page)
  expect(all).toHaveLength(2)
  expect(all.filter((order: { status: string }) => order.status === 'confirmed')).toHaveLength(1)
})

test('Socket.IO atualiza preço e impede confirmar cotação antiga', async ({ page }) => {
  await prepare(page)
  await expect(page.getByTestId('realtime-status')).toHaveText('connected')
  await control(page, 'nfts/emerald-ape-42', { priceEth: '2.19' })
  await expect(
    page.getByRole('alert').filter({ hasText: 'Preço, estoque, cupom ou taxas mudaram.' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
  await page.getByRole('button', { name: 'Revisar valores atualizados' }).click()
  await expect(page.getByTestId('checkout-total')).toHaveText('2.195 ETH')
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await control(page, 'events/replay', {
    type: 'nft.updated',
    resourceId: 'emerald-ape-42',
    copies: 2,
  })
  await control(page, 'events/replay', {
    type: 'nft.updated',
    resourceId: 'emerald-ape-42',
    version: 1,
    copies: 1,
  })
  await expect(page.getByTestId('checkout-total')).toHaveText('2.195 ETH')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
})

test('edição esgotada durante revisão mantém carrinho e bloqueia compra', async ({ page }) => {
  await prepare(page)
  await control(page, 'nfts/emerald-ape-42', { available: 0 })
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
  await page.getByRole('button', { name: 'Revisar valores atualizados' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Revise a disponibilidade dos itens.' }),
  ).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByRole('article', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Restam 0 unidades.' })).toBeVisible()
  expect(await orders(page)).toHaveLength(0)
})

test('cupom e taxa alterados exigem nova revisão e remoção do cupom expirado', async ({ page }) => {
  await prepare(page, 'default', true)
  await expect(page.getByTestId('checkout-total')).toHaveText('1.076 ETH')
  await control(page, 'pricing', { expireCoupon: true, networkFeeEth: '0.01' })
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
  await page.getByRole('button', { name: 'Revisar valores atualizados' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Este cupom expirou.' })).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByRole('alert').filter({ hasText: 'O cupom expirou.' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('1.2 ETH')
})

test('pedido pendente se recupera após desconexão e refresh, sem regredir estado terminal', async ({
  page,
}) => {
  await prepare(page, 'order-pending')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido em andamento' })).toBeVisible()
  const id = await page.getByTestId('order-id').textContent()
  await control(page, 'realtime/disconnect', { durationMs: 1500 })
  await expect(page.getByTestId('realtime-status')).toHaveText('disconnected')
  await control(page, `orders/${id}/settle`, { outcome: 'confirmed' })
  await expect(page.getByTestId('realtime-status')).toHaveText('connected')
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('order-id')).toHaveText(id!)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  await control(page, 'events/replay', { type: 'order.updated', resourceId: id, version: 1 })
  await control(page, `orders/${id}/settle`, { outcome: 'declined' })
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  expect(await orders(page)).toHaveLength(1)
})

test('recibo mantém snapshot e confirmação remove só quantidades compradas', async ({ page }) => {
  await prepare(page, 'order-pending')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido em andamento' })).toBeVisible()
  const id = await page.getByTestId('order-id').textContent()
  await page.goto('/nfts/sage-nomad-9')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await control(page, `orders/${id}/settle`, { outcome: 'confirmed' })
  await control(page, 'nfts/emerald-ape-42', { priceEth: '9.99' })
  await page.goto(`/pedidos/${id}`)
  await expect(page.getByTestId('checkout-total')).toHaveText('1.195 ETH')
  await page.goto('/carrinho')
  await expect(page.getByRole('article', { name: 'Sage Nomad #009' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Emerald Ape #042' })).toHaveCount(0)
  await expect(page.getByTestId('cart-subtotal')).toHaveText('1.69 ETH')
})

test('carteira recusa conexão, valida rede e desconecta sem permitir confirmar', async ({
  page,
}) => {
  await login(page)
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/pagamento')
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeAttached()
  await control(page, 'scenario', { scenario: 'wallet-rejected' })
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada' })).toBeVisible()
  await control(page, 'scenario', { scenario: 'default' })
  await page.getByRole('combobox', { name: 'Rede', exact: true }).selectOption('Solana')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Selecione a rede cadastrada' }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Rede', exact: true }).selectOption('Ethereum')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await expect(page.getByText('Carteira conectada à rede Ethereum.')).toBeVisible()
  await page.getByRole('button', { name: 'Desconectar carteira' }).click()
  await expect(page.getByRole('button', { name: 'Revisar pedido', exact: true })).toBeDisabled()
})

test('cadastro e edição de carteiras persistem e não permitem função duplicada', async ({
  page,
}) => {
  await login(page, 'ana@kurio.test', '/carteiras')
  await page.getByRole('button', { name: 'Editar Carteira principal', exact: true }).click()
  await page.getByLabel('Endereço da carteira').fill('invalido')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('O endereço não é válido para a rede escolhida.')).toBeVisible()
  await page.getByLabel('Endereço da carteira').fill(`0x${'d'.repeat(40)}`)
  await page.getByLabel('Nome da carteira').fill('Minha carteira pessoal')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Minha carteira pessoal' })).toBeVisible()
  await page.getByRole('button', { name: 'Editar Minha carteira pessoal' }).click()
  await page.getByRole('combobox', { name: 'Função' }).selectOption('secondary')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('alert')).toHaveText('Já existe uma carteira para esta função.')
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await login(page, 'bruno@kurio.test', '/carteiras')
  await page.getByRole('button', { name: 'Cadastrar carteira', exact: true }).click()
  await page.getByLabel('Nome da carteira').fill('Carteira reserva')
  await page.getByLabel('Endereço da carteira').fill(`0x${'e'.repeat(40)}`)
  await page.getByRole('combobox', { name: 'Função' }).selectOption('secondary')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Carteira reserva' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Minha carteira pessoal' })).toHaveCount(0)
})

test('outra conta não consulta recibo nem recebe o pedido anterior', async ({ page }) => {
  await prepare(page)
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const id = await page.getByTestId('order-id').textContent()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await login(page, 'bruno@kurio.test', `/pedidos/${id}`)
  await expect(page.getByRole('alert')).toContainText('Este pedido não pertence à sua conta.')
  await page.goto('/pedidos')
  await expect(page.getByText('Você ainda não tem pedidos.')).toBeVisible()
})
