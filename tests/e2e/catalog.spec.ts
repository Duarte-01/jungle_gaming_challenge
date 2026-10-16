import { expect, test } from '@playwright/test'
import { openCatalogSearch } from './helpers.js'

test('busca compõe a URL e restaura após refresh e histórico', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await openCatalogSearch(page)
  const search = page.getByRole('searchbox', { name: 'Buscar NFTs' })
  await search.fill('Emerald')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Emerald/)
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await page.reload()
  await expect(search).toHaveValue('Emerald')
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await openCatalogSearch(page)
  await expect(page).toHaveURL(/q=Emerald/)
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
  if (mobile) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  await page.getByRole('combobox', { name: 'Ordenar por:' }).selectOption('price-asc')
  if (mobile) await page.getByRole('button', { name: 'Ver resultados' }).click()
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
  await expect(page.locator('#nft-details-panel')).toContainText(
    'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions.',
  )
  await expect(page.locator('#nft-details-panel')).toContainText('Nova Sato recebe 5%')
  await expect(page.locator('.mobile-description')).toHaveText(
    'Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum.',
  )
  await page.goto('/nfts/inexistente')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})

test('carregamento lento, falha REST e recuperação pela interface', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kurio:scenario', 'slow'))
  await page.goto('/')
  await expect(page.getByLabel('Carregando catálogo')).toBeVisible()
  await expect(page.locator('.nft-card')).toHaveCount(9)
  await page.evaluate(() => localStorage.setItem('kurio:scenario', 'catalog-error'))
  await openCatalogSearch(page)
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

test('faixa de preço usa duas alças, impede inversão e restaura limites da URL', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  const mobile = testInfo.project.name === 'mobile'
  const open = async () => {
    if (mobile) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }
  await open()
  await expect(page.locator('.price-range-value:visible')).toHaveCSS('color', 'rgb(245, 241, 235)')
  const min = page.getByRole('slider', { name: 'Preço mínimo em ETH' })
  const max = page.getByRole('slider', { name: 'Preço máximo em ETH' })
  await min.focus()
  await min.press('ArrowRight')
  await expect(min).toHaveValue('0.03')
  await max.focus()
  await max.press('Home')
  await expect(max).toHaveValue('0.03')
  await min.press('End')
  await expect(min).toHaveValue('0.03')
  const request = page.waitForRequest((request) => {
    const url = new URL(request.url())
    return (
      url.pathname === '/api/nfts' &&
      url.searchParams.get('min') === '0.03' &&
      url.searchParams.get('max') === '0.03'
    )
  })
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await request
  if (mobile) await page.getByRole('button', { name: 'Ver resultados' }).click()
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await page.reload()
  await open()
  await expect(min).toHaveValue('0.03')
  await expect(max).toHaveValue('0.03')
  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  await expect(min).toHaveValue('0.02')
  await expect(max).toHaveValue('12.3')
  const rail = page.locator('.price-range:visible')
  const box = await rail.boundingBox()
  expect(box).not.toBeNull()
  await rail.click({ position: { x: box!.width * 0.75, y: 16 } })
  const pointerMax = Number(await max.inputValue())
  expect(pointerMax).toBeGreaterThan(11)
  expect(pointerMax).toBeLessThan(13)
  await expect(min).toHaveValue('0.02')
  // Native thumb dragging must also work; clicking the rail is not the only interaction.
  const track = await max.boundingBox()
  expect(track).not.toBeNull()
  await page.mouse.move(track!.x + 9 + ((track!.width - 18) * pointerMax) / 16, track!.y + 17)
  await page.mouse.down()
  await page.mouse.move(track!.x + track!.width * 0.5, track!.y + 17, { steps: 8 })
  await page.mouse.up()
  expect(Number(await max.inputValue())).toBeGreaterThan(7)
  expect(Number(await max.inputValue())).toBeLessThan(9)
  if (mobile) await page.getByRole('button', { name: 'Ver resultados' }).click()
  await expect(page.locator('.nft-card')).toHaveCount(9)
})
