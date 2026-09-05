import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    manifest: false,
    workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'], navigateFallback: 'index.html' },
  })],
  base: './',
  build: {
    cssMinify: false,
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'framework';
          if (id.includes('node_modules/lucide-react/')) return 'icons';
          return undefined;
        },
      },
    },
  },
});
