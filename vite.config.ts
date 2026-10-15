import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
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
