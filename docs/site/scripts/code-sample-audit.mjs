import path from 'node:path';

const AUDITED_LANGUAGES = new Set([
  'ts',
  'typescript',
  'js',
  'javascript',
  'java',
  'go',
  'python',
  'rust',
]);

const SEMANTIC_RULES = [
  { call: /\b[\w$]*encrypt[\w$]*\s*\(/i, explanation: '加密', label: 'encrypt 调用' },
  { call: /\b[\w$]*decrypt[\w$]*\s*\(/i, explanation: '解密', label: 'decrypt 调用' },
  { call: /\b[\w$]*sign[\w$]*\s*\(/i, explanation: '签名', label: 'sign 调用' },
  { call: /\b[\w$]*verify[\w$]*\s*\(/i, explanation: '验签', label: 'verify 调用' },
  { call: /\b[\w$]*digest[\w$]*\s*\(/i, explanation: '摘要', label: 'digest 调用' },
  { call: /\b[\w$]*hmac[\w$]*\s*\(/i, explanation: 'HMAC', label: 'HMAC 调用' },
  { call: /\b[\w$]*keystream[\w$]*\s*\(/i, explanation: '密钥流', label: '密钥流调用' },
  { call: /\beia3\s*\(/i, explanation: '完整性', label: 'EIA3 调用' },
];

function decodeAttribute(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function parseAttributes(source) {
  const attributes = new Map();
  for (const match of source.matchAll(/([a-z][a-z0-9-]*)="([^"]*)"/gi)) {
    attributes.set(match[1], decodeAttribute(match[2]));
  }
  return attributes;
}

function previousNonBlankLine(content, offset) {
  const lines = content.slice(0, offset).trimEnd().split(/\r?\n/);
  return lines.at(-1)?.trim() ?? '';
}

function lineNumberAt(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

function numberedComments(code) {
  return [...code.matchAll(/^\s*(?:\/\/|#)\s*(\d+)\.\s*(.+?)\s*$/gm)].map((match) => ({
    number: Number(match[1]),
    text: match[2].trim(),
  }));
}

function includedRegion(code) {
  const match = code.match(/<!--\s*@include:\s+([^#\s]+)#([A-Za-z0-9_-]+)\s*-->/);
  return match ? { includePath: match[1], region: match[2] } : null;
}

export function extractRegion(source, region) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(`#region ${region}`));
  const end = lines.findIndex((line, index) => index > start && line.includes(`#endregion ${region}`));
  if (start < 0 || end < 0) return null;
  return lines.slice(start + 1, end).join('\n');
}

function looksExecutable(code) {
  return [
    /^\s*(?:const|let|var)\s+[\w$]+[^\n=]*=/m,
    /^\s*let\s+(?:mut\s+)?[\w$]+\s*=/m,
    /^\s*[\w$]+\s*:=/m,
    /^\s*(?:if|try|throw|assert|panic|raise)\b/m,
    /^\s*(?:assert\w*|panic)\s*!?\s*\(/m,
    /^\s*(?:await\s+)?[a-z_$][\w$]*\s*\([^\n;]*\)\s*;/m,
    /^\s*(?:await\s+)?[\w$]+(?:\.[\w$]+)+\s*\([^\n;]*\)\s*;/m,
    /^\s*(?!public\b|private\b|protected\b|static\b|final\b)(?:[A-Z][\w$<>, ?\[\].]*\s+)+[a-z_$][\w$]*\s*=\s*(?:new\s+|[\w$]+\.)/m,
  ].some((pattern) => pattern.test(code));
}

function checkSemanticComments(code, comments, location, failures) {
  const commentText = comments.map(({ text }) => text).join('\n');
  for (const rule of SEMANTIC_RULES) {
    if (rule.call.test(code) && !commentText.includes(rule.explanation)) {
      failures.push(`${location}: ${rule.label}缺少“${rule.explanation}”步骤注释`);
    }
  }
}

/**
 * 检查一个 Markdown 页面中的调用样例分类、步骤元数据和真实 include 区域。
 */
export async function auditCodeSamples({
  file,
  displayPath = file,
  content,
  readSource,
  seenSampleIds = new Map(),
}) {
  const failures = [];
  const fencePattern = /^```([^\n]*)\n([\s\S]*?)^```\s*$/gm;

  for (const match of content.matchAll(fencePattern)) {
    const language = match[1].trim().split(/\s+/)[0];
    if (!AUDITED_LANGUAGES.has(language)) continue;

    const line = lineNumberAt(content, match.index);
    const location = `${displayPath}:${line}`;
    const marker = previousNonBlankLine(content, match.index);
    const code = match[2];

    if (marker === '<!-- code-reference -->') {
      if (numberedComments(code).length > 0) {
        failures.push(`${location}: 含编号步骤的代码块不能标为接口参考`);
      }
      if (looksExecutable(code)) {
        failures.push(`${location}: 接口参考中出现实际调用，请改为调用样例并补齐步骤`);
      }
      continue;
    }

    const sampleMarker = marker.match(/^<!--\s+code-sample\s+(.+?)\s+-->$/);
    if (!sampleMarker) {
      failures.push(`${location}: ${language} 代码块未标记为 code-sample 或 code-reference`);
      continue;
    }

    const attributes = parseAttributes(sampleMarker[1]);
    const id = attributes.get('id');
    const declaredSteps = (attributes.get('steps') ?? '').split('|').map((step) => step.trim()).filter(Boolean);
    if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      failures.push(`${location}: code-sample id 缺失或格式不合法`);
    } else if (seenSampleIds.has(id)) {
      failures.push(`${location}: code-sample id 重复 ${id}，首次出现在 ${seenSampleIds.get(id)}`);
    } else {
      seenSampleIds.set(id, location);
    }
    if (declaredSteps.length === 0) failures.push(`${location}: code-sample steps 不能为空`);
    for (const step of declaredSteps) {
      if (!/[\u3400-\u9fff]/u.test(step)) failures.push(`${location}: 步骤“${step}”必须包含中文动作说明`);
    }

    let auditedCode = code;
    const include = includedRegion(code);
    if (include) {
      try {
        const sourcePath = path.resolve(path.dirname(file), include.includePath);
        const source = await readSource(sourcePath);
        const region = extractRegion(source, include.region);
        if (region === null) {
          failures.push(`${location}: include 区域不存在或未闭合 ${include.includePath}#${include.region}`);
          continue;
        }
        auditedCode = region;
      } catch {
        failures.push(`${location}: include 源文件无法读取 ${include.includePath}`);
        continue;
      }
    }

    const comments = numberedComments(auditedCode);
    if (comments.length !== declaredSteps.length) {
      failures.push(`${location}: steps 声明 ${declaredSteps.length} 项，代码实际有 ${comments.length} 项编号注释`);
    }
    for (let index = 0; index < comments.length; index += 1) {
      const expectedNumber = index + 1;
      if (comments[index].number !== expectedNumber) {
        failures.push(`${location}: 编号步骤必须从 1 连续递增，第 ${index + 1} 项实际为 ${comments[index].number}`);
      }
      const declared = declaredSteps[index];
      if (declared && !comments[index].text.includes(declared)) {
        failures.push(`${location}: 第 ${expectedNumber} 步注释未包含元数据动作“${declared}”`);
      }
    }
    checkSemanticComments(auditedCode, comments, location, failures);
  }

  return failures;
}

