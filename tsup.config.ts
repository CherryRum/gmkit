import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],          // 入口文件
  format: ['esm', 'cjs', 'iife'],     // 输出格式：ESM / CommonJS / UMD
  globalName: 'GMKit',              // UMD global name -> window.GMKit
  outDir: 'dist',                   // 输出目录
  dts: true,                        // 生成类型声明
  sourcemap: true,                  // 生成 source map
  minify: true,                     // 压缩代码
  clean: true,                      // 构建前清空 dist
  treeshake: true,                  // 启用 tree-shaking
  splitting: false,                 // 禁止代码分片 (保证单文件产物)
  skipNodeModulesBundle: true,      // 不把node_modules打进bundle
  shims: false,                     // 禁用 polyfill shim 更纯净
  esbuildOptions(options) {
    // 作用：让 tsup 正确输出各自文件名，而不是覆盖
    options.outfile = undefined;
  }
});
