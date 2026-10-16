import type { Page } from '@playwright/test'

export async function stopMockWorker(page: Page) {
  // Model idle eviction, rather than forcibly aborting an HTTP exchange that is
  // still starting. Here network idle is the lifecycle condition under test.
  await page.waitForLoadState('networkidle')
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('ServiceWorker.enable')
  await cdp.send('ServiceWorker.stopAllWorkers')
  await cdp.detach()
}

export async function returnToStaleTab(page: Page) {
  await page.clock.install()
  await page.clock.fastForward(31_000)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    window.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    window.dispatchEvent(new Event('visibilitychange'))
  })
}
