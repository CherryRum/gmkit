/**
 * SM9 标识密码算法模块。
 * <p>
 * 通过 JNI 桥接 GmSSL v3.1.1 的 native 实现，提供 SM9 的签名 / 验签与基于身份的加密
 * （IBE）加解密能力。对外主入口为门面工具类 {@link cn.gmkit.sm9.SM9}，对象式入口包括
 * {@link cn.gmkit.sm9.SM9SignMasterKey}、{@link cn.gmkit.sm9.SM9EncMasterKey}、
 * {@link cn.gmkit.sm9.SM9Signature} 等。
 *
 * <h2>能力范围</h2>
 * 与上游 GmSSL 一致，仅支持签名 / 验签与加密 / 解密，<b>不支持密钥交换</b>；
 * 单次加密明文上限为 {@value cn.gmkit.sm9.SM9EncMasterKey#MAX_PLAINTEXT_SIZE} 字节。
 *
 * <h2>平台与 native 库</h2>
 * 该模块依赖按平台分发的 native 库（{@code gmkitsm9} 及其依赖 {@code gmssl}），
 * 当当前操作系统 / CPU 架构无可用 native 库时，
 * {@link cn.gmkit.sm9.SM9#isAvailable()} 返回 {@code false}。
 */
package cn.gmkit.sm9;
