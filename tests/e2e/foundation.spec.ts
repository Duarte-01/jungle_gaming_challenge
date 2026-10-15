import { expect, test } from '@playwright/test'

// Valida a infraestrutura. Não substitui os 12 grupos de E2E do marketplace.
test('recebe REST pelo MSW e evento pelo cliente Socket.IO', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/setup')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Verificação da demonstração.')
  await expect(page.getByText('API simulada conectada')).toBeVisible()
  await expect(page.getByText('Evento recebido via Socket.IO')).toBeVisible()
  await page.getByRole('button', { name: 'Verificar API novamente' }).click()
  await expect(page.getByRole('button', { name: 'Verificar API novamente' })).toBeEnabled()
  await page.reload()
  await expect(page.getByText('API simulada conectada')).toBeVisible()
  await expect(page.getByText('Evento recebido via Socket.IO')).toBeVisible()
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(horizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('rota inexistente permite voltar ao início pelo router', async ({ page }) => {
  await page.goto('/nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()
})
