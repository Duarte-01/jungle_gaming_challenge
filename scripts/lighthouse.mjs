import { spawn, execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const config = JSON.parse(await readFile(new URL('../lighthouse.config.json', import.meta.url)))
const args = process.argv.slice(2)
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const runs = Number(option('--runs') ?? config.runs)
if (!Number.isInteger(runs) || runs < 1 || runs > 10) throw new Error('Use --runs entre 1 e 10.')
const pages = option('--page')
  ? Object.entries(config.pages).filter(([name]) => name === option('--page'))
  : Object.entries(config.pages)
const profiles = option('--profile')
  ? config.profiles.filter((name) => name === option('--profile'))
  : config.profiles
if (!pages.length || !profiles.length)
  throw new Error('Página ou perfil inexistente na configuração.')
const baseURL = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4174'
const outputDir = resolve(process.env.AUDIT_OUTPUT_DIR ?? 'reports/lighthouse')
await mkdir(outputDir, { recursive: true })
// A failed audit must not leave an old successful summary in the artifact.
await rm(resolve(outputDir, 'summary.json'), { force: true })
for (const [page] of pages)
  for (const profile of profiles)
    for (let run = 1; run <= 10; run++)
      for (const extension of ['html', 'json'])
        await rm(resolve(outputDir, `${page}-${profile}-${run}.report.${extension}`), {
          force: true,
        })

const chromePath =
  process.env.CHROME_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
const server = process.env.AUDIT_BASE_URL
  ? undefined
  : spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4174',
        '--strictPort',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
let serverOutput = ''
server?.stdout.on('data', (chunk) => {
  serverOutput += chunk
})
server?.stderr.on('data', (chunk) => {
  serverOutput += chunk
})
const observations = []
try {
  let ready = false
  for (let index = 0; index < 80; index++) {
    if (server?.exitCode !== null && server?.exitCode !== undefined)
      throw new Error(`Preview encerrou: ${serverOutput}`)
    try {
      ready = (await fetch(baseURL)).ok
    } catch {
      /* processo ainda iniciando */
    }
    if (ready) break
    await delay(250)
  }
  if (!ready) throw new Error(`Preview não iniciou: ${serverOutput}`)
  for (const [page, path] of pages)
    for (const profile of profiles)
      for (let run = 1; run <= runs; run++) {
        const output = resolve(outputDir, `${page}-${profile}-${run}`)
        console.log(`Lighthouse: ${page}, ${profile}, medição ${run}/${runs}`)
        const cliArgs = [
          'node_modules/lighthouse/cli/index.js',
          new URL(path, baseURL).href,
          '--quiet',
          '--no-enable-error-reporting',
          `--only-categories=${config.categories.join(',')}`,
          '--output=html',
          '--output=json',
          `--output-path=${output}`,
          `--chrome-flags=${config.chromeFlags.join(' ')}`,
        ]
        if (profile === 'desktop') cliArgs.push('--preset=desktop')
        await new Promise((ok, fail) => {
          const auditProcess = spawn(process.execPath, cliArgs, {
            env: { ...process.env, ...(chromePath ? { CHROME_PATH: chromePath } : {}) },
            stdio: 'inherit',
          })
          auditProcess.on('error', fail)
          auditProcess.on('exit', (code) =>
            code === 0 ? ok() : fail(new Error(`Lighthouse encerrou com ${code}`)),
          )
        })
        const report = JSON.parse(await readFile(`${output}.report.json`, 'utf8'))
        if (report.runtimeError) throw new Error(JSON.stringify(report.runtimeError))
        if (!report.audits['largest-contentful-paint']?.numericValue)
          throw new Error('Página não produziu LCP; não aceitar auditoria vazia.')
        const requests = report.audits['network-requests']?.details?.items ?? []
        const expectedApiPath =
          page === 'home' ? '/api/nfts' : `/api/nfts/${path.split('/').at(-1)}`
        if (
          !requests.some(
            (request) =>
              new URL(request.url).pathname === expectedApiPath && request.statusCode === 200,
          )
        )
          throw new Error(`A auditoria não carregou os dados reais da rota ${page} pelo MSW.`)
        if (
          !requests.some(
            (request) =>
              /\/images\/nfts\/emerald-ape\.(avif|webp|png)$/.test(new URL(request.url).pathname) &&
              request.statusCode === 200,
          )
        )
          throw new Error(
            'A auditoria não carregou a arte; não aceitar skeleton/fallback como entrega.',
          )
        if (
          !requests.some(
            (request) =>
              /ibm-plex-mono.*\.woff2$/.test(new URL(request.url).pathname) &&
              request.statusCode === 200,
          )
        )
          throw new Error('A auditoria não carregou a fonte local da aplicação.')
        const scores = Object.fromEntries(
          config.categories.map((name) => [name, Math.round(report.categories[name].score * 100)]),
        )
        const metrics = Object.fromEntries(
          ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(
            (name) => [name, report.audits[name].numericValue],
          ),
        )
        observations.push({
          page,
          profile,
          run,
          scores,
          metrics,
          lighthouseVersion: report.lighthouseVersion,
          userAgent: report.userAgent,
          finalUrl: report.finalDisplayedUrl ?? report.finalUrl,
        })
        console.log(JSON.stringify({ page, profile, run, ...scores, ...metrics }))
      }
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  }
  const medians = pages.flatMap(([page]) =>
    profiles.map((profile) => {
      const measurements = observations.filter(
        (item) => item.page === page && item.profile === profile,
      )
      const scores = Object.fromEntries(
        config.categories.map((name) => [
          name,
          median(measurements.map((item) => item.scores[name])),
        ]),
      )
      const metrics = Object.fromEntries(
        Object.keys(measurements[0].metrics).map((name) => [
          name,
          median(measurements.map((item) => item.metrics[name])),
        ]),
      )
      return {
        page,
        profile,
        runs: measurements.length,
        scores,
        metrics,
        targetsMet: Object.entries(config.targets).every(
          ([name, target]) => scores[name] >= target,
        ),
      }
    }),
  )
  const summary = {
    createdAt: new Date().toISOString(),
    node: process.version,
    chromium: chromePath
      ? execFileSync(chromePath, ['--version'], { encoding: 'utf8' }).trim()
      : 'auto-detectado pelo Lighthouse',
    baseURL,
    config,
    observations,
    scope: {
      runs,
      pages: pages.map(([name]) => name),
      profiles,
      completeMatrix:
        runs === config.runs &&
        pages.length === Object.keys(config.pages).length &&
        profiles.length === config.profiles.length,
    },
    medians,
    buildFiles: process.env.AUDIT_BASE_URL
      ? null
      : Object.fromEntries(
          await Promise.all(
            (await readdir('dist', { recursive: true, withFileTypes: true }))
              .filter((file) => file.isFile())
              .map(async (file) => {
                const path = resolve(file.parentPath, file.name)
                return [
                  path.slice(resolve('dist').length + 1),
                  createHash('sha256')
                    .update(await readFile(path))
                    .digest('hex'),
                ]
              }),
          ),
        ),
  }
  await writeFile(resolve(outputDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ medians }, null, 2))
  if (medians.some((item) => !item.targetsMet)) process.exitCode = 1
} finally {
  server?.kill('SIGTERM')
}
