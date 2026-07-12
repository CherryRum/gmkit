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
  title: 'gmkitx',
  description: 'GMKitX TypeScript 国密算法库技术文档',
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
    hostname: 'https://gmkits.github.io/gmkit',

    repo: 'gmkits/gmkit',
    docsDir: 'packages/ts-docs',
    docsBranch: 'main',

    navbar: [
      { text: '首页', link: '/' },
      {
        text: '指南',
        children: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '算法选择', link: '/guide/about-guomi' },
          { text: '安全边界', link: '/guide/security' },
        ],
      },
      {
        text: '算法文档',
        children: [
          { text: 'SM2 - 椭圆曲线公钥密码', link: '/algorithms/SM2' },
          { text: 'SM3 - 密码杂凑算法', link: '/algorithms/SM3' },
          { text: 'SM4 - 分组密码算法', link: '/algorithms/SM4' },
          { text: 'ZUC - 序列密码算法', link: '/algorithms/ZUC' },
          { text: 'SHA - 国际标准算法', link: '/algorithms/SHA' },
        ],
      },
      {
        text: '开发指南',
        children: [
          { text: '架构', link: '/dev/ARCHITECTURE.zh-CN' },
          { text: '导入方式', link: '/dev/IMPORT_GUIDE' },
          { text: '公开 API 清单', link: '/dev/API-SURFACE.zh-CN' },
          { text: 'GMKit Java', link: '/dev/JAVA-LIBRARY.zh-CN' },
          { text: 'Java / Hutool 对接', link: '/dev/JAVA-INTEGRATION.zh-CN' },
          { text: 'Go 对接', link: '/dev/GO-INTEGRATION.zh-CN' },
          { text: 'Python 对接', link: '/dev/PYTHON-INTEGRATION.zh-CN' },
          { text: 'Rust 对接', link: '/dev/RUST-INTEGRATION.zh-CN' },
          { text: '国际算法边界', link: '/dev/INTERNATIONAL-ALGORITHMS.zh-CN' },
          { text: '共享测试向量', link: '/dev/INTEROP_VECTORS' },
          { text: '发布流程', link: '/dev/PUBLISHING' },
          { text: '发布精简清单', link: '/dev/PROJECT-SLIMMING-CHECKLIST.zh-CN' },
        ],
      },
      {
        text: '标准与性能',
        children: [
          { text: 'GM/T 0009 实现边界', link: '/standards/GMT-0009-COMPLIANCE' },
          { text: 'GM/T 0009 快速参考', link: '/standards/GMT-0009-快速参考' },
          { text: '性能与基准', link: '/performance/PERFORMANCE' },
          { text: '性能优化方法', link: '/performance/PERFORMANCE-OPTIMIZATIONS' },
        ],
      },
      {
        text: '维护记录',
        children: [
          { text: '项目状态', link: '/summaries/PROJECT_SUMMARY' },
          { text: '实现状态', link: '/summaries/IMPLEMENTATION_SUMMARY' },
          { text: '安全状态', link: '/summaries/SECURITY-SUMMARY' },
          { text: '标准迁移记录', link: '/summaries/STANDARD-MIGRATION-SUMMARY' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '快速开始',
          children: ['/guide/getting-started', '/guide/about-guomi', '/guide/security'],
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
      '/dev/': [
        {
          text: '工程与 API',
          children: [
            '/dev/ARCHITECTURE.zh-CN',
            '/dev/IMPORT_GUIDE',
            '/dev/API-SURFACE.zh-CN',
            '/dev/INTEROP_VECTORS',
          ],
        },
        {
          text: '跨语言集成',
          children: [
            '/dev/JAVA-LIBRARY.zh-CN',
            '/dev/JAVA-INTEGRATION.zh-CN',
            '/dev/GO-INTEGRATION.zh-CN',
            '/dev/PYTHON-INTEGRATION.zh-CN',
            '/dev/RUST-INTEGRATION.zh-CN',
            '/dev/INTERNATIONAL-ALGORITHMS.zh-CN',
          ],
        },
        {
          text: '发布维护',
          children: ['/dev/PUBLISHING', '/dev/PROJECT-SLIMMING-CHECKLIST.zh-CN'],
        },
      ],
      '/standards/': [
        {
          text: '标准与合规',
          children: ['/standards/GMT-0009-COMPLIANCE', '/standards/GMT-0009-快速参考'],
        },
      ],
      '/performance/': [
        {
          text: '性能',
          children: ['/performance/PERFORMANCE', '/performance/PERFORMANCE-OPTIMIZATIONS'],
        },
      ],
      '/summaries/': [
        {
          text: '维护记录',
          children: [
            '/summaries/PROJECT_SUMMARY',
            '/summaries/IMPLEMENTATION_SUMMARY',
            '/summaries/SECURITY-SUMMARY',
            '/summaries/STANDARD-MIGRATION-SUMMARY',
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
