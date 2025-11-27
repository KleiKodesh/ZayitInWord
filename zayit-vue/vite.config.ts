import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { dbServerPlugin } from './vite-plugin-db'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    vueDevTools(),
    viteSingleFile(), // Inline all assets into single HTML file
    ...(mode === 'development' ? [dbServerPlugin()] : []), // Serve DB in dev mode only
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // Inline all assets including images as base64
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // No code splitting
        manualChunks: undefined, // Disable manual chunks
      },
    },
  },
  // Ensure all assets are processed
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico'],
}))
