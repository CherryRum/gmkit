package cn.gmkit.sm4;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.Bytes;
import cn.gmkit.core.Checks;
import cn.gmkit.core.HexCodec;

/**
 * SM4 加密结果。
 * <p>
 * 同时封装密文主体以及可选的 AEAD 认证标签。
 */
public final class SM4CipherResult {

    private final byte[] ciphertext;
    private final byte[] tag;

    /**
     * 创建一个 SM4 加密结果对象。
     *
     * @param ciphertext 密文数据
     * @param tag        认证标签（用于AEAD模式如GCM、CCM）
     */
    public SM4CipherResult(byte[] ciphertext, byte[] tag) {
        this.ciphertext = Bytes.clone(ciphertext);
        this.tag = Bytes.clone(tag);
    }

    /**
     * 获取密文数据。
     *
     * @return 密文字节数组的防御性拷贝
     */
    public byte[] ciphertext() {
        return Bytes.clone(ciphertext);
    }

    byte[] ciphertextUnsafe() {
        return ciphertext;
    }

    /**
     * 获取认证标签。
     *
     * @return 认证标签字节数组的防御性拷贝
     */
    public byte[] tag() {
        return Bytes.clone(tag);
    }

    byte[] tagUnsafe() {
        return tag;
    }

    /**
     * 判断是否包含认证标签。
     *
     * @return 包含认证标签时返回 {@code true}
     */
    public boolean hasTag() {
        return Checks.hasBytes(tag);
    }

    /**
     * 获取密文的十六进制字符串。
     *
     * @return 十六进制密文
     */
    public String ciphertextHex() {
        return HexCodec.encode(ciphertext);
    }

    /**
     * 获取密文的 Base64 字符串。
     *
     * @return Base64 密文
     */
    public String ciphertextBase64() {
        return Base64Codec.encode(ciphertext);
    }

    /**
     * 获取认证标签的十六进制字符串。
     *
     * @return 十六进制认证标签；不存在时返回 {@code null}
     */
    public String tagHex() {
        return hasTag() ? HexCodec.encode(tag) : null;
    }

    /**
     * 获取认证标签的 Base64 字符串。
     *
     * @return Base64 认证标签；不存在时返回 {@code null}
     */
    public String tagBase64() {
        return hasTag() ? Base64Codec.encode(tag) : null;
    }
}


