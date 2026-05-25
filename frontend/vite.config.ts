import { defineConfig, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

// ESM-compatible __dirname
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Helper to open URLs in the default web browser cross-platform
const openUrl = (url: string) => {
  const startCmd = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
    ? 'start ""'
    : 'xdg-open';
  exec(`${startCmd} "${url}"`, (err) => {
    if (err) {
      console.error(`Failed to open URL: ${url}`, err);
    }
  });
};

// Custom Vite plugin to open both Student and Admin portals on start
const openMultipleTabsPlugin = () => {
  let opened = false;
  return {
    name: 'open-multiple-tabs',
    configureServer(server: ViteDevServer) {
      server.httpServer?.once('listening', () => {
        if (opened) return;
        opened = true;
        
        const address = server.httpServer?.address();
        const port = typeof address === 'object' && address ? address.port : 5173;
        const baseUrl = `http://localhost:${port}`;
        
        console.log(`\n🚀 Opening dashboards in separate browser tabs...`);
        console.log(`👉 Student App: ${baseUrl}/`);
        console.log(`👉 Admin App: ${baseUrl}/admin.html\n`);
        
        setTimeout(() => {
          openUrl(`${baseUrl}/`);
          setTimeout(() => {
            openUrl(`${baseUrl}/admin.html`);
          }, 300); // Sequential delay to prevent browser popup blockers
        }, 1000);
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    openMultipleTabsPlugin()
  ],
  server: {
    open: false // Prevent Vite's default single open to let our plugin handle dual tab open
  },
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
