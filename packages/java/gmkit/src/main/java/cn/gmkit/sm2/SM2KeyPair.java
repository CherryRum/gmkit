package cn.gmkit.sm2;

/**
 * SM2 密钥对。
 * <p>
 * 该类型以十六进制字符串形式同时保存公钥和私钥，适合在对象式 API 与工具式 API 之间传递。
 */
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

    /**
     * 获取公钥。
     *
     * @return 十六进制公钥；通常为以 {@code 04} 开头的 65 字节非压缩点
     */
    public String publicKey() {
        return publicKey;
    }

    /**
     * 获取私钥。
     *
     * @return 32 字节私钥的十六进制表示
     */
    public String privateKey() {
        return privateKey;
    }
}


