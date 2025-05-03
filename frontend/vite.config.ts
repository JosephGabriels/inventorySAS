import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  base: '/', // Changed from /static/
  build: {
    outDir: 'dist',
    assetsDir: 'static/assets', // Changed to include static prefix
    emptyOutDir: true,
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'static/assets/[name]-[hash][extname]';
          const ext = assetInfo.name.split('.').pop() || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'static/assets/img/[name]-[hash][extname]';
          }
          if (ext === 'css') {
            return 'static/assets/css/[name]-[hash][extname]';
          }
          return 'static/assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'static/assets/js/[name]-[hash].js',
        entryFileNames: 'static/assets/js/[name]-[hash].js',
      },
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://inventorysas.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/media': {
        target: 'https://inventorysas.onrender.com',
        changeOrigin: true,
        secure: true,
      }
    },
  },
})