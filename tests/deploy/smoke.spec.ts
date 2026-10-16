import { expect, test } from '@playwright/test'

test('domínio serve REST, Socket.IO, assets e rota direta após refresh', async ({ page }) => {
  await page.goto('/setup')
  await expect(page.getByText('API simulada conectada', { exact: true })).toBeVisible()
  await expect(page.getByText('Evento recebido via Socket.IO', { exact: true })).toBeVisible()
  await page.goto('/nfts/emerald-ape-42')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  const artwork = page.locator('.gallery-main img')
  await expect(artwork).toBeVisible()
  await expect
    .poll(() =>
      artwork.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 250),
    )
    .toBe(true)
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('visitante mantém carrinho e pode cancelar autenticação após refresh', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/carrinho')
  await page.reload()
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Fechar e voltar ao mercado' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/carrinho')
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
})

test('compra pública revalida evento Socket.IO e preserva o recibo confirmado', async ({
  page,
}) => {
  await page.goto('/login?redirect=%2Fnfts%2Femerald-ape-42')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/pagamento')
  const phone = page.getByLabel('Telefone do colecionador')
  await expect(phone).toBeAttached()
  if (!(await phone.isVisible()))
    await page.locator('.collector-checkout-details > summary').click()
  await phone.fill('+55 11 99999-1234')
  await page.getByRole('button', { name: 'Conectar carteira simulada' }).click()
  await page.getByLabel('Revisei meus dados e os valores desta compra simulada.').check()
  await page.getByRole('button', { name: 'Revisar pedido', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeEnabled()
  await expect(page.getByTestId('realtime-status')).toHaveText('connected')
  const status = await page.evaluate(
    async () =>
      (
        await fetch('/api/testing/nfts/emerald-ape-42', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceEth: '2.19' }),
        })
      ).status,
  )
  expect(status).toBe(200)
  await expect(page.getByRole('button', { name: 'Confirmar compra simulada' })).toBeDisabled()
  await page.getByRole('button', { name: 'Revisar valores atualizados' }).click()
  await expect(page.getByTestId('checkout-total')).toHaveText('2.195 ETH')
  await page.getByRole('button', { name: 'Confirmar compra simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const orderId = await page.getByTestId('order-id').textContent()
  await page.reload()
  await expect(page.getByTestId('order-id')).toHaveText(orderId!)
  await expect(page.getByTestId('checkout-total')).toHaveText('2.195 ETH')
  await page.getByRole('link', { name: 'Explorar transação simulada' }).click()
  await expect(page.getByRole('heading', { name: 'Explorador simulado' })).toBeVisible()
})
