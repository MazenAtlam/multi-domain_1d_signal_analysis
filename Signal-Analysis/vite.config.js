import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5001,
    proxy: {
      '/api': {
        target: 'https://fleshier-alvin-appealingly.ngrok-free.dev',
        changeOrigin: true
      },
    }
  }
})
