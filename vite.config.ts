import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Monigo',
      fileName: 'monigo',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // No external dependencies — the SDK is zero-dep
      external: [],
    },
    sourcemap: true,
    target: 'es2020',
    minify: false,
  },
})
