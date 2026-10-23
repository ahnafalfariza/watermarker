import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { playwright } from '@vitest/browser-playwright'

// Drops the prerender entry chunk once vite-prerender-plugin has used it, so the
// SSR bundle isn't shipped to (or precached by) browsers. Must run after the
// prerender plugin, which also uses enforce: 'post'.
function dropPrerenderChunk() {
  return {
    name: 'drop-prerender-chunk',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type === 'chunk' && output.isEntry && output.name === 'prerender') {
          delete bundle[fileName]
        }
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
    dropPrerenderChunk(),
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
  ],
  test: {
    globals: true,
    exclude: ['.claude/**', 'node_modules/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./test/setup.js'],
          exclude: ['.claude/**', 'node_modules/**', 'test/browser/**'],
        },
      },
      {
        // PDF export needs a real canvas and pdf.js worker, which jsdom lacks
        extends: true,
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.js'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
