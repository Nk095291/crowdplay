import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev, proxy API calls to Django so the frontend can use
// relative URLs. In production set VITE_API_URL to the Railway backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
