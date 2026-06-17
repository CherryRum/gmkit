package cn.gmkit.core;

/**
 * SM2 签名输出格式。
 */
public enum SM2SignatureFormat {
    /**
     * 原始格式，64字节的R和S值拼接
     */
    RAW,
    /**
     * DER编码格式，ASN.1标准编码
     */
    DER
}


