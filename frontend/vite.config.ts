import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // Allows any host, perfect for ngrok
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin/logs': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin/stats': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
