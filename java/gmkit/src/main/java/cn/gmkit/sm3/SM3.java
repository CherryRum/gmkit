package cn.gmkit.sm3;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.Texts;

import java.nio.charset.Charset;

/**
 * SM3 对象式入口。
 * <p>
 * SM3 本身是无状态摘要算法，因此对象式接口主要用于统一整体 API 风格：
 * 可以与 {@code new SM2()}、{@code new SM4()} 保持一致的使用体验。
 * <p>
 * 如果项目更偏好工具类方式，可使用 {@link SM3Util} 的静态方法。
 * 两者的摘要结果、HMAC 结果和参数校验行为保持一致。
 */
public final class SM3 {

    /**
     * SM3 摘要长度，单位为字节。
     */
    public static final int DIGEST_LENGTH = 32;

    /**
     * 创建一个无状态的 SM3 实例。
     */
    public SM3() {
    }

    /**
     * 计算 SM3 摘要。
     *
     * @param data 输入字节数组
     * @return 摘要结果
     */
    public byte[] digest(byte[] data) {
        return SM3Support.digest(data);
    }

    /**
     * 计算 UTF-8 字符串的 SM3 摘要。
     *
     * @param data 输入字符串
     * @return 摘要结果
     */
    public byte[] digest(String data) {
        return digest(Texts.utf8(data));
    }

    /**
     * 使用指定字符集计算字符串的 SM3 摘要。
     *
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 摘要结果
     */
    public byte[] digest(String data, Charset charset) {
        return digest(Texts.bytes(data, charset));
    }

    /**
     * 计算 SM3 摘要并输出十六进制字符串。
     *
     * @param data 输入字节数组
     * @return 十六进制摘要
     */
    public String digestHex(byte[] data) {
        return HexCodec.encode(digest(data));
    }

    /**
     * 计算 UTF-8 字符串的 SM3 摘要并输出十六进制字符串。
     *
     * @param data 输入字符串
     * @return 十六进制摘要
     */
    public String digestHex(String data) {
        return HexCodec.encode(digest(data));
    }

    /**
     * 使用指定字符集计算字符串的 SM3 摘要并输出十六进制字符串。
     *
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 十六进制摘要
     */
    public String digestHex(String data, Charset charset) {
        return HexCodec.encode(digest(data, charset));
    }

    /**
     * 计算 SM3 摘要并输出 Base64 字符串。
     *
     * @param data 输入字节数组
     * @return Base64 摘要
     */
    public String digestBase64(byte[] data) {
        return Base64Codec.encode(digest(data));
    }

    /**
     * 计算 UTF-8 字符串的 SM3 摘要并输出 Base64 字符串。
     *
     * @param data 输入字符串
     * @return Base64 摘要
     */
    public String digestBase64(String data) {
        return Base64Codec.encode(digest(data));
    }

    /**
     * 使用指定字符集计算字符串的 SM3 摘要并输出 Base64 字符串。
     *
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return Base64 摘要
     */
    public String digestBase64(String data, Charset charset) {
        return Base64Codec.encode(digest(data, charset));
    }

    /**
     * 计算 HMAC-SM3。
     *
     * @param key  HMAC 密钥
     * @param data 输入字节数组
     * @return HMAC 结果
     */
    public byte[] hmac(byte[] key, byte[] data) {
        return SM3Support.hmac(key, data);
    }

    /**
     * 计算 UTF-8 字符串的 HMAC-SM3。
     *
     * @param key  HMAC 密钥
     * @param data 输入字符串
     * @return HMAC 结果
     */
    public byte[] hmac(byte[] key, String data) {
        return hmac(key, Texts.utf8(data));
    }

    /**
     * 使用指定字符集计算字符串的 HMAC-SM3。
     *
     * @param key     HMAC 密钥
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return HMAC 结果
     */
    public byte[] hmac(byte[] key, String data, Charset charset) {
        return hmac(key, Texts.bytes(data, charset));
    }

    /**
     * 计算 HMAC-SM3 并输出十六进制字符串。
     *
     * @param key  HMAC 密钥
     * @param data 输入字节数组
     * @return 十六进制 HMAC
     */
    public String hmacHex(byte[] key, byte[] data) {
        return HexCodec.encode(hmac(key, data));
    }

    /**
     * 计算 UTF-8 字符串的 HMAC-SM3 并输出十六进制字符串。
     *
     * @param key  HMAC 密钥
     * @param data 输入字符串
     * @return 十六进制 HMAC
     */
    public String hmacHex(byte[] key, String data) {
        return HexCodec.encode(hmac(key, Texts.utf8(data)));
    }

    /**
     * 使用指定字符集计算字符串的 HMAC-SM3 并输出十六进制字符串。
     *
     * @param key     HMAC 密钥
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 十六进制 HMAC
     */
    public String hmacHex(byte[] key, String data, Charset charset) {
        return HexCodec.encode(hmac(key, data, charset));
    }

    /**
     * 计算 HMAC-SM3 并输出 Base64 字符串。
     *
     * @param key  HMAC 密钥
     * @param data 输入字节数组
     * @return Base64 HMAC
     */
    public String hmacBase64(byte[] key, byte[] data) {
        return Base64Codec.encode(hmac(key, data));
    }

    /**
     * 计算 UTF-8 字符串的 HMAC-SM3 并输出 Base64 字符串。
     *
     * @param key  HMAC 密钥
     * @param data 输入字符串
     * @return Base64 HMAC
     */
    public String hmacBase64(byte[] key, String data) {
        return Base64Codec.encode(hmac(key, Texts.utf8(data)));
    }

    /**
     * 使用指定字符集计算字符串的 HMAC-SM3 并输出 Base64 字符串。
     *
     * @param key     HMAC 密钥
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return Base64 HMAC
     */
    public String hmacBase64(byte[] key, String data, Charset charset) {
        return Base64Codec.encode(hmac(key, data, charset));
    }
}
