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
  title: 'GMKit',
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
      { text: '算法', link: '/algorithms/' },
      { text: '公共能力', link: '/api/common' },
      {
        text: 'API Reference',
        children: [
          { text: 'API 总览', link: '/api/' },
          { text: 'TypeScript 说明书', link: '/api/typescript/' },
          { text: 'Java 说明书', link: '/api/java/' },
          { text: 'TypeDoc latest', link: '/api/typescript/latest/' },
          { text: 'Javadoc latest', link: '/api/java/latest/' },
        ],
      },
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
      '/api/': [
        {
          text: '公共 API',
          children: [
            '/api/',
            '/api/typescript/',
            '/api/java/',
            '/api/public-api',
            '/api/common',
          ],
        },
      ],
      '/algorithms/': [
        {
          text: '算法与协议能力',
          children: [
            '/algorithms/',
            '/algorithms/SM2',
            '/algorithms/SM3',
            '/algorithms/SM4',
            '/algorithms/ZUC',
            '/algorithms/SM9',
            '/algorithms/SHA',
          ],
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
