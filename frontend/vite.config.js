import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get backend URL - use Docker service name if in Docker, otherwise localhost
const backendUrl = process.env.DOCKER ? 'http://backend:8000' : 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
})
