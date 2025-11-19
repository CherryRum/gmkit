import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'GMKit',
  outDir: 'dist',
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
  treeshake: true,
  splitting: false,
  noExternal: [/(.*)/],
  shims: false,
  esbuildOptions(options) {
    options.outfile = undefined;
  }
});
