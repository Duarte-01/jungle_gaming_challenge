import { expect, test, type Page } from '@playwright/test'

async function stable(page: Page) {
  await expect(page.getByTestId('realtime-status')).toHaveText('connected')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [...document.images].map((image) => {
        image.loading = 'eager'
        return image.decode()
      }),
    )
  })
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
}

async function cart(page: Page, signedIn = false) {
  if (signedIn) {
    await page.goto('/login?redirect=%2Fnfts%2Femerald-ape-42')
    await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
    await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  } else await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-15T12:00:00.000Z'))
})

test('visual: início', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await stable(page)
  await expect(page).toHaveScreenshot('inicio.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })
})
test('visual: detalhe', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  await expect(page.locator('.related-grid article')).toHaveCount(5)
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeEnabled()
  await stable(page)
  await expect(page).toHaveScreenshot('detalhe.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })
})
test('visual: carrinho', async ({ page }) => {
  await cart(page)
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  await expect(page.locator('.related-grid article')).toHaveCount(5)
  await stable(page)
  await expect(page).toHaveScreenshot('carrinho.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })
})
test('visual: pagamento revisado', async ({ page }) => {
  await cart(page, true)
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
  await stable(page)
  await expect(page).toHaveScreenshot('pagamento.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })
})
