import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/types/**'],
      // 起步阈值：v0.x 阶段以"不低于现状"为底线，后续 audit 推高。
      // SM4 CK-table bug (audit-iter8-D) 等若有覆盖与标准向量对照即可早期发现。
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  }
});
