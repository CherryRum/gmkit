import type { NavTone } from './navigation';

export type ToolKey =
  | 'sm2'
  | 'sm3'
  | 'sm4'
  | 'zuc'
  | 'sm9'
  | 'key'
  | 'cert'
  | 'encoding'
  | 'api-playground'
  | 'data';

export interface ToolField {
  name: string;
  label: string;
  kind: 'textarea' | 'input' | 'select';
  placeholder?: string;
  value?: string;
  options?: string[];
}

export interface ToolTab {
  key: string;
  label: string;
  description: string;
  fields: ToolField[];
  actions: string[];
}

export interface InfoCard {
  title: string;
  body: string;
  items?: string[];
}

export interface RelatedTool {
  label: string;
  description: string;
  to: string;
  icon: string;
  tone: NavTone;
}

export interface ToolDefinition {
  key: ToolKey;
  path: string;
  title: string;
  category: string;
  subtitle: string;
  badge: string;
  icon: string;
  tone: NavTone;
  tabs: ToolTab[];
  infoCards: InfoCard[];
  codeExamples: Record<'ts' | 'java' | 'curl', string>;
  related: RelatedTool[];
  status?: string;
}

const commonRelated: RelatedTool[] = [
  { label: 'SM2 工具', description: '公钥加密与签名验签', to: '/tools/sm2', icon: 'S2', tone: 'green' },
  { label: 'SM3 工具', description: '摘要与 HMAC', to: '/tools/sm3', icon: 'S3', tone: 'blue' },
  { label: 'SM4 工具', description: '对称加解密', to: '/tools/sm4', icon: 'S4', tone: 'orange' },
  { label: 'API Playground', description: '接口联调模板', to: '/tools/api-playground', icon: 'AP', tone: 'cyan' },
];

