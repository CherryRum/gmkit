package cn.gmkit.sm4;

import cn.gmkit.core.Checks;
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.Texts;

import java.nio.charset.Charset;

/**
 * SM4 对象式入口。
 * <p>
 * 适合在一个实例上重复执行密钥生成、分组模式配置下的加解密，以及绑定安全上下文后的持续调用。
 * <p>
 * 如果业务更习惯工具类风格，可使用 {@link SM4Util} 的静态方法。两套接口共享同一套底层实现，
 * 因此默认行为、错误提示和兼容策略保持一致。
 * <p>
 * 兼容性说明：
 * 支持 JDK 8 及以上版本，依赖 BouncyCastle Provider 提供 SM4 算法实现。
 */
public final class SM4 {

    private final GmSecurityContext securityContext;
    private final boolean securityContextPinned;

    /**
     * 创建一个使用默认安全上下文的 SM4 实例。
     */
    public SM4() {
        this(null);
    }

    /**
     * 创建一个绑定指定安全上下文的 SM4 实例。
     *
     * @param securityContext Provider 和随机源配置；传入 {@code null} 时回退为默认配置
     */
    public SM4(GmSecurityContext securityContext) {
        this.securityContext = SM4Support.context(securityContext);
        this.securityContextPinned = securityContext != null;
    }

    /**
     * 返回当前实例绑定的安全上下文。
     *
     * @return 当前实例使用的安全上下文
     */
    public GmSecurityContext securityContext() {
        return securityContext;
    }

    /**
     * 生成 SM4 密钥。
     *
     * @return 16 字节密钥
     */
    public byte[] generateKey() {
        return SM4CipherProcessor.generateKey(securityContext);
    }

    /**
     * 生成十六进制形式的 SM4 密钥。
     *
     * @return 十六进制密钥
     */
    public String generateKeyHex() {
        return HexCodec.encode(generateKey());
    }

    /**
     * 使用十六进制密钥加密 UTF-8 文本。
     *
     * @param keyHex  十六进制密钥
     * @param data    UTF-8 文本
     * @param options 加密配置
     * @return 密文结果
     */
    public SM4CipherResult encryptHex(String keyHex, String data, SM4Options options) {
        return encrypt(HexCodec.decodeStrict(keyHex, "SM4 key"), Texts.utf8(data), options);
    }

    /**
     * 使用十六进制密钥加密字节数组。
     *
     * @param keyHex  十六进制密钥
     * @param data    明文字节数组
     * @param options 加密配置
     * @return 密文结果
     */
    public SM4CipherResult encryptHex(String keyHex, byte[] data, SM4Options options) {
        return encrypt(HexCodec.decodeStrict(keyHex, "SM4 key"), data, options);
    }

    /**
     * 使用默认配置加密。
     *
     * @param key  16 字节密钥
     * @param data 明文字节数组
     * @return 密文结果
     */
    public SM4CipherResult encrypt(byte[] key, byte[] data) {
        return encrypt(key, data, null);
    }

    /**
     * 使用 UTF-8 文本加密。
     *
     * @param key     16 字节密钥
     * @param data    明文字符串
     * @param options 加密配置
     * @return 密文结果
     */
    public SM4CipherResult encrypt(byte[] key, String data, SM4Options options) {
        return encrypt(key, data, Texts.UTF_8, options);
    }

    /**
     * 使用指定字符集编码文本后加密。
     *
     * @param key     16 字节密钥
     * @param data    明文字符串
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options 加密配置
     * @return 密文结果
     */
    public SM4CipherResult encrypt(byte[] key, String data, Charset charset, SM4Options options) {
        return encrypt(key, Texts.bytes(data, charset), options);
    }

    /**
     * 使用指定配置加密。
     *
     * @param key     16 字节密钥
     * @param data    明文字节数组
     * @param options 加密配置，传入 {@code null} 时使用默认值
     * @return 密文结果
     */
    public SM4CipherResult encrypt(byte[] key, byte[] data, SM4Options options) {
        return SM4CipherProcessor.encrypt(key, data, resolveOptions(options));
    }

