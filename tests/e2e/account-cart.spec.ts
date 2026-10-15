import { expect, test, type Page } from '@playwright/test'

const password = 'KurioDemo2026!'

async function loginAs(
  page: Page,
  email = 'ana@kurio.test',
  redirect = '/perfil',
  secret = password,
) {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(secret)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}

async function scenario(page: Page, value: string) {
  const status = await page.evaluate(async (selected) => {
    const response = await fetch('/api/testing/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: selected }),
    })
    return response.status
  }, value)
  expect(status).toBe(200)
}

async function addNft(page: Page, id = 'emerald-ape-42', quantity = '1') {
  await page.goto(`/nfts/${id}`)
  await page.getByRole('spinbutton', { name: 'Quantidade', exact: true }).fill(quantity)
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
}

test('login combina carrinho existente e visitante e informa ajuste de estoque', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await loginAs(page, 'ana@kurio.test', '/nfts/emerald-ape-42')
  await page.getByRole('spinbutton', { name: 'Quantidade', exact: true }).fill('3')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/')
  await addNft(page, 'emerald-ape-42', '3')
  await addNft(page, 'sage-nomad-9')
  await loginAs(page, 'ana@kurio.test', '/carrinho')
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' }),
  ).toHaveValue('5')
  await expect(page.getByRole('spinbutton', { name: 'Quantidade de Sage Nomad #009' })).toHaveValue(
    '1',
  )
  await expect(page.getByTestId('cart-subtotal')).toHaveText('7.64 ETH')
  await expect(page.getByRole('status').filter({ hasText: 'foi ajustada para 5' })).toBeVisible()
})

test('expiração durante alteração do carrinho preserva itens para retomar', async ({ page }) => {
  await loginAs(page, 'ana@kurio.test', '/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-subtotal')).toHaveText('1.19 ETH')
  await page.evaluate(async () => {
    await fetch('/api/testing/session/expire', { method: 'POST' })
  })
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcarrinho/)
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByTestId('cart-subtotal')).toHaveText('1.19 ETH')
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' }),
  ).toHaveValue('1')
})

test('API privada nega visitante e reset restaura dados completos da etapa', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/setup')
  await expect(page.getByText('API simulada conectada')).toBeVisible()
  const statuses = await page.evaluate(async () =>
    Promise.all(
      ['/api/profile', '/api/favorites', '/api/quotes'].map(
        async (url) =>
          (await fetch(url, { method: url === '/api/quotes' ? 'POST' : 'GET' })).status,
      ),
    ),
  )
  expect(statuses).toEqual([401, 401, 401])
  await loginAs(page)
  await page.getByLabel('Nome', { exact: true }).fill('Nome alterado')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  await addNft(page)
  await page.goto('/setup')
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('button', { name: 'Restaurar dados de demonstração' }).click(),
  ])
  await expect(page.getByText('API simulada conectada')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Condição de rede ou falha' })).toHaveValue(
    'default',
  )
  await loginAs(page)
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Colecionadora')
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cadastro valida campos, cria sessão e não persiste a senha em claro', async ({ page }) => {
  await page.goto('/cadastro?redirect=/perfil')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Nome', { exact: true }).fill('Clara Digital')
  await page.getByLabel('E-mail', { exact: true }).fill('clara@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('MinhaSenha2026!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Diferente2026!')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('As senhas devem ser iguais.')).toBeVisible()
  await page.getByLabel('Confirmar senha', { exact: true }).fill('MinhaSenha2026!')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Clara Digital')
  expect(
    await page.evaluate(() => localStorage.getItem('kurio:db:v1')?.includes('MinhaSenha2026!')),
  ).toBe(false)
})

test('conflito de cadastro e credenciais inválidas têm feedback da API', async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByLabel('Nome', { exact: true }).fill('Outra Ana')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('alert')).toHaveText('Este e-mail já está cadastrado.')
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaIncorreta2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.')
  await expect(page).toHaveURL(/\/login/)
})

test('visitante mantém carrinho após refresh e no login', async ({ page }) => {
  await addNft(page, 'emerald-ape-42', '2')
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-subtotal')).toHaveText('2.38 ETH')
  await page.reload()
  await expect(
    page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' }),
  ).toHaveValue('2')
  await page.getByRole('link', { name: 'Entre para continuar com sua coleção' }).click()
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.getByTestId('cart-total')).toHaveText('2.385 ETH')
  await page.reload()
  await expect(page.getByTestId('cart-total')).toHaveText('2.385 ETH')
})

