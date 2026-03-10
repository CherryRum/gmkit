import { digest as digestFunc, hmac as hmacFunc, type SM3Options } from './index';
import { normalizeInput } from '../../core/utils';
import { OutputFormat, type OutputFormatType } from '../../types/constants';

/**
 * SM3 哈希算法的面向对象封装
 * 
 * SM3 是中国国家密码管理局发布的密码杂凑算法，
 * 输出长度为 256 位（32 字节）。
 * 
 * 支持两种使用方式：
 * 1. 静态方法：一次性计算哈希
 * 2. 实例方法：增量哈希（适合大数据量分块处理）
 * 
 * @example
 * ```typescript
 * // 静态方法
 * const hash = SM3.digest('Hello, SM3!');
 * 
 * // 增量哈希
 * const sm3 = new SM3();
 * sm3.update('Hello, ').update('SM3!');
 * const result = sm3.digest();
 * ```
 */
export class SM3 {
  /** 缓存的数据块（用于增量哈希） */
  private data: Uint8Array[] = [];
  /** 输出格式（hex 或 base64） */
  private outputFormat: OutputFormatType = OutputFormat.HEX;

  /**
   * 创建 SM3 实例
   * @param outputFormat - 输出格式（默认 hex）
   */
  constructor(outputFormat?: OutputFormatType) {
    if (outputFormat) {
      this.outputFormat = outputFormat;
    }
  }

  /**
   * 计算 SM3 哈希摘要（静态方法）
   * @param data - 要哈希的数据
   * @param options - 哈希选项
   * @returns 哈希摘要（默认返回十六进制字符串）
   */
  static digest(data: string | Uint8Array, options?: SM3Options): string {
    return digestFunc(data, options);
  }

  /**
   * 计算 SM3-HMAC（静态方法）
   * @param key - HMAC 密钥
   * @param data - 要认证的数据
   * @param options - 哈希选项
   * @returns HMAC 值（默认返回十六进制字符串）
   */
  static hmac(key: string | Uint8Array, data: string | Uint8Array, options?: SM3Options): string {
    return hmacFunc(key, data, options);
  }

  /**
   * 更新哈希状态（增量哈希）
   * @param data - 要追加的数据
   * @returns 当前实例（便于链式调用）
   */
  update(data: string | Uint8Array): this {
    const bytes = normalizeInput(data);
    this.data.push(bytes);
    return this;
  }

  /**
   * 完成哈希计算并返回摘要
   * 注意：调用此方法后会清空内部状态
   * @param options - 哈希选项（可覆盖实例的输出格式）
   * @returns 哈希摘要
   */
  digest(options?: SM3Options): string {
    // 拼接所有数据块
    const totalLength = this.data.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.data) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // 计算哈希后清空数据
    this.data = [];

    const outputFormat = options?.outputFormat || this.outputFormat;
    return digestFunc(combined, { outputFormat });
  }

  /**
   * 重置哈希器状态
   * @returns 当前实例（便于链式调用）
   */
  reset(): this {
    this.data = [];
    return this;
  }

  /**
   * 设置输出格式
   * @param format - 输出格式
   */
  setOutputFormat(format: OutputFormatType): void {
    this.outputFormat = format;
  }

  /**
   * 获取当前输出格式
   */
  getOutputFormat(): OutputFormatType {
    return this.outputFormat;
  }
}
