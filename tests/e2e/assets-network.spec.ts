import { expect, test } from '@playwright/test'
import { openCatalogSearch } from './helpers.js'

test('retratos originais carregam e catálogo mantém a busca mais recente', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.nft-card')).toHaveCount(9)
  const images = page.locator('.nft-card img')
  await expect(images).toHaveCount(9)
  expect(
    await images.evaluateAll((elements) =>
      elements.every(
        (image) =>
          image instanceof HTMLImageElement && image.complete && image.naturalWidth === 250,
      ),
    ),
  ).toBe(true)
  const controlStatus = await page.evaluate(
    async () =>
      (
        await fetch('/api/testing/scenario', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: 'out-of-order' }),
        })
      ).status,
  )
  expect(controlStatus).toBe(200)
  await openCatalogSearch(page)
  const search = page.getByRole('searchbox', { name: 'Buscar NFTs' })
  await search.fill('Emerald')
  await Promise.all([
    page.waitForRequest(
      (request) => request.url().includes('/api/nfts?') && request.url().includes('q=Emerald'),
    ),
    search.press('Enter'),
  ])
  await search.fill('Sage')
  const cancelled = page.waitForEvent(
    'requestfailed',
    (request) => request.url().includes('/api/nfts?') && request.url().includes('q=Emerald'),
  )
  await search.press('Enter')
  await cancelled
  await expect(page.locator('.nft-card')).toHaveCount(4)
  await expect(page).toHaveURL(/q=Sage/)
  expect(await page.locator('.nft-card h2').allTextContents()).toEqual(
    expect.arrayContaining([expect.stringContaining('Sage')]),
  )
  expect(
    (await page.locator('.nft-card h2').allTextContents()).every((title) =>
      title.startsWith('Sage'),
    ),
  ).toBe(true)
})
