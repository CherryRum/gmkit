package cn.gmkit.core;

/**
 * SM2 签名输入格式。
 */
public enum SM2SignatureInputFormat {
    /**
     * 原始格式，64字节的R和S值拼接
     */
    RAW,
    /**
     * DER编码格式，ASN.1标准编码
     */
    DER,
    /**
     * 自动检测格式
     */
    AUTO
}

