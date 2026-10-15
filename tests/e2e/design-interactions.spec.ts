import { expect, test, type Page } from '@playwright/test'

async function login(page: Page, redirect = '/perfil') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

test('galeria amplia a imagem, devolve foco e alterna as informações', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  const trigger = page.getByRole('button', { name: 'Ver arte em tamanho ampliado' })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await page.getByRole('tab', { name: /Avaliações de colecionadores/ }).click()
  await expect(page.getByRole('tabpanel')).toContainText('4.8 de 5')
  await page.getByRole('tab', { name: /Avaliações de colecionadores/ }).press('ArrowLeft')
  await expect(page.getByRole('tab', { name: 'Detalhes do NFT', exact: true })).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('direitos autorais')
})

test('detalhe lento mantém o conteúdo no lugar ao substituir o skeleton', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kurio:scenario', 'slow'))
  await page.goto('/nfts/emerald-ape-42')
  await expect(page.getByLabel('Carregando NFT')).toBeVisible()
  const before = await page.getByRole('main').boundingBox()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const after = await page.getByRole('main').boundingBox()
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
})

test('novos campos do perfil validam e persistem pela API', async ({ page }) => {
  await login(page)
  await page.getByLabel('Nome de usuário', { exact: true }).fill('nome inválido')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByLabel('Nome de usuário', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await page.getByLabel('Nome de usuário', { exact: true }).fill('ana.digital')
  await page.getByLabel('Nome ENS', { exact: true }).fill('ana-digital')
  await page.getByLabel('Apelido da carteira', { exact: true }).fill('Reserva pessoal')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome de usuário', { exact: true })).toHaveValue('ana.digital')
  await expect(page.getByLabel('Nome ENS', { exact: true })).toHaveValue('ana-digital')
  await expect(page.getByLabel('Apelido da carteira', { exact: true })).toHaveValue(
    'Reserva pessoal',
  )
  await page.getByLabel('Senha atual', { exact: true }).fill('KurioDemo2026!')
  await page.getByLabel('Nova senha', { exact: true }).fill('OutraSenha2026!')
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Diferente2026!')
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()
  await expect(page.getByText('As senhas devem ser iguais.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/perfil/)
})

test('troca de provedor exige reconexão e nova revisão, preservando dados no pedido', async ({
  page,
}) => {
  await login(page, '/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/pagamento')
  const phone = page.getByLabel('Telefone do colecionador')
  await expect(phone).toBeAttached()
  if (!(await phone.isVisible()))
    await page.locator('.collector-checkout-details > summary').click()
  await phone.fill('+55 11 99999-1234')
  await page.getByLabel('Nome de usuário', { exact: true }).fill('ana.coleciona')
  await page.getByLabel('Nome ENS', { exact: true }).fill('ana-coleciona')
  await page.getByLabel('Observação do colecionador (opcional)').fill('Minha primeira coleção')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await page.getByLabel('Revisei meus dados e os valores desta compra simulada.').check()
  await page.getByRole('button', { name: 'Revisar pedido', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await page.getByRole('radio', { name: 'Coinbase Wallet', exact: true }).check()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await page.getByRole('button', { name: 'Revisar pedido', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const orders = await page.evaluate(async () => (await fetch('/api/orders')).json())
  expect(orders).toHaveLength(1)
  expect(orders[0].snapshot.customer.username).toBe('ana.coleciona')
  expect(orders[0].snapshot.customer.ens).toBe('ana-coleciona')
  expect(orders[0].snapshot.customer.note).toBe('Minha primeira coleção')
  expect(orders[0].snapshot.wallet.provider).toBe('Coinbase Wallet')
})

test('autenticação mantém foco, permite mostrar senha e explica ações auxiliares', async ({
  page,
}) => {
  await page.goto('/login')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'não faz parte da simulação' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Esqueceu a senha?' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'recuperação por e-mail' })).toBeVisible()
  await page.getByLabel('E-mail', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Senha', { exact: true })).toBeFocused()
})

test('conta, carteiras e pedidos adaptam conteúdo sem overflow', async ({ page }) => {
  await login(page)
  for (const path of ['/perfil', '/carteiras', '/pedidos']) {
    await page.goto(path)
    await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
})
