import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // Listen on every interface so other devices on the LAN can join. Vite's
    // default host resolves to ::1 (IPv6) on Node 17+, which would leave
    // 127.0.0.1 unbound — and Spotify only accepts that address for loopback
    // redirects, so the OAuth callback needs it reachable.
    host: true,
    port: 3000,
    proxy: {
      // Express server — port comes from PORT in server/.env
      // Only /api is proxied — /room/:code is a client-side route and must fall
      // through to the SPA, not reach Express.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/spotify': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/callback': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
