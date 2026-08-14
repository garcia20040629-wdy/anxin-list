import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/anxin-list/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg'],
      manifest: {
        name: '安心清单',
        short_name: '安心清单',
        description: '个人任务清单：随手记下，安心不慌',
        lang: 'zh-CN',
        start_url: '/anxin-list/',
        scope: '/anxin-list/',
        display: 'standalone',
        theme_color: '#0d9488',
        background_color: '#f6f7f9',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/anxin-list/index.html',
      },
    }),
  ],
})
