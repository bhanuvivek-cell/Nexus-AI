import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'API_'],
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(
        process.env.API_BASE_URL || env.API_BASE_URL || env.VITE_API_BASE_URL || ''
      ),
    },
    server: {
      port: 5173,
      host: true, // Listen on all network interfaces including localhost and 127.0.0.1
      strictPort: false,
    },
  }
})
