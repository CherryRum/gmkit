// ESLint config (legacy v8 style — flat config is v9+).
// Minimal starter ruleset: TS recommended + a few crypto-safety rules.
// Audit Section G will tighten this over time.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '../../docs/site/',
    '../../apps/demo-vue/',
    'coverage/',
    '*.cjs',
    '*.mjs',
    'vite.config.ts',
    'vitest.config.ts',
    'tsup.config.ts',
    'examples.ts',
  ],
  rules: {
    // Crypto safety: use === over loose equality
    'eqeqeq': ['error', 'always'],
    // Allow `any` for now (interop boundaries); audit-iter8-G will tighten
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow unused parameters prefixed with _
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  },
  overrides: [
    {
      // Isomorphic environment-detection helpers need dynamic require()
      // and silent catch blocks for browser/Node fallback paths.
      // Tightening these would harm cross-runtime portability.
      files: ['src/core/utils.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-empty': 'off',
      },
    },
  ],
};
