import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

const baseURL = new URL(process.env.DEPLOY_BASE_URL)
if (baseURL.protocol !== 'https:') throw new Error('O domínio público deve usar HTTPS.')
const { buildFiles } = JSON.parse(await readFile('reports/validation.json', 'utf8'))
const files = []
for (const [path, expected] of Object.entries(buildFiles)) {
  const response = await fetch(new URL(path, baseURL.origin), {
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  })
  const actual = createHash('sha256')
    .update(Buffer.from(await response.arrayBuffer()))
    .digest('hex')
  files.push({
    path,
    status: response.status,
    expected,
    actual,
    matches: response.ok && actual === expected,
  })
}
const matches = files.every((file) => file.matches)
await mkdir('reports/deploy', { recursive: true })
await writeFile(
  'reports/deploy/build.json',
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      baseURL: baseURL.origin,
      sourceCommit: process.env.GITHUB_SHA ?? null,
      matches,
      files,
    },
    null,
    2,
  ) + '\n',
)
console.log(
  `${files.filter((file) => file.matches).length}/${files.length} arquivos publicados conferidos por SHA-256.`,
)
if (!matches)
  throw new Error(
    `Build publicado divergente: ${files
      .filter((file) => !file.matches)
      .map((file) => file.path)
      .join(', ')}`,
  )
