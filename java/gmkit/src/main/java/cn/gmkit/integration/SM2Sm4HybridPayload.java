package cn.gmkit.integration;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.ByteEncodings;
import cn.gmkit.core.Bytes;
import cn.gmkit.core.Checks;
import cn.gmkit.core.OutputFormat;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;

/**
 * SM2 + SM4 混合加密载荷。
 * <p>
 * 统一承载会话密钥密文、业务密文以及 IV、AAD、tag、模式和填充等元数据，
 * 便于接口层、消息层或持久化层直接透传。
 */
public final class SM2Sm4HybridPayload {

    private final byte[] encryptedKey;
    private final byte[] ciphertext;
    private final byte[] iv;
    private final byte[] aad;
    private final byte[] tag;
    private final SM4CipherMode mode;
    private final SM4Padding padding;

    /**
     * 创建一个混合加密载荷。
     *
     * @param encryptedKey SM2 保护后的 SM4 会话密钥
     * @param ciphertext   SM4 业务密文
     * @param iv           IV 或 nonce；某些模式下可以为 {@code null}
     * @param aad          AEAD 附加认证数据；无附加数据时可为 {@code null}
     * @param tag          AEAD 认证标签；非 AEAD 模式下可为 {@code null}
     * @param mode         SM4 工作模式
     * @param padding      SM4 填充模式
     */
    public SM2Sm4HybridPayload(
        byte[] encryptedKey,
        byte[] ciphertext,
        byte[] iv,
        byte[] aad,
        byte[] tag,
        SM4CipherMode mode,
        SM4Padding padding) {
        this.encryptedKey = Bytes.clone(Checks.requireNonNull(encryptedKey, "encrypted SM4 key"));
        this.ciphertext = Bytes.clone(Checks.requireNonNull(ciphertext, "hybrid ciphertext"));
        this.iv = Bytes.clone(iv);
        this.aad = Bytes.clone(aad);
        this.tag = Bytes.clone(tag);
        this.mode = Checks.requireNonNull(mode, "SM4 mode");
        this.padding = Checks.requireNonNull(padding, "SM4 padding");
    }

    /**
     * 返回 SM2 保护后的会话密钥。
     *
     * @return 会话密钥密文副本
     */
    public byte[] encryptedKey() {
        return Bytes.clone(encryptedKey);
    }

    /**
     * 返回十六进制形式的会话密钥密文。
     *
     * @return 十六进制会话密钥密文
     */
    public String encryptedKeyHex() {
        return ByteEncodings.encode(encryptedKey, OutputFormat.HEX);
    }

    /**
     * 返回 Base64 形式的会话密钥密文。
     *
     * @return Base64 会话密钥密文
     */
    public String encryptedKeyBase64() {
        return ByteEncodings.encode(encryptedKey, OutputFormat.BASE64);
    }

    /**
     * 返回业务密文。
     *
     * @return 业务密文副本
     */
    public byte[] ciphertext() {
        return Bytes.clone(ciphertext);
    }

    /**
     * 返回十六进制形式的业务密文。
     *
     * @return 十六进制业务密文
     */
    public String ciphertextHex() {
        return ByteEncodings.encode(ciphertext, OutputFormat.HEX);
    }

    /**
     * 返回 Base64 形式的业务密文。
     *
     * @return Base64 业务密文
     */
    public String ciphertextBase64() {
        return ByteEncodings.encode(ciphertext, OutputFormat.BASE64);
    }

    /**
     * 返回 IV 或 nonce。
     *
     * @return IV 或 nonce 的副本；不存在时返回 {@code null}
     */
    public byte[] iv() {
        return Bytes.clone(iv);
    }

    /**
     * 是否包含 IV 或 nonce。
     *
     * @return 包含时返回 {@code true}
     */
    public boolean hasIv() {
        return Checks.hasBytes(iv);
    }

    /**
     * 返回十六进制形式的 IV 或 nonce。
     *
     * @return 十六进制 IV 或 nonce；不存在时返回 {@code null}
     */
    public String ivHex() {
        return hasIv() ? ByteEncodings.encode(iv, OutputFormat.HEX) : null;
    }

    /**
     * 返回 AEAD 附加认证数据。
     *
     * @return AAD 副本；不存在时返回 {@code null}
     */
    public byte[] aad() {
        return Bytes.clone(aad);
    }

    /**
     * 是否包含附加认证数据。
     *
     * @return 包含时返回 {@code true}
     */
    public boolean hasAad() {
        return Checks.hasBytes(aad);
    }

    /**
     * 返回 AEAD 认证标签。
     *
     * @return tag 副本；不存在时返回 {@code null}
     */
    public byte[] tag() {
        return Bytes.clone(tag);
    }

    /**
     * 是否包含 AEAD 认证标签。
     *
     * @return 包含时返回 {@code true}
     */
    public boolean hasTag() {
        return Checks.hasBytes(tag);
    }

    /**
     * 返回十六进制形式的认证标签。
     *
     * @return 十六进制 tag；不存在时返回 {@code null}
     */
    public String tagHex() {
        return hasTag() ? ByteEncodings.encode(tag, OutputFormat.HEX) : null;
    }

    /**
     * 返回 Base64 形式的认证标签。
     *
     * @return Base64 tag；不存在时返回 {@code null}
     */
    public String tagBase64() {
        return hasTag() ? Base64Codec.encode(tag) : null;
    }

    /**
     * 返回 SM4 工作模式。
     *
     * @return 工作模式
     */
    public SM4CipherMode mode() {
        return mode;
    }

    /**
     * 返回 SM4 填充模式。
     *
     * @return 填充模式
     */
    public SM4Padding padding() {
        return padding;
    }
}
