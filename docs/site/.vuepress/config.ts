import { defineUserConfig } from 'vuepress';
import { hopeTheme } from 'vuepress-theme-hope';
import { viteBundler } from '@vuepress/bundler-vite';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';
import { constants } from 'zlib';

const hiddenContributors = new Set(['Copilot', 'copilot-swe-agent[bot]']);

const contributorInfo = [
  {
    username: 'yulin',
    name: 'mumu',
    alias: ['mumu', 'linyuliu', 'yulin'],
    emailAlias: ['yulin.1996@foxmail.com'],
  },
];

export default defineUserConfig({
  lang: 'zh-CN',
  title: 'GMKit 文档',
  description: 'GMKit Java、TypeScript、协议边界与扩展包文档',
  base: '/',

  bundler: viteBundler({
    viteOptions: {
      plugins: [
        compression({
          include: /\.(js|mjs|css|html|json|svg|map)$/i,
          threshold: 1024,
          skipIfLargerOrEqual: true,
          deleteOriginalAssets: false,
          algorithms: [
            defineAlgorithm('gzip', { level: 9 }),
            defineAlgorithm('brotliCompress', {
              params: {
                [constants.BROTLI_PARAM_QUALITY]: 11,
              },
            }),
            defineAlgorithm('zstandard', { level: 19 }),
          ],
        }),
      ],
    },
  }),

  plugins: [],
  theme: hopeTheme({
    hostname: 'https://gmkit.cn',

    repo: 'gmkits/gmkit',
    docsDir: 'docs/site',
    docsBranch: 'main',

    navbar: [
      { text: '开始使用', link: '/guide/' },
      { text: 'Java', link: '/java/' },
      { text: 'TypeScript', link: '/typescript/' },
      { text: 'API Reference', link: '/api/' },
      { text: '协议与标准', link: '/standards/' },
      { text: '集成示例', link: '/integrations/' },
      { text: '扩展包', link: '/extensions/' },
      { text: '项目维护', link: '/maintenance/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          children: ['/guide/', '/guide/getting-started', '/guide/about-guomi', '/guide/security'],
        },
      ],
      '/java/': [
        {
          text: 'Java',
          children: ['/java/', '/java/guide'],
        },
      ],
      '/typescript/': [
        {
          text: 'TypeScript',
          children: [
            '/typescript/',
            '/typescript/imports',
            '/typescript/api-surface',
            '/algorithms/SM2',
            '/algorithms/SM3',
            '/algorithms/SM4',
            '/algorithms/ZUC',
            '/algorithms/SHA',
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          children: ['/api/'],
        },
      ],
      '/algorithms/': [
        {
          text: '国密算法',
          children: [
            '/algorithms/SM2',
            '/algorithms/SM3',
            '/algorithms/SM4',
            '/algorithms/ZUC',
          ],
        },
        {
          text: '国际标准算法',
          children: ['/algorithms/SHA'],
        },
      ],
      '/standards/': [
        {
          text: '协议与标准',
          children: [
            '/standards/',
            '/standards/GMT-0009-COMPLIANCE',
            '/standards/GMT-0009-快速参考',
            '/standards/interop-vectors',
          ],
        },
      ],
      '/integrations/': [
        {
          text: '集成示例',
          children: [
            '/integrations/',
            '/integrations/java-hutool',
            '/integrations/go',
            '/integrations/python',
            '/integrations/rust',
            '/integrations/web-crypto',
          ],
        },
      ],
      '/extensions/': [
        {
          text: '扩展包',
          children: ['/extensions/'],
        },
      ],
      '/maintenance/': [
        {
          text: '项目维护',
          children: [
            '/maintenance/',
            '/maintenance/architecture',
            '/maintenance/publishing',
            '/maintenance/documentation-deployment',
            '/maintenance/release-audit',
          ],
        },
        {
          text: '性能与验证',
          children: [
            '/maintenance/performance/benchmarks',
            '/maintenance/performance/optimization',
            '/maintenance/reports/support-scope',
            '/maintenance/reports/validation-model',
            '/maintenance/reports/security-boundaries',
            '/maintenance/reports/sm2-compatibility',
          ],
        },
      ],
    },

    plugins: {
      copyCode: { showInMobile: true },
      git: {
        updatedTime: true,
        contributors: {
          info: contributorInfo,
          transform: (contributors) =>
            contributors
              .filter(
                ({ name, username }) =>
                  !hiddenContributors.has(name) && !hiddenContributors.has(username),
              )
              .sort((a, b) => b.commits - a.commits)
              .slice(0, 2),
        },
      },
      readingTime: { wordPerMinute: 200 },
      redirect: {
        config: {
          '/api/typescript/': '/api/typescript/latest/',
          '/api/java/': '/api/java/latest/',
          '/dev/API-SURFACE.zh-CN': '/typescript/api-surface',
          '/dev/IMPORT_GUIDE': '/typescript/imports',
          '/dev/JAVA-LIBRARY.zh-CN': '/java/guide',
          '/dev/JAVA-INTEGRATION.zh-CN': '/integrations/java-hutool',
          '/dev/GO-INTEGRATION.zh-CN': '/integrations/go',
          '/dev/PYTHON-INTEGRATION.zh-CN': '/integrations/python',
          '/dev/RUST-INTEGRATION.zh-CN': '/integrations/rust',
          '/dev/INTERNATIONAL-ALGORITHMS.zh-CN': '/integrations/web-crypto',
          '/dev/INTEROP_VECTORS': '/standards/interop-vectors',
          '/dev/ARCHITECTURE.zh-CN': '/maintenance/architecture',
          '/dev/PUBLISHING': '/maintenance/publishing',
          '/dev/PROJECT-SLIMMING-CHECKLIST.zh-CN': '/maintenance/release-audit',
          '/performance/PERFORMANCE': '/maintenance/performance/benchmarks',
          '/performance/PERFORMANCE-OPTIMIZATIONS': '/maintenance/performance/optimization',
          '/summaries/PROJECT_SUMMARY': '/maintenance/reports/support-scope',
          '/summaries/IMPLEMENTATION_SUMMARY': '/maintenance/reports/validation-model',
          '/summaries/SECURITY-SUMMARY': '/maintenance/reports/security-boundaries',
          '/summaries/STANDARD-MIGRATION-SUMMARY': '/maintenance/reports/sm2-compatibility',
        },
      },
      copyright: false,
    },

    markdown: {
      gfm: true,
      breaks: true,
      linkify: true,
      footnote: true,
      tasklist: true,
      component: true,
      vPre: true,
      codeTabs: true,
      tabs: true,
    },
    lastUpdated: true,
    footer:
      'Apache-2.0 Licensed | Copyright © 2026 mumu | <a class="icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">备案号：京ICP备2023009505号-2</a>',
    displayFooter: true,
    author: { name: 'mumu', email: 'yulin.1996@foxmail.com' },
    metaLocales: { editLink: '在 GitHub 上编辑此页' },
  }),
});
