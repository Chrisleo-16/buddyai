import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'BuddyAI — PPE trained-observer coach',
        short_name: 'BuddyAI',
        description: 'AI buddy observer for Ebola PPE donning & doffing (Gemma 4). Training and decision support only.',
        theme_color: '#F7F4EF',
        background_color: '#F7F4EF',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith('/api/protocols'), handler: 'StaleWhileRevalidate', options: { cacheName: 'protocols', expiration: { maxEntries: 10 } } },
          { urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com', handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20 } } },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000', '/socket.io': { target: 'http://localhost:4000', ws: true } },
  },
  preview: { port: 4173, proxy: { '/api': 'http://localhost:4000', '/socket.io': { target: 'http://localhost:4000', ws: true } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test-setup.js' },
});
