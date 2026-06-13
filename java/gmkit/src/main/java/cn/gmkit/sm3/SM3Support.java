package cn.gmkit.sm3;

import cn.gmkit.core.Checks;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.Messages;
import org.bouncycastle.crypto.digests.SM3Digest;
import org.bouncycastle.crypto.macs.HMac;
import org.bouncycastle.crypto.params.KeyParameter;

/**
 * SM3 底层摘要与 HMAC 支撑工具。
 * <p>
 * 该类仅供库内部复用，对外请使用 {@link SM3} 或 {@link SM3Util}。
 */
final class SM3Support {

    private SM3Support() {
    }

    /**
     * 计算字节数组的 SM3 摘要。
     *
     * @param data 输入字节数组，不能为 {@code null}
     * @return 32 字节 SM3 摘要
     */
    public static byte[] digest(byte[] data) {
        Checks.requireNonNull(data, "SM3 input");
        SM3Digest digest = new SM3Digest();
        digest.update(data, 0, data.length);
        byte[] output = new byte[SM3.DIGEST_LENGTH];
        digest.doFinal(output, 0);
        return output;
    }

    /**
     * 计算 HMAC-SM3。
     *
     * @param key  HMAC 密钥，不能为 {@code null}
     * @param data 输入数据，不能为 {@code null}
     * @return 32 字节 HMAC 结果
     */
    public static byte[] hmac(byte[] key, byte[] data) {
        if (key == null || data == null) {
            throw new GmkitException(Messages.bilingual(
                "SM3 HMAC 密钥和输入都不能为空",
                "SM3 HMAC key and input must not be null"));
        }
        HMac hmac = new HMac(new SM3Digest());
        hmac.init(new KeyParameter(key));
        hmac.update(data, 0, data.length);
        byte[] output = new byte[SM3.DIGEST_LENGTH];
        hmac.doFinal(output, 0);
        return output;
    }
}
