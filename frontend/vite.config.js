import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // The proxy is a fallback for relative-URL requests during dev.
    // Our Axios client uses an absolute baseURL (http://localhost:5000/api)
    // so requests go directly to Express and bypass this proxy — which is fine.
    // The proxy here lets you also use relative paths (e.g. fetch('/api/...'))
    // anywhere else in the app without needing the full URL.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Do NOT rewrite — Express is mounted at /api, so keep the prefix.
        // rewrite: (path) => path.replace(/^\/api/, '') ← do not enable
      },
    },
  },
})
