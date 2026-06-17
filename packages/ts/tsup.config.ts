import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'GMKit',
  outDir: 'dist',
  dts: true,
  sourcemap: process.env.BUILD_SOURCEMAP === '1',
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
