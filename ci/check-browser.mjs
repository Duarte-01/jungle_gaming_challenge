import { readFile } from 'node:fs/promises'
import { launch } from 'chrome-launcher'

const { chromeFlags } = JSON.parse(
  await readFile(new URL('../lighthouse.config.json', import.meta.url), 'utf8'),
)
// Exercise the same CDP startup Lighthouse needs and expose Chromium stderr on failure.
const browser = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags,
  logLevel: 'verbose',
})
try {
  const response = await fetch(`http://127.0.0.1:${browser.port}/json/version`)
  if (!response.ok) throw new Error(`Chromium debugging endpoint returned ${response.status}`)
  const version = await response.json()
  if (!version.webSocketDebuggerUrl) throw new Error('Chromium did not expose a debugging socket')
  console.log(`Browser preflight passed: ${version.Browser}; UID ${process.getuid?.() ?? 'n/a'}`)
} finally {
  await browser.kill()
}
