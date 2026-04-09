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
  appType: 'spa',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    /** Must match backend FrontendBaseUrl (OAuth redirect). If this fails, free the port: lsof -i :5173 */
    port: parseInt(process.env.PORT || '5173'),
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        // Supabase-backed analytics can be slow; short defaults sometimes surface as 502 from the proxy
        timeout: 120_000,
        proxyTimeout: 120_000,
      },
    },
  },
})
