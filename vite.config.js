import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/it-s-Farav/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'docs',
    assetsDir: 'src',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        manifiesto: resolve(__dirname, 'manifiesto.html'),
      },
    },
  },
  server: {
    open: true,
  },
});
