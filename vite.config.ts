import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GMKit',
      formats: ['es', 'cjs', 'umd'],
      fileName: format => {
        if (format === 'es') return 'index.mjs';
        if (format === 'cjs') return 'index.cjs';
        if (format === 'umd') return 'index.umd.js';
        return `index.${format}.js`;
      }
    },
    sourcemap: true,
    rollupOptions: {
      external: ['@noble/curves', '@noble/hashes'],

      // ✔ preserveEntrySignatures 必须放这里，而不是 output 里
      preserveEntrySignatures: 'allow-extension',

      output: {
        exports: 'named',
        globals: {
          '@noble/curves': 'NobleCurves',
          '@noble/hashes': 'NobleHashes'
        }
      }
    },
    minify: 'esbuild'
  }
});
