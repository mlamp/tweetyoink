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
    // ALWAYS generate source maps for debugging Chrome extensions
    // Use inline source maps for better Chrome DevTools integration
    sourcemap: 'inline',
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
