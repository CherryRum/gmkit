export type ToolTone = 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'red' | 'slate';

export type ToolCategoryId =
  | 'home'
  | 'crypto'
  | 'hash'
  | 'keycert'
  | 'encoding'
  | 'data'
  | 'time'
  | 'text'
  | 'network';

export type ToolOptionKind = 'select' | 'text' | 'number' | 'boolean';

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  icon: string;
  description: string;
}

export interface ToolOption {
  key: string;
  label: string;
  kind: ToolOptionKind;
  defaultValue: string | boolean;
  options?: string[];
  placeholder?: string;
  tabs?: string[];
  help?: string;
  inputMode?: 'text' | 'password';
}

export interface ToolTab {
  key: string;
  label: string;
  actionLabel?: string;
}

export interface StudioTool {
  id: string;
  name: string;
  short: string;
  category: Exclude<ToolCategoryId, 'home'>;
  tone: ToolTone;
  description: string;
  tabs: ToolTab[];
  options: ToolOption[];
  sample: string;
  inputLabel?: string;
  outputLabel?: string;
  tags?: string[];
}

const select = (key: string, label: string, defaultValue: string, options: string[], extra: Partial<ToolOption> = {}): ToolOption => ({
  key,
  label,
  kind: 'select',
  defaultValue,
  options,
  ...extra,
});

const text = (key: string, label: string, defaultValue = '', placeholder?: string, extra: Partial<ToolOption> = {}): ToolOption => ({
  key,
  label,
  kind: 'text',
  defaultValue,
  placeholder,
  ...extra,
});

const number = (key: string, label: string, defaultValue: string, placeholder?: string, extra: Partial<ToolOption> = {}): ToolOption => ({
  key,
  label,
  kind: 'number',
  defaultValue,
  placeholder,
  ...extra,
});

export const categories: ToolCategory[] = [
  { id: 'home', name: '首页', icon: '⌂', description: '常用与最近使用' },
  { id: 'crypto', name: '加密', icon: '▣', description: '对称、非对称与密钥派生' },
  { id: 'hash', name: '摘要', icon: '#', description: '哈希、HMAC 与口令摘要' },
  { id: 'keycert', name: '密钥', icon: '◇', description: '密钥、证书与 PEM/DER' },
  { id: 'encoding', name: '编码', icon: '</>', description: '文本、URL、Hex 与 JWT' },
  { id: 'data', name: '数据', icon: '{}', description: 'JSON、Schema、Mock 与转换' },
  { id: 'time', name: '时间', icon: '◴', description: '时间戳、UUID 与 Cron' },
  { id: 'text', name: '文本', icon: 'Aa', description: 'Diff、正则、大小写与 Markdown' },
  { id: 'network', name: '网络', icon: '◎', description: 'URL、DNS、CIDR 与 HTTP' },
];

const hashOptions = [
  select('outputEncoding', '输出编码', 'Hex', ['Hex', 'Base64']),
  select('case', '大小写', 'Lower', ['Lower', 'Upper']),
  text('key', 'HMAC Key', 'gmkit-secret', 'HMAC 密钥', { tabs: ['HMAC'], inputMode: 'password' }),
];

