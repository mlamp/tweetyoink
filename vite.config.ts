import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

export default defineConfig(({ mode }) => ({
  plugins: [
    crx({ manifest })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Generate source maps for better debugging in development mode
    // Use external source maps (.map files) to keep bundle size down
    sourcemap: mode === 'development' ? true : false,
    // Reduce minification in development for more readable errors
    minify: mode === 'development' ? false : 'esbuild',
    // Keep chunk names readable in development
    rollupOptions: mode === 'development' ? {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    } : {}
  }
}));
