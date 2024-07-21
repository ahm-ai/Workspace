import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'extension/dist',
    rollupOptions: {
      output: {
        entryFileNames: `${process.env.COMPONENT || 'custom'}.js`,
        assetFileNames: `[name].[ext]`
      }
    }
  }
})