export const tools: StudioTool[] = [
  {
    id: 'sm2',
    name: 'SM2',
    short: 'S2',
    category: 'crypto',
    tone: 'green',
    description: '国密 SM2 加密、解密、签名、验签和密钥生成。',
    tabs: ['加密', '解密', '签名', '验签', '密钥', '压缩公钥', '解压公钥'].map((label) => ({ key: label, label })),
    options: [
      select('mode', '密文顺序', 'C1C3C2', ['C1C3C2', 'C1C2C3'], { tabs: ['加密', '解密'] }),
      text('userId', 'User ID', '1234567812345678', '签名/验签用户标识', { tabs: ['签名', '验签'] }),
    ],
    sample: 'GMKit Studio',
    tags: ['gmkitx', '国密', 'signature'],
  },
  {
    id: 'sm4',
    name: 'SM4',
    short: 'S4',
    category: 'crypto',
    tone: 'orange',
    description: '国密 SM4 ECB/CBC/CTR/CFB/OFB 加密解密。',
    tabs: ['加密', '解密'].map((label) => ({ key: label, label })),
    options: [
      select('mode', '模式', 'CBC', ['CBC', 'ECB', 'CTR', 'CFB', 'OFB']),
      select('padding', '填充', 'PKCS7', ['PKCS7', 'NoPadding', 'Zero']),
      select('outputEncoding', '输出编码', 'Base64', ['Base64', 'Hex']),
      text('key', 'Key', '', '32 hex chars'),
      text('iv', 'IV', '', '32 hex chars, ECB 可为空'),
    ],
    sample: 'GMKit Studio',
    tags: ['gmkitx', '国密', 'cipher'],
  },
  {
    id: 'zuc',
    name: 'ZUC',
    short: 'ZU',
    category: 'crypto',
    tone: 'cyan',
    description: 'ZUC 密钥流、流加密、EEA3/EIA3。',
    tabs: ['密钥流', '加密', '解密', 'EEA3', 'EIA3'].map((label) => ({ key: label, label })),
    options: [
      text('key', 'Key', '', '32 hex chars'),
      text('iv', 'IV', '', '32 hex chars'),
      number('length', '长度', '32', undefined, { tabs: ['密钥流'] }),
      number('count', 'COUNT', '0', undefined, { tabs: ['EEA3', 'EIA3'] }),
      number('bearer', 'Bearer', '0', undefined, { tabs: ['EEA3', 'EIA3'] }),
      number('direction', 'Direction', '0', undefined, { tabs: ['EEA3', 'EIA3'] }),
    ],
    sample: 'GMKit Studio',
    tags: ['gmkitx', 'stream'],
  },
  {
    id: 'sm9',
    name: 'SM9',
    short: 'S9',
    category: 'crypto',
    tone: 'purple',
    description: 'SM9 Java API / WASM runtime 接入边界。',
    tabs: ['Java API', 'WASM', '能力'].map((label) => ({ key: label, label })),
    options: [
      text('endpoint', 'Endpoint', '', 'http://localhost:8080/api/sm9', { tabs: ['Java API'] }),
      text('wasmUrl', 'WASM URL', '', '/runtime/sm9.wasm', { tabs: ['WASM'] }),
    ],
    sample: '{\n  "operation": "sign",\n  "payload": { "userId": "alice", "message": "GMKit Studio" }\n}',
    tags: ['java-api', 'wasm'],
  },
  {
    id: 'aes',
    name: 'AES',
    short: 'AES',
    category: 'crypto',
    tone: 'blue',
    description: 'Web Crypto AES-GCM/CBC/CTR 加密解密。',
    tabs: ['加密', '解密'].map((label) => ({ key: label, label })),
    options: [
      select('mode', '模式', 'GCM', ['GCM', 'CBC', 'CTR']),
      select('keyLength', 'Key长度', '256', ['128', '192', '256'], { tabs: ['加密'] }),
      select('outputEncoding', '输出编码', 'Base64', ['Base64', 'Hex']),
      text('key', 'Key', '', 'Base64；加密为空则自动生成'),
      text('iv', 'IV/Nonce', '', 'Base64；加密为空则自动生成'),
    ],
    sample: 'GMKit Studio',
    tags: ['webcrypto'],
  },
  {
    id: 'rsa',
    name: 'RSA',
    short: 'RSA',
    category: 'crypto',
    tone: 'purple',
    description: 'Web Crypto RSA-OAEP 与 RSA-PSS。',
    tabs: ['生成密钥', '加密', '解密', '签名', '验签'].map((label) => ({ key: label, label })),
    options: [
      select('usage', '用途', 'OAEP 加解密', ['OAEP 加解密', 'PSS 签名验签'], { tabs: ['生成密钥'] }),
      select('hash', '哈希', 'SHA-256', ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']),
      select('keyLength', 'Key长度', '2048', ['2048', '3072', '4096'], { tabs: ['生成密钥'] }),
      number('saltLength', 'PSS Salt长度', '32', undefined, { tabs: ['签名', '验签'] }),
    ],
    sample: 'GMKit Studio',
    tags: ['webcrypto', 'pem'],
  },
  {
    id: 'des3',
    name: '3DES',
    short: '3D',
    category: 'crypto',
    tone: 'orange',
    description: 'node-forge Triple DES CBC 加密解密。',
    tabs: ['加密', '解密'].map((label) => ({ key: label, label })),
    options: [select('outputEncoding', '输出编码', 'Base64', ['Base64', 'Hex']), text('key', 'Key', '', '24 bytes'), text('iv', 'IV', '', '8 bytes')],
    sample: 'GMKit Studio',
    tags: ['legacy', 'forge'],
  },
  {
    id: 'pbkdf2',
    name: 'PBKDF2',
    short: 'PB',
    category: 'crypto',
    tone: 'cyan',
    description: 'Web Crypto PBKDF2 密钥派生。',
    tabs: [{ key: '派生', label: '派生' }],
    options: [select('hash', '哈希', 'SHA-256', ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']), number('iterations', '迭代', '100000'), number('length', '长度', '32'), text('salt', 'Salt', 'gmkit-salt')],
    sample: 'correct horse battery staple',
    tags: ['kdf'],
  },
  ...[
    ['sm3', 'SM3', 'S3', 'blue', 'SM3 摘要与 HMAC。'],
    ['md5', 'MD5', 'M5', 'red', 'MD5 摘要。'],
    ['sha1', 'SHA1', 'S1', 'blue', 'SHA-1 摘要与 HMAC。'],
    ['sha256', 'SHA256', 'S2', 'green', 'SHA-256 摘要与 HMAC。'],
    ['sha512', 'SHA512', 'S5', 'purple', 'SHA-512 摘要与 HMAC。'],
    ['hmac', 'HMAC', 'HM', 'cyan', 'HMAC 多算法计算。'],
    ['crc32', 'CRC32', 'C32', 'orange', 'CRC32 校验值。'],
    ['bcrypt', 'bcrypt', 'BC', 'orange', 'bcrypt 生成与校验。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'hash' as const,
    tone: tone as ToolTone,
    description,
    tabs: id === 'bcrypt' ? [{ key: '生成', label: '生成' }, { key: '校验', label: '校验' }] : [{ key: '摘要', label: '摘要' }, { key: 'HMAC', label: 'HMAC' }],
    options: id === 'bcrypt'
      ? [number('cost', 'Cost', '12', undefined, { tabs: ['生成'] }), text('compare', '校验值', '', 'bcrypt hash', { tabs: ['校验'] })]
      : hashOptions,
    sample: 'GMKit Studio',
    tags: ['digest'],
  })),
  ...[
    ['keygen', '密钥生成', 'Key', 'purple', '生成 SM2/RSA/AES/SM4 等密钥材料。'],
    ['cert', '证书解析', 'CRT', 'blue', '解析 X.509 证书信息。'],
    ['csr', 'CSR生成', 'CSR', 'cyan', '生成和解析 CSR。'],
    ['pemder', 'PEM/DER', 'PEM', 'orange', 'PEM 与 DER 转换。'],
    ['jwk', 'JWK转换', 'JWK', 'green', 'JWK 与 PEM/JSON 转换边界。'],
    ['sshkey', 'SSH Key', 'SSH', 'purple', 'SSH key 基础生成入口。'],
    ['pfx', 'P12/PFX', 'P12', 'red', 'P12/PFX 解析边界。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'keycert' as const,
    tone: tone as ToolTone,
    description,
    tabs: ['生成', '解析', '转换'].map((label) => ({ key: label, label })),
    options: id === 'keygen'
      ? [select('type', '类型', 'SM2', ['SM2', 'RSA', 'AES', 'SM4', '3DES'])]
      : id === 'pemder'
        ? [select('pemLabel', 'PEM标签', 'CERTIFICATE', ['CERTIFICATE', 'PUBLIC KEY', 'PRIVATE KEY', 'CERTIFICATE REQUEST'])]
        : id === 'pfx'
          ? [text('password', '密码', '', 'P12/PFX 密码', { inputMode: 'password' })]
          : [],
    sample: 'GMKit Studio',
    tags: ['key', 'certificate'],
  })),
  ...[
    ['base64', 'Base64', '64', 'blue', 'Base64 编码与解码。'],
    ['url', 'URL编码', 'URL', 'cyan', 'URL encode/decode。'],
    ['hex', 'Hex', 'HEX', 'orange', 'Hex 编码与解码。'],
    ['unicode', 'Unicode', 'UNI', 'purple', 'Unicode 转义与反转义。'],
    ['htmlentity', 'HTML实体', 'HT', 'green', 'HTML entity 编码与解码。'],
    ['jwt', 'JWT解析', 'JWT', 'green', 'JWT 解析、生成与 HS 验签。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'encoding' as const,
    tone: tone as ToolTone,
    description,
    tabs: id === 'jwt' ? ['解析', '生成', '验签'].map((label) => ({ key: label, label })) : ['编码', '解码'].map((label) => ({ key: label, label })),
    options: id === 'jwt'
      ? [
          select('algorithm', '算法', 'HS256', ['HS256', 'HS384', 'HS512'], { tabs: ['生成', '验签'] }),
          text('secret', 'Secret', 'gmkit-secret', 'JWT HMAC 密钥', { tabs: ['生成', '验签'], inputMode: 'password' }),
        ]
      : id === 'base64'
        ? [select('variant', '变体', 'Standard', ['Standard', 'URL Safe'])]
        : [],
    sample: id === 'jwt' ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiR01LaXQifQ.DUMMY' : 'GMKit Studio',
    tags: ['encoding'],
  })),
  ...[
    ['json', 'JSON格式化', '{}', 'green', 'JSON 格式化、压缩、修复、查询与 Schema。'],
    ['yaml', 'YAML转换', 'YML', 'purple', 'YAML 与 JSON 互转。'],
    ['toml', 'TOML转换', 'TOM', 'orange', 'TOML 与 JSON 互转。'],
    ['jsonpath', 'JSONPath', 'JP', 'cyan', 'JSONPath 查询。'],
    ['jsonschema', 'Schema', 'SCH', 'red', 'JSON Schema 校验。'],
    ['jsontots', 'JSON转TS', 'TS', 'blue', '从 JSON 生成 TypeScript 接口。'],
    ['random', '随机数据', 'RND', 'cyan', '随机字符串、数字和字节。'],
    ['mock', 'Mock数据', 'MK', 'purple', '使用 faker 生成 Mock 数据。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'data' as const,
    tone: tone as ToolTone,
    description,
    tabs: id === 'json' ? ['格式化', '压缩', '校验', '修复', '查询', 'Schema', '树'].map((label) => ({ key: label, label })) : ['转换', '生成', '校验'].map((label) => ({ key: label, label })),
    options: id === 'jsonpath'
      ? [text('query', 'JSONPath', '$.data[*]')]
      : id === 'jsonschema'
        ? [text('query', 'Schema', '{}', 'JSON Schema')]
        : id === 'random' || id === 'mock'
          ? [number('count', '数量', '5'), number('length', '长度', '16', undefined, { tabs: ['生成'] })]
          : [],
    sample: '{\n  "name": "GMKit",\n  "stars": 1250,\n  "data": [{ "id": 1 }]\n}',
    tags: ['json', 'data'],
  })),
  ...[
    ['timestamp', '时间戳', 'TS', 'blue', '时间戳与日期互转。'],
    ['uuid', 'UUID', 'UID', 'purple', 'UUID 生成与校验。'],
    ['ulid', 'ULID', 'UL', 'green', 'ULID 生成与解析。'],
    ['snowflake', '雪花ID', 'SN', 'cyan', 'Snowflake ID 生成与解析。'],
    ['cron', 'Cron', 'CR', 'orange', 'Cron 表达式解析。'],
    ['timezone', '时区转换', 'TZ', 'blue', '时区转换。'],
    ['datecalc', '日期计算', 'DC', 'purple', '日期差值与加减。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'time' as const,
    tone: tone as ToolTone,
    description,
    tabs: ['转换', '当前', '生成', '解析'].map((label) => ({ key: label, label })),
    options: id === 'timezone'
      ? [select('timezone', '时区', 'Asia/Shanghai', ['本地', 'UTC', 'Asia/Shanghai', 'Asia/Seoul'])]
      : id === 'uuid' || id === 'ulid' || id === 'cron'
        ? [number('count', '数量', '5')]
        : [],
    sample: String(Date.now()),
    tags: ['time'],
  })),
  ...[
    ['diff', '文本Diff', 'DF', 'red', '文本 Diff。'],
    ['regex', '正则测试', 'RE', 'purple', '正则匹配与替换。'],
    ['case', '大小写', 'Aa', 'blue', '命名风格转换。'],
    ['slug', 'Slug', 'SL', 'orange', 'Slug 生成。'],
    ['markdown', 'Markdown', 'MD', 'cyan', 'Markdown 转 HTML。'],
    ['textstat', '文本统计', 'ST', 'green', '文本统计。'],
    ['dedupe', '去重排序', 'DU', 'purple', '按行去重和排序。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'text' as const,
    tone: tone as ToolTone,
    description,
    tabs: ['转换', '校验', '统计'].map((label) => ({ key: label, label })),
    options: id === 'diff'
      ? [select('mode', '模式', '行', ['行', '词', '字符'])]
      : id === 'regex'
        ? [text('query', '表达式', '\\w+'), text('flags', 'Flags', 'gmi')]
        : [],
    sample: id === 'diff' ? 'left\n---\nright' : 'gmkit studio clean redesign',
    tags: ['text'],
  })),
  ...[
    ['urlparse', 'URL解析', 'UP', 'cyan', 'URL 解析与拼接。'],
    ['httpstatus', 'HTTP状态', 'HTTP', 'blue', 'HTTP 状态码查询。'],
    ['ua', 'UA解析', 'UA', 'purple', 'User-Agent 解析。'],
    ['cidr', 'CIDR', 'CIDR', 'green', 'CIDR 网段计算。'],
    ['dns', 'DNS查询', 'DNS', 'orange', 'DNS over HTTPS 查询。'],
    ['ipinfo', 'IP信息', 'IP', 'red', '公网 IP 信息查询。'],
    ['curl', 'cURL转换', 'cURL', 'cyan', 'cURL 转 Fetch/Axios/Java。'],
  ].map(([id, name, short, tone, description]) => ({
    id,
    name,
    short,
    category: 'network' as const,
    tone: tone as ToolTone,
    description,
    tabs: ['解析', '查询', '转换'].map((label) => ({ key: label, label })),
    options: id === 'curl'
      ? [select('target', '目标', 'Fetch', ['Fetch', 'Axios', 'Java', 'JSON'])]
      : id === 'dns'
        ? [select('dnsType', 'DNS类型', 'A', ['A', 'AAAA', 'CNAME', 'MX', 'TXT'])]
        : id === 'ipinfo'
          ? [text('apiEndpoint', 'API Endpoint', '', '为空则使用 ipapi.co')]
          : [],
    sample: id === 'curl' ? "curl -X POST https://api.example.com -H 'Content-Type: application/json' -d '{\"name\":\"GMKit\"}'" : 'https://gmkit.example/tools?name=国密工具',
    tags: ['network'],
  })),
];

export const commonToolIds = ['sm2', 'sm3', 'sm4', 'json', 'base64', 'uuid', 'timestamp', 'jwt'];

export function getCategory(id: ToolCategoryId | string | undefined): ToolCategory {
  return categories.find((category) => category.id === id) ?? categories[0];
}

export function getTool(id: string | undefined): StudioTool | undefined {
  return tools.find((tool) => tool.id === id);
}

export function searchTools(query: string, categoryId: ToolCategoryId = 'home'): StudioTool[] {
  const keyword = query.trim().toLowerCase();
  return tools.filter((tool) => {
    const inCategory = categoryId === 'home' || tool.category === categoryId;
    const haystack = [tool.id, tool.name, tool.short, tool.description, tool.category, ...(tool.tags ?? [])]
      .join(' ')
      .toLowerCase();
    return inCategory && (!keyword || haystack.includes(keyword));
  });
}

export function isToolCategoryId(value: unknown): value is ToolCategoryId {
  return typeof value === 'string' && categories.some((category) => category.id === value);
}
