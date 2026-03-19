import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// Strips the prerender chunk from client output after pre-rendering completes.
// vite-prerender-plugin emits a modulepreload link for its SSR bundle — this
// is dead code that browsers would download but never execute (~240KB).
function prerenderCleanup() {
  return {
    name: 'prerender-cleanup',
    closeBundle() {
      const distDir = join(process.cwd(), 'dist')
      const htmlPath = join(distDir, 'index.html')

      try {
        let html = readFileSync(htmlPath, 'utf-8')
        html = html.replace(/<link[^>]*href="[^"]*prerender[^"]*"[^>]*>\s*/g, '')
        writeFileSync(htmlPath, html)

        const assetsDir = join(distDir, 'assets')
        for (const file of readdirSync(assetsDir)) {
          if (file.startsWith('prerender-')) {
            unlinkSync(join(assetsDir, file))
          }
        }
      } catch {
        // Non-fatal — cleanup is best-effort
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: new URL('./src/prerender.jsx', import.meta.url).pathname,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icons.svg', 'pwa-icon.svg', 'pwa-maskable.svg'],
      manifest: {
        name: 'Watermark',
        short_name: 'Watermark',
        description: 'Client-side watermarking for images and PDFs. Files never leave your device.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0A0A0B',
        theme_color: '#0EA5E9',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,pdf,woff2}'],
        navigateFallbackDenylist: [/^\/__/, /\/.*\.[^/]+$/],
      },
    }),
    prerenderCleanup(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    exclude: ['.claude/**', 'node_modules/**'],
  },
})
