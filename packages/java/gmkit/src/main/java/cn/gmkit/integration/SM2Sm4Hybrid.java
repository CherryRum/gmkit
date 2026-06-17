package cn.gmkit.integration;

import cn.gmkit.core.Bytes;
import cn.gmkit.core.Checks;
import cn.gmkit.core.GmSecurityContext;
import cn.gmkit.core.GmSecurityContexts;
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.core.Texts;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;

import java.nio.charset.Charset;

/**
 * 面向后端场景的 SM2 + SM4 混合加密入口。
 * <p>
 * 该类型负责统一封装一次性 SM4 会话密钥生成、SM2 会话密钥保护以及业务密文与元数据的打包逻辑，
 * 适合服务端接口、消息体落库和跨服务传输等需要固定载荷结构的场景。
 * <p>
 * 默认情况下使用 {@code SM4-GCM + 随机 nonce + 16 字节 tag}，
 * 也可以显式传入 {@link SM4Options} 覆盖模式、IV、AAD 和 tag 长度等参数。
 */
public final class SM2Sm4Hybrid {

    private static final int BLOCK_IV_LENGTH = 16;
    private static final int AEAD_IV_LENGTH = 12;
    private static final int DEFAULT_TAG_LENGTH = 16;

    private final GmSecurityContext securityContext;
    private final SM2 sm2;
    private final SM4 sm4;

    /**
     * 创建一个使用默认安全上下文的混合加密入口。
     */
    public SM2Sm4Hybrid() {
        this(null);
    }

    /**
     * 创建一个绑定指定安全上下文的混合加密入口。
     *
     * @param securityContext Provider 和随机源配置；传入 {@code null} 时回退为默认安全上下文
     */
    public SM2Sm4Hybrid(GmSecurityContext securityContext) {
        this.securityContext = Checks.defaultIfNull(securityContext, GmSecurityContexts.defaults());
        this.sm2 = new SM2(this.securityContext);
        this.sm4 = new SM4(this.securityContext);
    }

    /**
     * 使用默认混合加密配置加密字节数组。
     *
     * @param publicKeyHex SM2 公钥十六进制字符串
     * @param plaintext    原文字节数组
     * @return 混合加密载荷
     */
    public SM2Sm4HybridPayload encrypt(String publicKeyHex, byte[] plaintext) {
        return encrypt(publicKeyHex, plaintext, null);
    }

    /**
     * 使用默认混合加密配置加密 UTF-8 文本。
     *
     * @param publicKeyHex SM2 公钥十六进制字符串
     * @param plaintext    原文字符串
     * @return 混合加密载荷
     */
    public SM2Sm4HybridPayload encrypt(String publicKeyHex, String plaintext) {
        return encrypt(publicKeyHex, plaintext, Texts.UTF_8, null);
    }

    /**
     * 使用指定字符集与 SM4 选项加密文本。
     *
     * @param publicKeyHex SM2 公钥十六进制字符串
     * @param plaintext    原文字符串
     * @param charset      字符集；传入 {@code null} 时默认使用 UTF-8
     * @param options      SM4 配置；传入 {@code null} 时使用默认的 GCM 配置
     * @return 混合加密载荷
     */
    public SM2Sm4HybridPayload encrypt(String publicKeyHex, String plaintext, Charset charset, SM4Options options) {
        return encrypt(publicKeyHex, Texts.bytes(plaintext, charset), options);
    }

