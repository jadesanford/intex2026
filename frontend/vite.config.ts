import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const aspNetCoreUrls = process.env.ASPNETCORE_URLS
const firstAspNetUrl = aspNetCoreUrls?.split(';').map(s => s.trim()).find(Boolean)
const backendTarget =
  process.env.VITE_API_BASE_URL ||
  process.env.BACKEND_URL ||
  firstAspNetUrl ||
  `http://localhost:${process.env.BACKEND_PORT || '5215'}`

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    allowedHosts: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
