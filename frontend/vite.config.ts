import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite-cache',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Multi-page app: two separate HTML entry points
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
      output: {
        // Shared vendor chunks for efficient caching across both apps
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'zod'],
          'qr-vendor': ['react-qr-code', '@zxing/browser'],
          'charts-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
  css: {
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
