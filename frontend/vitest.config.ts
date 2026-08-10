import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // @mui/icons-material is a barrel of ~6000 modules; loading them one by one
    // exhausts the Windows file-handle limit (EMFILE). Pre-bundle instead.
    deps: {
      optimizer: {
        web: {
          include: ['@mui/icons-material', '@mui/material'],
        },
      },
    },
  },
});
