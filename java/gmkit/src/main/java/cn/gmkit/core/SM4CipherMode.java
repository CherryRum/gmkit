package cn.gmkit.core;

/**
 * SM4 工作模式。
 */
public enum SM4CipherMode {
    /**
     * 电子密码本模式（Electronic Codebook）
     */
    ECB,
    /**
     * 密码分组链接模式（Cipher Block Chaining）
     */
    CBC,
    /**
     * 计数器模式（Counter）
     */
    CTR,
    /**
     * 密文反馈模式（Cipher Feedback）
     */
    CFB,
    /**
     * 输出反馈模式（Output Feedback）
     */
    OFB,
    /**
     * 伽罗瓦/计数器模式（Galois/Counter Mode）
     */
    GCM,
    /**
     * 计数器与CBC-MAC模式（Counter with CBC-MAC）
     */
    CCM;

    /**
     * 判断当前模式是否表现为流式模式。
     *
     * @return 流式模式返回 {@code true}
     */
    public boolean isStreamLike() {
        return this == CTR || this == CFB || this == OFB || this == GCM || this == CCM;
    }
}


