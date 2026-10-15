import type { Page } from '@playwright/test'

export async function openCatalogSearch(page: Page) {
  const trigger = page.getByRole('link', { name: 'Buscar no mercado' })
  if (new URL(page.url()).hash !== '#busca' && (await trigger.isVisible())) await trigger.click()
}
