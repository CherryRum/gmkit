package cn.gmkit.sm4;

import cn.gmkit.core.GmSecurityContext;

import java.nio.charset.Charset;

/**
 * SM4 静态工具入口。
 * <p>
 * 适合将 SM4 当作纯工具能力使用的场景，例如一次性加解密、历史代码兼容或不希望显式维护实例时。
 * <p>
 * 本类与 {@link SM4} 对象式入口共享同一套实现，默认配置、参数校验和异常语义保持一致。
 */
public final class SM4Util {

    private static final SM4 DEFAULT = new SM4();

    private SM4Util() {
    }

    /**
     * 生成随机 SM4 密钥。
     *
     * @return 16 字节密钥
     */
    public static byte[] generateKey() {
        return DEFAULT.generateKey();
    }

    /**
     * 使用指定安全上下文生成随机 SM4 密钥。
     *
     * @param securityContext 安全上下文
     * @return 16 字节密钥
     */
    public static byte[] generateKey(GmSecurityContext securityContext) {
        return new SM4(securityContext).generateKey();
    }

    /**
     * 生成十六进制形式的 SM4 密钥。
     *
     * @return 十六进制密钥
     */
    public static String generateKeyHex() {
        return DEFAULT.generateKeyHex();
    }

    /**
     * 使用指定安全上下文生成十六进制形式的 SM4 密钥。
     *
     * @param securityContext 安全上下文
     * @return 十六进制密钥
     */
    public static String generateKeyHex(GmSecurityContext securityContext) {
        return new SM4(securityContext).generateKeyHex();
    }

    /**
     * 使用十六进制密钥加密 UTF-8 文本。
     *
     * @param keyHex  十六进制密钥
     * @param data    UTF-8 文本
     * @param options 加密配置；传入 {@code null} 时使用默认配置
     * @return 密文结果
     */
    public static SM4CipherResult encryptHex(String keyHex, String data, SM4Options options) {
        return DEFAULT.encryptHex(keyHex, data, options);
    }

    /**
     * 使用十六进制密钥加密字节数组。
     *
     * @param keyHex 十六进制密钥
     * @param data 明文字节数组
     * @param options 加密配置；传入 {@code null} 时使用默认配置
     * @return 密文结果
     */
    public static SM4CipherResult encryptHex(String keyHex, byte[] data, SM4Options options) {
        return DEFAULT.encryptHex(keyHex, data, options);
    }

    /**
     * 使用字节密钥加密字节数组。
     *
     * @param key 16 字节 SM4 密钥
     * @param data 明文字节数组
     * @param options 加密配置；传入 {@code null} 时使用默认配置
     * @return 密文结果
     */
    public static SM4CipherResult encrypt(byte[] key, byte[] data, SM4Options options) {
        return DEFAULT.encrypt(key, data, options);
    }

    /**
     * 使用字节密钥加密 UTF-8 文本。
     *
     * @param key 16 字节 SM4 密钥
     * @param data 明文字符串
     * @param options 加密配置；传入 {@code null} 时使用默认配置
     * @return 密文结果
     */
    public static SM4CipherResult encrypt(byte[] key, String data, SM4Options options) {
        return DEFAULT.encrypt(key, data, options);
    }

    /**
     * 使用字节密钥和指定字符集加密文本。
     *
     * @param key 16 字节 SM4 密钥
     * @param data 明文字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options 加密配置；传入 {@code null} 时使用默认配置
     * @return 密文结果
     */
    public static SM4CipherResult encrypt(byte[] key, String data, Charset charset, SM4Options options) {
        return DEFAULT.encrypt(key, data, charset, options);
    }

    /**
     * 使用十六进制密钥解密十六进制密文。
     *
     * @param keyHex 十六进制密钥
     * @param ciphertextHex 十六进制密文
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return 明文字节数组
     */
    public static byte[] decryptHex(String keyHex, String ciphertextHex, SM4Options options) {
        return DEFAULT.decryptHex(keyHex, ciphertextHex, options);
    }

    /**
     * 解密字节密文并按 UTF-8 解码。
     *
     * @param key 16 字节 SM4 密钥
     * @param ciphertext 密文字节数组
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return UTF-8 字符串
     */
    public static String decryptToUtf8(byte[] key, byte[] ciphertext, SM4Options options) {
        return DEFAULT.decryptToUtf8(key, ciphertext, options);
    }

    /**
     * 解密 {@link SM4CipherResult} 并按 UTF-8 解码。
     *
     * @param key 16 字节 SM4 密钥
     * @param result 密文结果
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return UTF-8 字符串
     */
    public static String decryptToUtf8(byte[] key, SM4CipherResult result, SM4Options options) {
        return DEFAULT.decryptToUtf8(key, result, options);
    }

    /**
     * 解密字节密文并按指定字符集解码。
     *
     * @param key 16 字节 SM4 密钥
     * @param ciphertext 密文字节数组
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return 解码后的字符串
     */
    public static String decryptToString(byte[] key, byte[] ciphertext, Charset charset, SM4Options options) {
        return DEFAULT.decryptToString(key, ciphertext, charset, options);
    }

    /**
     * 解密 {@link SM4CipherResult} 并按指定字符集解码。
     *
     * @param key 16 字节 SM4 密钥
     * @param result 密文结果
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return 解码后的字符串
     */
    public static String decryptToString(byte[] key, SM4CipherResult result, Charset charset, SM4Options options) {
        return DEFAULT.decryptToString(key, result, charset, options);
    }

    /**
     * 解密 {@link SM4CipherResult}。
     *
     * @param key 16 字节 SM4 密钥
     * @param result 密文结果
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return 明文字节数组
     */
    public static byte[] decrypt(byte[] key, SM4CipherResult result, SM4Options options) {
        return DEFAULT.decrypt(key, result, options);
    }

    /**
     * 解密字节密文。
     *
     * @param key 16 字节 SM4 密钥
     * @param ciphertext 密文字节数组
     * @param options 解密配置；传入 {@code null} 时使用默认配置
     * @return 明文字节数组
     */
    public static byte[] decrypt(byte[] key, byte[] ciphertext, SM4Options options) {
        return DEFAULT.decrypt(key, ciphertext, options);
    }
}