export const tools: ToolDefinition[] = [
  {
    key: 'sm2',
    path: '/tools/sm2',
    title: 'SM2 工作台',
    category: '加密解密',
    subtitle: '椭圆曲线公钥密码算法，覆盖加密解密、签名验签和密钥生成。',
    badge: 'Browser gmkitx',
    icon: 'S2',
    tone: 'green',
    tabs: [
      {
        key: 'encrypt',
        label: '加密解密',
        description: '使用 SM2 公钥加密、私钥解密，支持 C1C3C2 / C1C2C3 边界展示。',
        fields: [
          { name: 'publicKey', label: '公钥', kind: 'textarea', placeholder: '粘贴 SM2 公钥 Hex' },
          { name: 'privateKey', label: '私钥', kind: 'textarea', placeholder: '解密时填写私钥 Hex' },
          { name: 'message', label: '明文 / 密文', kind: 'textarea', placeholder: '输入文本或密文 Hex' },
          { name: 'cipherMode', label: '密文模式', kind: 'select', options: ['C1C3C2', 'C1C2C3'] },
        ],
        actions: ['加密', '解密', '填入示例', '清空'],
      },
      {
        key: 'sign',
        label: '签名验签',
        description: '固定 userId 与签名格式，便于 Java / TS 互操作验证。',
        fields: [
          { name: 'privateKey', label: '签名私钥', kind: 'textarea', placeholder: 'SM2 私钥 Hex' },
          { name: 'publicKey', label: '验签公钥', kind: 'textarea', placeholder: 'SM2 公钥 Hex' },
          { name: 'message', label: '消息', kind: 'textarea', placeholder: '待签名消息' },
          { name: 'userId', label: 'User ID', kind: 'input', value: '1234567812345678' },
        ],
        actions: ['签名', '验签', '复制结果'],
      },
      {
        key: 'keys',
        label: '密钥生成',
        description: '生成 SM2 公私钥对，并展示压缩公钥入口。',
        fields: [{ name: 'format', label: '输出格式', kind: 'select', options: ['Hex', 'Base64'] }],
        actions: ['生成密钥对', '压缩公钥', '复制结果'],
      },
    ],
    infoCards: [
      { title: '互操作边界', body: '跨语言验证时需要固定 userId、密文模式和签名格式。' },
      { title: '适用场景', body: '适合接口调试、测试向量生成、证书链路前置验证。' },
    ],
    codeExamples: {
      ts: "import { sm2Encrypt } from 'gmkitx';\nconst cipher = sm2Encrypt(publicKey, message);",
      java: 'SM2.encrypt(publicKey, messageBytes);',
      curl: 'curl -X POST /api/sm2/encrypt -d \'{"message":"hello"}\'',
    },
    related: commonRelated,
  },
  {
    key: 'sm3',
    path: '/tools/sm3',
    title: 'SM3 / SHA 摘要工作台',
    category: '摘要哈希',
    subtitle: '计算 SM3、HMAC-SM3 与 SHA 系列摘要，适合接口签名和数据完整性校验。',
    badge: 'Browser gmkitx',
    icon: 'S3',
    tone: 'blue',
    tabs: [
      {
        key: 'digest',
        label: '摘要',
        description: '对文本或 Hex 输入计算摘要。',
        fields: [
          { name: 'algorithm', label: '算法', kind: 'select', options: ['SM3', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] },
          { name: 'message', label: '输入', kind: 'textarea', placeholder: '输入待摘要文本' },
        ],
        actions: ['计算摘要', '填入示例', '复制结果'],
      },
      {
        key: 'hmac',
        label: 'HMAC',
        description: '计算 HMAC-SM3 / HMAC-SHA。',
        fields: [
          { name: 'algorithm', label: '算法', kind: 'select', options: ['HMAC-SM3', 'HMAC-SHA256', 'HMAC-SHA384', 'HMAC-SHA512'] },
          { name: 'key', label: 'Key', kind: 'input', placeholder: '输入 HMAC key' },
          { name: 'message', label: '消息', kind: 'textarea', placeholder: '输入消息' },
        ],
        actions: ['计算 HMAC', '清空'],
      },
      {
        key: 'file',
        label: '文件摘要',
        description: '文件拖拽入口占位，后续可接浏览器 File API。',
        fields: [{ name: 'file', label: '文件', kind: 'input', placeholder: '选择文件占位' }],
        actions: ['选择文件', '计算摘要'],
      },
    ],
    infoCards: [
      { title: '输出格式', body: '当前工具默认输出 Hex，后续可切换 Base64。' },
      { title: 'SHA-1 提示', body: 'SHA-1 仅用于兼容旧系统，不建议用于新安全场景。' },
    ],
    codeExamples: {
      ts: "import { sm3Digest, sha256 } from 'gmkitx';\nconst digest = sm3Digest('hello');",
      java: 'MessageDigest.getInstance("SM3");',
      curl: 'curl -X POST /api/digest -d \'{"algorithm":"SM3"}\'',
    },
    related: commonRelated,
  },
  {
    key: 'sm4',
    path: '/tools/sm4',
    title: 'SM4 对称加密工作台',
    category: '加密解密',
    subtitle: '覆盖 ECB / CBC / CTR / CFB / OFB，加密模式、填充和 IV 参数统一管理。',
    badge: 'Browser gmkitx',
    icon: 'S4',
    tone: 'orange',
    tabs: [
      {
        key: 'cipher',
        label: '加密解密',
        description: '输入 key、iv 和模式后执行 SM4 加解密。',
        fields: [
          { name: 'mode', label: '模式', kind: 'select', options: ['ECB', 'CBC', 'CTR', 'CFB', 'OFB'] },
          { name: 'key', label: 'Key', kind: 'input', placeholder: '16 bytes key / 32 hex chars' },
          { name: 'iv', label: 'IV', kind: 'input', placeholder: '非 ECB 模式必填' },
          { name: 'message', label: '输入', kind: 'textarea', placeholder: '输入明文或密文' },
        ],
        actions: ['加密', '解密', '生成 Key/IV'],
      },
      {
        key: 'params',
        label: '模式参数',
        description: '展示模式、填充、输出格式之间的边界关系。',
        fields: [
          { name: 'padding', label: '填充', kind: 'select', options: ['PKCS7', 'NoPadding'] },
          { name: 'output', label: '输出', kind: 'select', options: ['Hex', 'Base64'] },
        ],
        actions: ['应用参数'],
      },
      {
        key: 'aead',
        label: 'AEAD 占位',
        description: 'GCM / CCM 的 AAD 与 tag 长度后续按库能力继续完善。',
        fields: [{ name: 'aad', label: 'AAD', kind: 'textarea', placeholder: '附加认证数据' }],
        actions: ['生成请求模板'],
      },
    ],
    infoCards: [
      { title: '参数提示', body: 'CBC/CTR/CFB/OFB 需要 IV；ECB 不需要 IV。' },
      { title: '安全建议', body: '生产场景避免重复使用 key/iv 组合。' },
    ],
    codeExamples: {
      ts: "import { sm4Encrypt } from 'gmkitx';\nconst cipher = sm4Encrypt(key, plaintext, { mode: 'CBC', iv });",
      java: 'SM4.encrypt(key, plaintext, options);',
      curl: 'curl -X POST /api/sm4/encrypt -d \'{"mode":"CBC"}\'',
    },
    related: commonRelated,
  },
  {
    key: 'zuc',
    path: '/tools/zuc',
    title: 'ZUC 流密码工作台',
    category: '加密解密',
    subtitle: '生成 ZUC-128 密钥流，提供 EEA3 / EIA3 移动通信算法入口。',
    badge: 'Browser gmkitx',
    icon: 'ZU',
    tone: 'cyan',
    tabs: [
      {
        key: 'keystream',
        label: '密钥流',
        description: '输入 16 字节 key/iv 生成密钥流。',
        fields: [
          { name: 'key', label: 'Key', kind: 'input', placeholder: '32 hex chars' },
          { name: 'iv', label: 'IV', kind: 'input', placeholder: '32 hex chars' },
          { name: 'length', label: '长度', kind: 'input', value: '32' },
        ],
        actions: ['生成密钥流', '填入示例'],
      },
      {
        key: 'cipher',
        label: '流加密',
        description: '使用 ZUC 密钥流对输入执行 XOR 流加密。',
        fields: [
          { name: 'key', label: 'Key', kind: 'input', placeholder: '32 hex chars' },
          { name: 'iv', label: 'IV', kind: 'input', placeholder: '32 hex chars' },
          { name: 'message', label: '输入', kind: 'textarea', placeholder: '明文或密文' },
        ],
        actions: ['加密', '解密'],
      },
      {
        key: 'lte',
        label: 'EEA3 / EIA3',
        description: '展示 count、bearer、direction 等 LTE 参数。',
        fields: [
          { name: 'count', label: 'COUNT', kind: 'input', placeholder: '32-bit unsigned' },
          { name: 'bearer', label: 'BEARER', kind: 'input', placeholder: '0-31' },
          { name: 'direction', label: 'Direction', kind: 'select', options: ['0', '1'] },
          { name: 'message', label: '消息', kind: 'textarea', placeholder: 'Hex payload' },
        ],
        actions: ['运行 EEA3', '运行 EIA3'],
      },
    ],
    infoCards: [
      { title: '支持范围', body: '当前展示 ZUC-128、EEA3、EIA3；不包含 ZUC-256。' },
      { title: '输入边界', body: 'key 和 iv 均为 16 字节，建议以 Hex 输入。' },
    ],
    codeExamples: {
      ts: "import { zucKeystream } from 'gmkitx';\nconst stream = zucKeystream(key, iv, 32);",
      java: 'ZUC.generateKeystream(key, iv, 32);',
      curl: 'curl -X POST /api/zuc/keystream',
    },
    related: commonRelated,
  },
  {
    key: 'sm9',
    path: '/tools/sm9',
    title: 'SM9 Runtime 工作台',
    category: '加密解密',
    subtitle: 'SM9 不在 TS 包内实现，前端通过 Java API 或 WASM runtime 接入。',
    badge: 'Java API / WASM',
    icon: 'S9',
    tone: 'purple',
    tabs: [
      {
        key: 'java-api',
        label: 'Java API',
        description: '配置 Java 服务 endpoint，预览请求体和响应。',
        fields: [
          { name: 'endpoint', label: 'Endpoint', kind: 'input', placeholder: 'http://localhost:8080/api/sm9' },
          { name: 'operation', label: '操作', kind: 'select', options: ['sign', 'verify', 'encrypt', 'decrypt', 'generateMasterKey'] },
          { name: 'payload', label: '请求体', kind: 'textarea', placeholder: 'JSON payload' },
        ],
        actions: ['生成请求', '发送请求'],
      },
      {
        key: 'wasm',
        label: 'WASM Runtime',
        description: '预留浏览器本地 runtime 加载与状态检查。',
        fields: [
          { name: 'wasmUrl', label: 'WASM URL', kind: 'input', placeholder: '/runtime/sm9.wasm' },
          { name: 'payload', label: '输入', kind: 'textarea', placeholder: 'runtime payload' },
        ],
        actions: ['加载 Runtime', '执行操作'],
      },
      {
        key: 'capability',
        label: '能力说明',
        description: '说明 Java 与前端边界，避免误导为 TS 内置。',
        fields: [{ name: 'note', label: '说明', kind: 'textarea', value: 'TS 包不包含 SM9。' }],
        actions: ['复制说明'],
      },
    ],
    infoCards: [
      { title: '明确边界', body: 'SM9 由 Java 模块或 WASM runtime 提供，前端只做接入编排。' },
      { title: '当前状态', body: '未配置 endpoint 或 WASM 时，不会假装计算成功。' },
    ],
    codeExamples: {
      ts: "const runtime = createSm9Runtime({ kind: 'java-api', endpoint });",
      java: 'cn.gmkit.sm9.SM9.sign(masterKey, userId, message);',
      curl: 'curl -X POST http://localhost:8080/api/sm9/sign',
    },
    related: commonRelated,
  },
  {
    key: 'key',
    path: '/tools/key',
    title: '密钥工具',
    category: '密钥与证书',
    subtitle: '生成 SM2 密钥对、SM4 key/iv 和随机字节材料。',
    badge: 'Browser utility',
    icon: '钥',
    tone: 'purple',
    tabs: [
      {
        key: 'generate',
        label: '密钥生成',
        description: '选择密钥类型并生成对应材料。',
        fields: [
          { name: 'type', label: '类型', kind: 'select', options: ['SM2 密钥对', 'SM4 Key', '随机字节'] },
          { name: 'format', label: '格式', kind: 'select', options: ['Hex', 'Base64'] },
        ],
        actions: ['生成', '复制结果'],
      },
      {
        key: 'random',
        label: '随机材料',
        description: '生成指定长度的随机 Hex/Base64。',
        fields: [{ name: 'length', label: '字节数', kind: 'input', value: '16' }],
        actions: ['生成随机值'],
      },
    ],
    infoCards: [{ title: '安全提示', body: '正式密钥建议在本地生成并立即安全保存。' }],
    codeExamples: {
      ts: "import { sm2GenerateKeyPair, getRandomBytes } from 'gmkitx';",
      java: 'KeyPair keyPair = SM2.generateKeyPair();',
      curl: 'curl -X POST /api/key/generate',
    },
    related: commonRelated,
  },
  {
    key: 'cert',
    path: '/tools/cert',
    title: '证书工具',
    category: '密钥与证书',
    subtitle: '证书解析、CSR 查看和 PEM/DER 格式转换的产品入口。',
    badge: 'Prototype',
    icon: '证',
    tone: 'purple',
    tabs: [
      {
        key: 'parse',
        label: '证书解析',
        description: '粘贴 PEM/DER 内容，展示结构化解析结果。',
        fields: [{ name: 'cert', label: '证书内容', kind: 'textarea', placeholder: '-----BEGIN CERTIFICATE-----' }],
        actions: ['解析证书', '复制 JSON'],
      },
      {
        key: 'csr',
        label: 'CSR 查看',
        description: '查看 CSR 主体、扩展项和签名算法。',
        fields: [{ name: 'csr', label: 'CSR 内容', kind: 'textarea', placeholder: '-----BEGIN CERTIFICATE REQUEST-----' }],
        actions: ['查看 CSR'],
      },
    ],
    infoCards: [{ title: '后续接入', body: '解析可后续接 Java API 或 WebCrypto/ASN.1 parser。' }],
    codeExamples: {
      ts: '// certificate parser runtime placeholder',
      java: 'CertificateFactory.getInstance("X.509");',
      curl: 'curl -X POST /api/cert/parse',
    },
    related: commonRelated,
  },
  {
    key: 'encoding',
    path: '/tools/encoding',
    title: '编码转换',
    category: '编码转换',
    subtitle: 'UTF-8、Hex、Base64、URL 编码互转。',
    badge: 'Browser utility',
    icon: '编',
    tone: 'orange',
    tabs: [
      {
        key: 'convert',
        label: '编码互转',
        description: '选择输入输出格式后转换。',
        fields: [
          { name: 'from', label: '输入格式', kind: 'select', options: ['UTF-8', 'Hex', 'Base64', 'URL'] },
          { name: 'to', label: '输出格式', kind: 'select', options: ['UTF-8', 'Hex', 'Base64', 'URL'] },
          { name: 'value', label: '内容', kind: 'textarea', placeholder: '输入待转换内容' },
        ],
        actions: ['转换', '交换格式', '清空'],
      },
    ],
    infoCards: [{ title: '调试场景', body: '适合处理接口签名、密文传输和 URL 参数编码问题。' }],
    codeExamples: {
      ts: "import { bytesToHex, stringToBytes } from 'gmkitx';",
      java: 'HexFormat.of().formatHex(bytes);',
      curl: 'curl -X POST /api/encoding/convert',
    },
    related: commonRelated,
  },
  {
    key: 'api-playground',
    path: '/tools/api-playground',
    title: 'API Playground',
    category: '开发调试',
    subtitle: '统一调试 Java API、前端工具和未来 WASM runtime。',
    badge: 'Mock ready',
    icon: 'AP',
    tone: 'cyan',
    tabs: [
      {
        key: 'request',
        label: '请求调试',
        description: '配置环境、接口路径和请求体。',
        fields: [
          { name: 'environment', label: '环境', kind: 'select', options: ['Local', 'Dev', 'Mock'] },
          { name: 'path', label: '路径', kind: 'input', placeholder: '/api/sm2/encrypt' },
          { name: 'body', label: '请求体', kind: 'textarea', placeholder: '{ "message": "hello" }' },
        ],
        actions: ['发送请求', '生成 curl', '保存模板'],
      },
      {
        key: 'history',
        label: '请求历史',
        description: '展示最近请求和响应摘要。',
        fields: [{ name: 'filter', label: '过滤', kind: 'input', placeholder: '按算法或路径过滤' }],
        actions: ['清空历史'],
      },
    ],
    infoCards: [{ title: '联动建议', body: '算法页可以将当前参数导入 Playground 生成 API 请求。' }],
    codeExamples: {
      ts: 'await fetch(endpoint, { method: "POST", body: JSON.stringify(payload) });',
      java: 'ApiResponse rsp = client.execute(req);',
      curl: 'curl -X POST http://localhost:8080/api/sm2/encrypt',
    },
    related: commonRelated,
  },
  {
    key: 'data',
    path: '/tools/data',
    title: '数据与生成',
    category: '数据与生成',
    subtitle: 'JSON 格式化、UUID、时间戳和随机字符串生成。',
    badge: 'Browser utility',
    icon: '数',
    tone: 'slate',
    tabs: [
      {
        key: 'json',
        label: 'JSON 工具',
        description: '格式化、压缩和校验 JSON。',
        fields: [{ name: 'json', label: 'JSON', kind: 'textarea', placeholder: '{ "hello": "gmkit" }' }],
        actions: ['格式化', '压缩', '校验'],
      },
      {
        key: 'generate',
        label: '数据生成',
        description: '生成 UUID、时间戳和随机字符串。',
        fields: [{ name: 'kind', label: '类型', kind: 'select', options: ['UUID', '时间戳', '随机字符串'] }],
        actions: ['生成'],
      },
    ],
    infoCards: [{ title: '辅助定位', body: '这些工具服务于接口调试和测试数据准备。' }],
    codeExamples: {
      ts: 'crypto.randomUUID();',
      java: 'UUID.randomUUID().toString();',
      curl: 'curl -X POST /api/data/generate',
    },
    related: commonRelated,
  },
];

export const toolMap = new Map<ToolKey, ToolDefinition>(tools.map((tool) => [tool.key, tool]));

export function getTool(key: ToolKey): ToolDefinition {
  const tool = toolMap.get(key);
  if (!tool) {
    throw new Error(`Unknown tool: ${key}`);
  }
  return tool;
}
