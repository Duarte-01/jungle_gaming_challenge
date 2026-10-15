import { expect, test } from '@playwright/test'

test('busca compõe a URL e restaura após refresh e histórico', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  const search = page.getByRole('searchbox', { name: 'Buscar NFTs' })
  await search.fill('Emerald')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Emerald/)
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await page.reload()
  await expect(search).toHaveValue('Emerald')
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await search.fill('não existe')
  await search.press('Enter')
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await page.goBack()
  await expect(search).toHaveValue('Emerald')
  await expect(page.locator('.nft-card')).toHaveCount(4)
})

test('filtros combinados, ordenação e paginação usam os parâmetros da API', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await page.getByRole('button', { name: 'Página 2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('heading', { name: 'Emerald Ape #609' })).toBeVisible()
  const mobile = testInfo.project.name === 'mobile'
  if (mobile) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const filters = mobile
    ? page.getByRole('dialog')
    : page.getByRole('complementary', { name: 'Filtros de catálogo' })
  await filters.getByRole('button', { name: /^Arte digital/ }).click()
  await filters.getByRole('button', { name: /^Ethereum/ }).click()
  if (mobile) await page.getByRole('button', { name: 'Ver resultados' }).click()
  await expect(page).toHaveURL(/category=Arte/)
  await expect(page).toHaveURL(/network=Ethereum/)
  await expect(page).toHaveURL(/page=1/)
  await page.getByRole('combobox', { name: 'Ordenar por:' }).selectOption('price-asc')
  await expect(page.locator('.nft-card').first().getByRole('heading')).toHaveText(
    'Golden Signal #160',
  )
  await expect(page.locator('.catalog-status')).toHaveText('12 NFTs encontrados')
})

test('detalhe direto, edição esgotada e NFT inexistente', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-42')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Edição limitada/ })).toBeDisabled()
  await expect(page.getByRole('spinbutton', { name: 'Quantidade' })).toHaveAttribute('max', '5')
  await page.goto('/nfts/inexistente')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('carregamento lento, falha REST e recuperação pela interface', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kurio:scenario', 'slow'))
  await page.goto('/')
  await expect(page.getByLabel('Carregando catálogo')).toBeVisible()
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await page.evaluate(() => localStorage.setItem('kurio:scenario', 'catalog-error'))
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('Sage')
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar os NFTs.' }),
  ).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:scenario'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.locator('.nft-card')).toHaveCount(4)
})

test('mobile gerencia foco do drawer e início não tem overflow', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  if (testInfo.project.name === 'mobile') {
    const trigger = page.getByRole('button', { name: 'Abrir filtros' })
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Fechar filtros' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})
