
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Set base to './' to ensure relative paths for assets on GitHub Pages
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
});
