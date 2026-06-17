export const homeMetrics = [
  { value: '5+', label: '算法域', description: 'SM2 / SM3 / SM4 / ZUC / SHA，SM9 作为 Java/WASM 边界。' },
  { value: '12', label: '产品页面', description: '首页、算法工作台、辅助工具和项目说明完整覆盖。' },
  { value: '1', label: '统一体验', description: '导航、卡片、表单、代码示例和结果展示保持同一视觉语言。' },
];

export const supportMatrix = [
  { name: 'SM2', ts: '支持', java: '支持', note: '加解密、签名验签、密钥生成' },
  { name: 'SM3', ts: '支持', java: '支持', note: '摘要与 HMAC' },
  { name: 'SM4', ts: '支持', java: '支持', note: '常用分组模式' },
  { name: 'ZUC', ts: '支持', java: '支持', note: 'ZUC-128、EEA3、EIA3' },
  { name: 'SHA', ts: '支持', java: 'JDK', note: 'SHA-1/256/384/512' },
  { name: 'SM9', ts: '不支持', java: '支持', note: '前端通过 Java API 或 WASM runtime 接入' },
];
