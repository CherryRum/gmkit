package cn.gmkit.core;

import org.bouncycastle.crypto.engines.SM2Engine;

/**
 * SM2 原始密文片段排列模式。
 */
public enum SM2CipherMode {
    /**
     * C1C3C2排列模式，国密标准推荐模式
     */
    C1C3C2(SM2Engine.Mode.C1C3C2),
    /**
     * C1C2C3排列模式
     */
    C1C2C3(SM2Engine.Mode.C1C2C3);

    private final SM2Engine.Mode bcMode;

    SM2CipherMode(SM2Engine.Mode bcMode) {
        this.bcMode = bcMode;
    }

    /**
     * 转换为 BouncyCastle 的 {@link SM2Engine.Mode}。
     *
     * @return BC 对应模式
     */
    public SM2Engine.Mode toBcMode() {
        return bcMode;
    }
}


