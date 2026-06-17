package cn.gmkit.sm3;

import java.nio.charset.Charset;

/**
 * SM3 静态工具入口。
 * <p>
 * 适合直接按工具类方式计算摘要或 HMAC，例如在工具方法、表达式链或历史代码中快速接入。
 * <p>
 * 本类与 {@link SM3} 的对象式接口在能力上完全一致，仅调用形式不同。
 */
public final class SM3Util {

    /**
     * SM3 摘要长度，单位为字节。
     */
    public static final int DIGEST_LENGTH = SM3.DIGEST_LENGTH;
    private static final SM3 DEFAULT = new SM3();

    private SM3Util() {
    }

    /**
     * 计算字节数组的 SM3 摘要。
     *
     * @param data 输入数据，不能为 {@code null}
     * @return 32 字节摘要
     */
    public static byte[] digest(byte[] data) {
        return SM3Support.digest(data);
    }

    /**
     * 计算 UTF-8 字符串的 SM3 摘要。
     *
     * @param data 输入字符串
     * @return 32 字节摘要
     */
    public static byte[] digest(String data) {
        return DEFAULT.digest(data);
    }

    /**
     * 使用指定字符集计算字符串的 SM3 摘要。
     *
     * @param data    输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 32 字节摘要
     */
    public static byte[] digest(String data, Charset charset) {
        return DEFAULT.digest(data, charset);
    }

    /**
     * 计算字节数组的 SM3 摘要并输出十六进制字符串。
     *
     * @param data 输入字节数组
     * @return 十六进制摘要
     */
    public static String digestHex(byte[] data) {
        return DEFAULT.digestHex(data);
    }

    /**
     * 计算 UTF-8 字符串的 SM3 摘要并输出十六进制字符串。
     *
     * @param data 输入字符串
     * @return 十六进制摘要
     */
    public static String digestHex(String data) {
        return DEFAULT.digestHex(data);
    }

    /**
     * 使用指定字符集计算字符串的 SM3 摘要并输出十六进制字符串。
     *
     * @param data 输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 十六进制摘要
     */
    public static String digestHex(String data, Charset charset) {
        return DEFAULT.digestHex(data, charset);
    }

    /**
     * 计算字节数组的 SM3 摘要并输出 Base64 字符串。
     *
     * @param data 输入字节数组
     * @return Base64 摘要
     */
    public static String digestBase64(byte[] data) {
        return DEFAULT.digestBase64(data);
    }

    /**
     * 计算 UTF-8 字符串的 SM3 摘要并输出 Base64 字符串。
     *
     * @param data 输入字符串
     * @return Base64 摘要
     */
    public static String digestBase64(String data) {
        return DEFAULT.digestBase64(data);
    }

    /**
     * 使用指定字符集计算字符串的 SM3 摘要并输出 Base64 字符串。
     *
     * @param data 输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return Base64 摘要
     */
    public static String digestBase64(String data, Charset charset) {
        return DEFAULT.digestBase64(data, charset);
    }

    /**
     * 计算 HMAC-SM3。
     *
     * @param key HMAC 密钥
     * @param data 输入字节数组
     * @return 32 字节 HMAC 结果
     */
    public static byte[] hmac(byte[] key, byte[] data) {
        return SM3Support.hmac(key, data);
    }

    /**
     * 计算 UTF-8 字符串的 HMAC-SM3。
     *
     * @param key HMAC 密钥
     * @param data 输入字符串
     * @return 32 字节 HMAC 结果
     */
    public static byte[] hmac(byte[] key, String data) {
        return DEFAULT.hmac(key, data);
    }

    /**
     * 使用指定字符集计算字符串的 HMAC-SM3。
     *
     * @param key HMAC 密钥
     * @param data 输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 32 字节 HMAC 结果
     */
    public static byte[] hmac(byte[] key, String data, Charset charset) {
        return DEFAULT.hmac(key, data, charset);
    }

    /**
     * 计算 HMAC-SM3 并输出十六进制字符串。
     *
     * @param key HMAC 密钥
     * @param data 输入字节数组
     * @return 十六进制 HMAC
     */
    public static String hmacHex(byte[] key, byte[] data) {
        return DEFAULT.hmacHex(key, data);
    }

    /**
     * 计算 UTF-8 字符串的 HMAC-SM3 并输出十六进制字符串。
     *
     * @param key HMAC 密钥
     * @param data 输入字符串
     * @return 十六进制 HMAC
     */
    public static String hmacHex(byte[] key, String data) {
        return DEFAULT.hmacHex(key, data);
    }

    /**
     * 使用指定字符集计算字符串的 HMAC-SM3 并输出十六进制字符串。
     *
     * @param key HMAC 密钥
     * @param data 输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 十六进制 HMAC
     */
    public static String hmacHex(byte[] key, String data, Charset charset) {
        return DEFAULT.hmacHex(key, data, charset);
    }

    /**
     * 计算 HMAC-SM3 并输出 Base64 字符串。
     *
     * @param key HMAC 密钥
     * @param data 输入字节数组
     * @return Base64 HMAC
     */
    public static String hmacBase64(byte[] key, byte[] data) {
        return DEFAULT.hmacBase64(key, data);
    }

    /**
     * 计算 UTF-8 字符串的 HMAC-SM3 并输出 Base64 字符串。
     *
     * @param key HMAC 密钥
     * @param data 输入字符串
     * @return Base64 HMAC
     */
    public static String hmacBase64(byte[] key, String data) {
        return DEFAULT.hmacBase64(key, data);
    }

    /**
     * 使用指定字符集计算字符串的 HMAC-SM3 并输出 Base64 字符串。
     *
     * @param key HMAC 密钥
     * @param data 输入字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return Base64 HMAC
     */
    public static String hmacBase64(byte[] key, String data, Charset charset) {
        return DEFAULT.hmacBase64(key, data, charset);
    }
}
