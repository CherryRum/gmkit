package cn.gmkit.sm2;

import lombok.Getter;
import lombok.experimental.Accessors;

/**
 * SM2 密钥对。
 * <p>
 * 该类型以十六进制字符串形式同时保存公钥和私钥，适合在对象式 API 与工具式 API 之间传递。
 */
@Getter
@Accessors(fluent = true)
public final class SM2KeyPair {

    private final String publicKey;
    private final String privateKey;

    /**
     * 创建一个 SM2 密钥对包装对象。
     *
     * @param publicKey 公钥十六进制字符串
     * @param privateKey 私钥十六进制字符串
     */
    public SM2KeyPair(String publicKey, String privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}


