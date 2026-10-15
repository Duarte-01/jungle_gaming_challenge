import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'module-loader',
              test: /vite[\\/]preload-helper/,
              priority: 100,
            },
            {
              debugName: 'public-bootstrap',
              // Follow static edges only; forms and mutation implementations stay lazy.
              name(id, context) {
                const reaches = (root: RegExp) => {
                  const pending = [id]
                  const visited = new Set<string>()
                  while (pending.length) {
                    const current = pending.pop()!
                    if (visited.has(current)) continue
                    visited.add(current)
                    if (root.test(current)) return true
                    pending.push(...(context.getModuleInfo(current)?.importers ?? []))
                  }
                  return false
                }
                const mock = reaches(/[\\/]src[\\/]mocks[\\/]browser\.ts$/)
                const ui = reaches(/[\\/]src[\\/]app[\\/]mount\.tsx$/)
                if (!mock && !ui) return null
                if (/[\\/]node_modules[\\/]axios[\\/]/.test(id)) return 'http-client'
                if (mock) return 'mock-network'
                return /[\\/]node_modules[\\/]/.test(id) ? 'ui-vendor' : 'public-ui'
              },
            },
          ],
        },
      },
    },
  },
  server: {
    watch: { ignored: ['**/reports/**', '**/playwright-report/**', '**/test-results/**'] },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'preload-local-fonts',
      transformIndexHtml: {
        order: 'post',
        handler(_html, context) {
          if (!context.bundle) return []
          const fontPreloads = Object.values(context.bundle)
            .filter(
              (asset) =>
                asset.type === 'asset' &&
                /ibm-plex-mono-latin-(400|600)-normal.*\.woff2$/.test(asset.fileName),
            )
            .map((asset) => ({
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'font',
                type: 'font/woff2',
                crossorigin: 'anonymous',
                href: `/${asset.fileName}`,
              },
              injectTo: 'head' as const,
            }))
          return fontPreloads
        },
      },
    },
  ],
})
