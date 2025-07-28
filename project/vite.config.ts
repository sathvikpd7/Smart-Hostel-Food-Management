import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // if using React

export default defineConfig({
  plugins: [react()], // if using React
  css: {
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})