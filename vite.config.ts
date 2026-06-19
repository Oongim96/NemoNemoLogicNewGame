import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@scenes': resolve(__dirname, 'src/scenes'),
      '@ui': resolve(__dirname, 'src/ui'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    assetsInlineLimit: 0,
    outDir: 'dist',
  },
});
