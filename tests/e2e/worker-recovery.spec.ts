import { expect, test } from '@playwright/test'
import { returnToStaleTab, stopMockWorker } from '../helpers/worker-lifecycle.js'

test.beforeEach(async ({ context }) => {
  // Mirror static hosting: no backend exists if a request escapes MSW.
  await context.route('**/api/**', (route) => route.fulfill({ status: 404, body: 'NOT_FOUND' }))
})

test('visitante recupera a API após o navegador encerrar o service worker', async ({ page }) => {
  await page.goto('/?q=Emerald')
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await stopMockWorker(page)
  const response = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/session',
  )
  await returnToStaleTab(page)
  const session = await response
  expect(session.status()).toBe(200)
  expect(await session.json()).toMatchObject({ user: null, expiresAt: null })
  await expect(page.getByText('Não foi possível recuperar sua sessão.')).toHaveCount(0)
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await expect(page.locator('.session-notice[role="alert"]')).toHaveCount(0)
})

test('Tentar novamente recupera visitante e carrinho após falha e reinício do worker', async ({
  page,
}) => {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  await page.evaluate(() => localStorage.setItem('kurio:scenario', 'offline'))
  await returnToStaleTab(page)
  const notice = page.locator('.session-notice[role="alert"]')
  await expect(notice).toContainText('Não foi possível verificar seu acesso.')
  await stopMockWorker(page)
  await page.evaluate(() => localStorage.removeItem('kurio:scenario'))
  await notice.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(notice).toHaveCount(0)
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('2.385 ETH')
  await page.reload()
  await expect(page.getByTestId('cart-total')).toHaveText('2.385 ETH')
})

test('reinício do worker preserva conta e envia uma única alteração de perfil', async ({
  page,
}) => {
  await page.goto('/login?redirect=%2Fperfil')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Colecionadora')
  await stopMockWorker(page)
  await returnToStaleTab(page)
  await expect(page.locator('.session-notice[role="alert"]')).toHaveCount(0)
  let mutations = 0
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && new URL(request.url()).pathname === '/api/profile')
      mutations++
  })
  await stopMockWorker(page)
  await page.getByLabel('Nome', { exact: true }).fill('Ana Retomada')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  expect(mutations).toBe(1)
  await page.reload()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Retomada')
})

test('sessão realmente expirada continua exigindo login após reinício do worker', async ({
  page,
}) => {
  await page.goto('/login?redirect=%2Fperfil')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Colecionadora')
  expect(
    await page.evaluate(
      async () => (await fetch('/api/testing/session/expire', { method: 'POST' })).status,
    ),
  ).toBe(200)
  await stopMockWorker(page)
  await returnToStaleTab(page)
  await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Colecionadora')
})
