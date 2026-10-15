import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const names = ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat']
const directory = new URL('../public/images/nfts/', import.meta.url)
const manifest = []
for (const name of names) {
  const original = new URL(`${name}.png`, directory)
  const webp = new URL(`${name}.webp`, directory)
  const avif = new URL(`${name}.avif`, directory)
  const originalBytes = await readFile(original)
  await sharp(originalBytes)
    .webp({ lossless: true, exact: true, effort: 6 })
    .toFile(fileURLToPath(webp))
  await sharp(originalBytes)
    .avif({ quality: 90, chromaSubsampling: '4:4:4', effort: 7 })
    .toFile(fileURLToPath(avif))
  const [pixels, webpPixels] = await Promise.all([
    sharp(originalBytes).ensureAlpha().raw().toBuffer(),
    sharp(await readFile(webp))
      .ensureAlpha()
      .raw()
      .toBuffer(),
  ])
  assert(pixels.equals(webpPixels), `WebP must preserve every original RGBA pixel: ${name}`)
  const formats = {}
  for (const extension of ['png', 'webp', 'avif']) {
    const bytes = await readFile(new URL(`${name}.${extension}`, directory))
    formats[extension] = {
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }
  }
  manifest.push({ name, width: 250, height: 250, webpLossless: true, avifQuality: 90, formats })
  console.log(
    `${name}: PNG ${formats.png.bytes} B; WebP ${formats.webp.bytes} B; AVIF ${formats.avif.bytes} B`,
  )
}
await writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n')