    /**
     * 使用指定 SM4 选项加密字节数组。
     *
     * @param publicKeyHex SM2 公钥十六进制字符串
     * @param plaintext    原文字节数组
     * @param options      SM4 配置；传入 {@code null} 时使用默认的 GCM 配置
     * @return 混合加密载荷
     */
    public SM2Sm4HybridPayload encrypt(String publicKeyHex, byte[] plaintext, SM4Options options) {
        Checks.requireNonBlank(publicKeyHex, "SM2 public key");
        byte[] plain = Bytes.requireNonNull(plaintext, "hybrid plaintext");
        SM4Options resolvedOptions = resolveEncryptOptions(options);
        byte[] sessionKey = sm4.generateKey();
        SM4CipherResult cipherResult = sm4.encrypt(sessionKey, plain, resolvedOptions);
        byte[] encryptedKey = sm2.encrypt(publicKeyHex, sessionKey, SM2CipherMode.C1C3C2);
        return new SM2Sm4HybridPayload(
            encryptedKey,
            cipherResult.ciphertext(),
            resolvedOptions.iv(),
            resolvedOptions.aad(),
            cipherResult.tag(),
            resolvedOptions.mode(),
            resolvedOptions.padding());
    }

    /**
     * 解密混合加密载荷并返回原文字节数组。
     *
     * @param privateKeyHex SM2 私钥十六进制字符串
     * @param payload       混合加密载荷
     * @return 原文字节数组
     */
    public byte[] decrypt(String privateKeyHex, SM2Sm4HybridPayload payload) {
        Checks.requireNonBlank(privateKeyHex, "SM2 private key");
        Checks.requireNonNull(payload, "hybrid payload");
        byte[] sessionKey = sm2.decrypt(privateKeyHex, payload.encryptedKey(), SM2CipherMode.C1C3C2);
        return sm4.decrypt(sessionKey, payload.ciphertext(), optionsFromPayload(payload));
    }

    /**
     * 解密混合加密载荷并按 UTF-8 返回明文。
     *
     * @param privateKeyHex SM2 私钥十六进制字符串
     * @param payload       混合加密载荷
     * @return UTF-8 明文
     */
    public String decryptToUtf8(String privateKeyHex, SM2Sm4HybridPayload payload) {
        return Texts.utf8(decrypt(privateKeyHex, payload));
    }

    /**
     * 解密混合加密载荷并按指定字符集返回明文。
     *
     * @param privateKeyHex SM2 私钥十六进制字符串
     * @param payload       混合加密载荷
     * @param charset       字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 指定字符集解码后的明文
     */
    public String decryptToString(String privateKeyHex, SM2Sm4HybridPayload payload, Charset charset) {
        return Texts.text(decrypt(privateKeyHex, payload), charset);
    }

    private SM4Options resolveEncryptOptions(SM4Options options) {
        if (options == null) {
            return SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .padding(SM4Padding.NONE)
                .iv(generateIv(SM4CipherMode.GCM))
                .tagLength(DEFAULT_TAG_LENGTH)
                .securityContext(securityContext)
                .build();
        }

        byte[] iv = options.iv();
        if (requiresIv(options.mode()) && !Checks.hasBytes(iv)) {
            iv = generateIv(options.mode());
        }
        return SM4Options.builder()
            .mode(options.mode())
            .padding(options.padding())
            .iv(iv)
            .aad(options.aad())
            .tagLength(options.tagLength())
            .tag(options.tag())
            .securityContext(Checks.defaultIfNull(options.securityContext(), securityContext))
            .build();
    }

    private SM4Options optionsFromPayload(SM2Sm4HybridPayload payload) {
        SM4Options.Builder builder = SM4Options.builder()
            .mode(payload.mode())
            .padding(payload.padding())
            .securityContext(securityContext);
        if (payload.hasIv()) {
            builder.iv(payload.iv());
        }
        if (payload.hasAad()) {
            builder.aad(payload.aad());
        }
        if (payload.hasTag()) {
            builder.tag(payload.tag()).tagLength(payload.tag().length);
        }
        return builder.build();
    }

    private boolean requiresIv(SM4CipherMode mode) {
        return mode != SM4CipherMode.ECB;
    }

    private byte[] generateIv(SM4CipherMode mode) {
        int length = (mode == SM4CipherMode.GCM || mode == SM4CipherMode.CCM) ? AEAD_IV_LENGTH : BLOCK_IV_LENGTH;
        byte[] iv = new byte[length];
        securityContext.secureRandom().nextBytes(iv);
        return iv;
    }
}
