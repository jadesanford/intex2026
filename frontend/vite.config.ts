import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Must match backend Program.cs default (BACKEND_PORT ?? PORT ?? "8082")
const backendPort = process.env.BACKEND_PORT || '8082'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