test('carrinho calcula cupom, respeita quantidade e permite remoção', async ({ page }) => {
  await addNft(page, 'emerald-ape-42', '2')
  await page.goto('/carrinho')
  const code = page.getByLabel('Cupom de desconto')
  await code.fill('BAD')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByRole('alert')).toHaveText('Cupom inválido.')
  await code.fill('EXPIRED')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByRole('alert')).toHaveText('Este cupom expirou.')
  await code.fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByTestId('cart-discount')).toHaveText('−0.238 ETH')
  await expect(page.getByTestId('cart-total')).toHaveText('2.147 ETH')
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(page.getByTestId('cart-subtotal')).toHaveText('3.57 ETH')
  await expect(page.getByTestId('cart-total')).toHaveText('3.218 ETH')
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('3.575 ETH')
  await page.getByRole('spinbutton', { name: 'Quantidade de Emerald Ape #042' }).fill('5')
  await page.getByRole('button', { name: 'Atualizar quantidade de Emerald Ape #042' }).click()
  await expect(page.getByTestId('cart-subtotal')).toHaveText('5.95 ETH')
  await expect(
    page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Remover Emerald Ape #042', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('favorito otimista faz rollback na falha e persiste no sucesso', async ({ page }) => {
  await loginAs(page, 'ana@kurio.test', '/nfts/emerald-ape-42')
  const favorite = page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })
  await expect(favorite).toBeEnabled()
  await scenario(page, 'favorite-error')
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('status').filter({ hasText: 'Não foi possível atualizar o favorito.' }),
  ).toBeVisible()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await scenario(page, 'default')
  await favorite.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'NFT adicionado aos favoritos.' }),
  ).toBeVisible()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/favoritos')
  await expect(page.locator('.nft-card')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.nft-card')).toHaveCount(1)
  await scenario(page, 'favorite-error')
  await page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Não foi possível atualizar o favorito.' }),
  ).toBeVisible()
  await expect(page.locator('.nft-card')).toHaveCount(1)
})

test('logout e troca de usuário isolam favoritos e carrinhos', async ({ page }) => {
  test.setTimeout(60_000)
  await loginAs(page, 'ana@kurio.test', '/nfts/emerald-ape-42')
  await page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'NFT adicionado aos favoritos.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/')
  await loginAs(page, 'bruno@kurio.test', '/favoritos')
  await expect(page.getByRole('heading', { name: 'Você ainda não tem favoritos' })).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/')
  await loginAs(page, 'ana@kurio.test', '/favoritos')
  await expect(page.locator('.nft-card')).toHaveCount(1)
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
})

test('sessão expirada protege rota e permite retomar após login', async ({ page }) => {
  await page.goto('/favoritos')
  await expect(page).toHaveURL(/\/login\?redirect=%2Ffavoritos/)
  await loginAs(page)
  const status = await page.evaluate(
    async () => (await fetch('/api/testing/session/expire', { method: 'POST' })).status,
  )
  expect(status).toBe(200)
  await page.goto('/favoritos')
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('E-mail', { exact: true }).fill('ana@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Meus favoritos' })).toBeVisible()
})

test('falha no carrinho preserva itens e permite nova tentativa', async ({ page }) => {
  await addNft(page)
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  await scenario(page, 'cart-error')
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Não foi possível atualizar o carrinho. Tente novamente.',
  )
  await expect(page.getByTestId('cart-total')).toHaveText('1.195 ETH')
  await scenario(page, 'default')
  await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()
  await expect(page.getByTestId('cart-total')).toHaveText('2.385 ETH')
})

test('perfil, avatar e senha persistem e tratam validação da API', async ({ page }) => {
  test.setTimeout(60_000)
  await loginAs(page)
  await page.getByLabel('Nome', { exact: true }).fill('Ana Digital')
  await page.getByLabel('Telefone', { exact: true }).fill('+55 11 99999-1234')
  await page.getByLabel('Avatar', { exact: true }).setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yBKcAAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toHaveJSProperty(
    'naturalWidth',
    1,
  )
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Digital')
  await expect(page.getByRole('img', { name: 'Avatar de Ana Digital' })).toBeVisible()
  await page.getByLabel('E-mail', { exact: true }).fill('bruno@kurio.test')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByRole('alert')).toHaveText('Este e-mail já está cadastrado.')
  await page.getByLabel('Senha atual', { exact: true }).fill('Errada2026!')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha2026!')
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Senha atual incorreta.' })).toBeVisible()
  await page.getByLabel('Senha atual', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  await loginAs(page, 'ana@kurio.test', '/perfil', 'NovaSenha2026!')
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Ana Digital')
})
