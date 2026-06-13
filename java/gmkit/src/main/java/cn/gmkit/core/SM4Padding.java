package cn.gmkit.core;

/**
 * SM4 分组填充模式。
 */
public enum SM4Padding {
    /**
     * PKCS7填充模式，自动填充数据到块大小的整数倍
     */
    PKCS7,
    /**
     * 不填充模式，要求数据长度必须是块大小的整数倍
     */
    NONE,
    /**
     * 零填充模式，使用0x00填充数据到块大小的整数倍
     */
    ZERO
}


