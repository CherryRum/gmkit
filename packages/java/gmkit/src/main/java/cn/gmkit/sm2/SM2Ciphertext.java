package cn.gmkit.sm2;

import cn.gmkit.core.Bytes;
import cn.gmkit.core.SM2CipherMode;

/**
 * SM2 原始密文分段视图。
 * <p>
 * 将原始密文拆分为 C1、C2、C3 三段并保留当前排列模式。
 */
public final class SM2Ciphertext {

    private final byte[] c1;
    private final byte[] c2;
    private final byte[] c3;
    private final SM2CipherMode mode;

    /**
     * 创建一个 SM2 密文分段对象。
     *
     * @param c1 椭圆曲线点 C1
     * @param c2 密文段 C2
     * @param c3 摘要段 C3
     * @param mode 密文排列模式
     */
    public SM2Ciphertext(byte[] c1, byte[] c2, byte[] c3, SM2CipherMode mode) {
        this.c1 = Bytes.clone(c1);
        this.c2 = Bytes.clone(c2);
        this.c3 = Bytes.clone(c3);
        this.mode = mode;
    }

    /**
     * 获取 C1 段。
     *
     * @return C1 字节数组的防御性拷贝
     */
    public byte[] c1() {
        return Bytes.clone(c1);
    }

    /**
     * 获取 C2 段。
     *
     * @return C2 字节数组的防御性拷贝
     */
    public byte[] c2() {
        return Bytes.clone(c2);
    }

    /**
     * 获取 C3 段。
     *
     * @return C3 字节数组的防御性拷贝
     */
    public byte[] c3() {
        return Bytes.clone(c3);
    }

    /**
     * 获取密文排列模式。
     *
     * @return 密文排列模式
     */
    public SM2CipherMode mode() {
        return mode;
    }
}

