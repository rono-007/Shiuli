import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['maplibre-gl']
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/maplibre-gl')) {
            return 'vendor-maplibre';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('src/data/north_eateries.json')) {
            return 'dataset-eateries';
          }
          if (id.includes('src/data/north_other_facilities.json')) {
            return 'dataset-facilities';
          }
          if (id.includes('src/data/metros.json')) {
            return 'dataset-metros';
          }
          if (id.includes('src/components/AdminPanel')) {
            return 'admin-panel';
          }
        }
      }
    }
  },
  server: {
    allowedHosts: true, // Allows any host, perfect for ngrok
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
