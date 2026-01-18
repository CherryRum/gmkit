import { digest as digestFunc, hmac as hmacFunc, type SM3Options } from './index';
import { OutputFormat, type OutputFormatType } from '../../types/constants';

/**
 * SM3 哈希算法的面向对象封装
 */
export class SM3 {
  private data: Uint8Array[] = [];
  private outputFormat: OutputFormatType = OutputFormat.HEX;

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
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.data.push(bytes);
    return this;
  }

  /**
   * 完成哈希计算并返回摘要
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

    // 计算哈希后清空数据 (Clear data after digesting)
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
