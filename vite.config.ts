import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  root: 'demo', base: command === 'build' ? '/richbox/' : './',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 4318 },
}))