    /**
     * 使用十六进制密钥解密十六进制密文。
     *
     * @param keyHex        十六进制密钥
     * @param ciphertextHex 十六进制密文
     * @param options       解密配置
     * @return 明文字节数组
     */
    public byte[] decryptHex(String keyHex, String ciphertextHex, SM4Options options) {
        return decrypt(
            HexCodec.decodeStrict(keyHex, "SM4 key"),
            HexCodec.decodeStrict(ciphertextHex, "ciphertext"),
            options);
    }

    /**
     * 解密并按 UTF-8 解码返回字符串。
     *
     * @param key        16 字节密钥
     * @param ciphertext 密文字节数组
     * @param options    解密配置
     * @return UTF-8 字符串
     */
    public String decryptToUtf8(byte[] key, byte[] ciphertext, SM4Options options) {
        return Texts.utf8(decrypt(key, ciphertext, options));
    }

    /**
     * 解密 {@link SM4CipherResult} 并按 UTF-8 解码返回字符串。
     *
     * @param key     16 字节密钥
     * @param result  密文结果，若包含 AEAD tag 会自动并入配置
     * @param options 解密配置
     * @return UTF-8 字符串
     */
    public String decryptToUtf8(byte[] key, SM4CipherResult result, SM4Options options) {
        return Texts.utf8(decrypt(key, result, options));
    }

    /**
     * 解密并使用指定字符集解码。
     *
     * @param key        16 字节密钥
     * @param ciphertext 密文字节数组
     * @param charset    字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options    解密配置
     * @return 解码后的字符串
     */
    public String decryptToString(byte[] key, byte[] ciphertext, Charset charset, SM4Options options) {
        return Texts.text(decrypt(key, ciphertext, options), charset);
    }

    /**
     * 解密并使用指定字符集解码。
     *
     * @param key     16 字节密钥
     * @param result  密文结果
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options 解密配置
     * @return 解码后的字符串
     */
    public String decryptToString(byte[] key, SM4CipherResult result, Charset charset, SM4Options options) {
        return Texts.text(decrypt(key, result, options), charset);
    }

    /**
     * 解密 {@link SM4CipherResult}。
     *
     * @param key     16 字节密钥
     * @param result  密文结果，若包含 AEAD tag 会自动并入配置
     * @param options 解密配置
     * @return 明文字节数组
     */
    public byte[] decrypt(byte[] key, SM4CipherResult result, SM4Options options) {
        Checks.requireNonNull(result, "SM4 result");
        return decrypt(key, result.ciphertextUnsafe(), SM4AeadSupport.withResultTag(resolveOptions(options), result.tagUnsafe()));
    }

    /**
     * 使用默认配置解密。
     *
     * @param key        16 字节密钥
     * @param ciphertext 密文字节数组
     * @return 明文字节数组
     */
    public byte[] decrypt(byte[] key, byte[] ciphertext) {
        return decrypt(key, ciphertext, null);
    }

    /**
     * 使用指定配置解密。
     *
     * @param key        16 字节密钥
     * @param ciphertext 密文字节数组
     * @param options    解密配置，传入 {@code null} 时使用默认值
     * @return 明文字节数组
     */
    public byte[] decrypt(byte[] key, byte[] ciphertext, SM4Options options) {
        return SM4CipherProcessor.decrypt(key, ciphertext, resolveOptions(options));
    }

    private SM4Options resolveOptions(SM4Options options) {
        SM4Options base = SM4Support.options(options);
        if (!securityContextPinned) {
            return base;
        }
        return SM4Options.builder()
            .mode(base.mode())
            .padding(base.padding())
            .iv(base.iv())
            .aad(base.aad())
            .tagLength(base.tagLength())
            .tag(base.tag())
            .securityContext(securityContext)
            .build();
    }
}
