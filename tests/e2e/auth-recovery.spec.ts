import { expect, test } from '@playwright/test'

test('links de conta permitem cancelar login e cadastro preservando o catálogo', async ({
  page,
}, testInfo) => {
  await page.goto('/?q=Emerald')
  await expect(page.locator('.nft-card')).toHaveCount(4)
  const mobile = testInfo.project.name === 'mobile'
  const navigation = page.getByRole(mobile ? 'navigation' : 'contentinfo', {
    name: mobile ? 'Navegação mobile' : undefined,
  })
  const labels = mobile
    ? ['Meu perfil', 'Favoritos']
    : ['Meu perfil', 'Minha coleção', 'Atividade', 'Lista de interesse']
  for (const label of labels) {
    await navigation.getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page
      .getByRole('link', { name: mobile ? 'Crie uma conta' : 'Criar conta', exact: true })
      .click()
    await expect(page.getByLabel('Confirmar senha', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Fechar e voltar ao mercado' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(
      (url) => url.pathname === '/' && url.searchParams.get('q') === 'Emerald',
    )
    await expect(page.locator('.nft-card')).toHaveCount(4)
  }
})

test('acesso direto às rotas privadas permite sair da autenticação com X e Escape', async ({
  page,
}) => {
  for (const path of [
    '/perfil',
    '/pedidos',
    '/favoritos',
    '/carteiras',
    '/pedidos/exemplo',
    '/explorador/exemplo',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Fechar e voltar ao mercado' }).click()
    await expect(page).toHaveURL((url) => url.pathname === '/')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await page.goto('/cadastro?redirect=%2Fperfil')
  await expect(page.getByLabel('Confirmar senha', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL((url) => url.pathname === '/')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('cancelar Conectar e finalizar mantém o carrinho e funciona após refresh do login', async ({
  page,
}) => {
  await page.goto('/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page
    .getByRole('status')
    .filter({ hasText: 'NFT adicionado ao carrinho.' })
    .getByRole('link', { name: 'Ver carrinho', exact: true })
    .click()
  for (const refresh of [false, true]) {
    await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
    if (refresh) await page.reload()
    await page.getByRole('button', { name: 'Fechar e voltar ao mercado' }).click()
    await expect(page).toHaveURL((url) => url.pathname === '/carrinho')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  }
})

test('Tentar novamente recupera um módulo de página que falhou ao baixar', async ({
  page,
  context,
}) => {
  let interrupted = true
  let blocked = 0
  await context.route(
    (url) => /\/assets\/auth-[^/]+\.js$|\/src\/pages\/auth\.tsx$/.test(url.pathname),
    async (route) => {
      if (interrupted) {
        blocked += 1
        await route.abort('internetdisconnected')
      } else await route.continue()
    },
  )
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  if (page.viewportSize()!.width < 768)
    await page
      .getByRole('navigation', { name: 'Navegação mobile' })
      .getByRole('link', { name: 'Meu perfil', exact: true })
      .click()
  else await page.getByRole('link', { name: 'Entrar', exact: true }).first().click()
  await expect(
    page.getByRole('heading', { name: 'Não foi possível abrir esta página' }),
  ).toBeVisible()
  expect(blocked).toBeGreaterThan(0)
  interrupted = false
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Fechar e voltar ao mercado' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('falha de sessão ao voltar à aba e erro da rota permitem recuperação', async ({ page }) => {
  await page.goto('/login?redirect=%2Fperfil')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo2026!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Nome', { exact: true })).toBeVisible()
  // Make the cached session stale as it would be after leaving the tab for a while.
  await page.clock.install()
  await page.clock.fastForward(31_000)
  await page.evaluate(() => localStorage.setItem('kurio:scenario', 'offline'))
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    window.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    window.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível recuperar sua sessão.' }),
  ).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:scenario'))
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByText('Não foi possível recuperar sua sessão.')).toHaveCount(0)
  await expect(page.getByLabel('Nome', { exact: true })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('kurio:scenario', 'offline'))
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Não foi possível abrir esta página' }),
  ).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByLabel('Nome', { exact: true })).toBeVisible()
})
