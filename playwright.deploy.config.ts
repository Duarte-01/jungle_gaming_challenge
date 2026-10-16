import { defineConfig } from '@playwright/test'

const baseURL = process.env.DEPLOY_BASE_URL
if (!baseURL) throw new Error('Defina DEPLOY_BASE_URL com a URL publicada da aplicação.')
const target = new URL(baseURL)
if (target.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(target.hostname))
  throw new Error('A validação pública exige HTTPS.')

export default defineConfig({
  testDir: './tests/deploy',
  outputDir: '.cache/deploy-results',
  fullyParallel: true,
  retries: 0,
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: 'reports/deploy/playwright', open: 'never' }]],
  use: {
    baseURL: target.origin,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
})
