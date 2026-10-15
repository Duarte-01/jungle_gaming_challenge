import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const result = spawnSync(
  process.execPath,
  [require.resolve('@playwright/test/cli'), ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Cache dentro do projeto para funcionar também na sandbox da nuvem.
      PLAYWRIGHT_BROWSERS_PATH:
        process.env.PLAYWRIGHT_BROWSERS_PATH ??
        fileURLToPath(new URL('../.cache/browsers', import.meta.url)),
    },
  },
)
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
