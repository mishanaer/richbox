import { defineConfig, transformWithEsbuild } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  root: 'demo', base: './',
  plugins: [
    { name: 'fluid-react-jsx', enforce: 'pre',
      async transform(code, id) {
        if (!id.includes('/demo/react/') || !id.endsWith('.tsx')) return
        const result = await transformWithEsbuild(code, id, { loader: 'tsx', jsx: 'automatic', jsxImportSource: 'react' })
        return { code: result.code, map: JSON.stringify(result.map) }
      },
    },
    solid({ exclude: ['**/demo/react/**'] }), tailwindcss(),
  ],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 4318 },
})
