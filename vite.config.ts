import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // The posthog-js and tesseract.js chunks are only fetched when someone actually
        // uses that opt-in integration or the Scan feature — don't force every visitor's
        // service worker to precache them.
        globIgnores: ['**/posthog-*.js', '**/tesseract-*.js'],
        navigateFallbackDenylist: [/^\/downloads\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/open\.er-api\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fx-rates-primary',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 6 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.frankfurter\.dev\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fx-rates-fallback',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 6 },
            },
          },
          {
            urlPattern: /\/assets\/posthog-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'posthog-lib',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/assets\/tesseract-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-lib',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('posthog-js')) return 'posthog';
          if (id.includes('tesseract.js') || id.includes('tesseract-core') || id.includes('idb-keyval')) return 'tesseract';
        },
      },
    },
  },
})
