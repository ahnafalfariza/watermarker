import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    exclude: ['.claude/**', 'node_modules/**'],
  },
})
