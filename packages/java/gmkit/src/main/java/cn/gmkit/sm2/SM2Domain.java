package cn.gmkit.sm2;

import cn.gmkit.core.*;
import org.bouncycastle.asn1.gm.GMNamedCurves;
import org.bouncycastle.crypto.params.ECDomainParameters;

final class SM2Domain {

    static final org.bouncycastle.asn1.x9.X9ECParameters X9_PARAMETERS = GMNamedCurves.getByName(SM2.CURVE_NAME);
    static final ECDomainParameters DOMAIN_PARAMS = new ECDomainParameters(
        X9_PARAMETERS.getCurve(),
        X9_PARAMETERS.getG(),
        X9_PARAMETERS.getN(),
        X9_PARAMETERS.getH());
    static final int CURVE_LENGTH = (DOMAIN_PARAMS.getCurve().getFieldSize() + 7) / 8;
    static final int RAW_SIGNATURE_LENGTH = CURVE_LENGTH * 2;
    static final int C1_LENGTH = 1 + CURVE_LENGTH * 2;
    // SM2 加密不接受空明文，因此最短密文还必须包含至少 1 字节 C2。
    static final int MIN_CIPHERTEXT_LENGTH = C1_LENGTH + SM2.SM3_DIGEST_LENGTH + 1;
    static final byte[] CURVE_A = org.bouncycastle.util.BigIntegers.asUnsignedByteArray(
        CURVE_LENGTH,
        X9_PARAMETERS.getCurve().getA().toBigInteger());
    static final byte[] CURVE_B = org.bouncycastle.util.BigIntegers.asUnsignedByteArray(
        CURVE_LENGTH,
        X9_PARAMETERS.getCurve().getB().toBigInteger());
    static final byte[] CURVE_GX = org.bouncycastle.util.BigIntegers.asUnsignedByteArray(
        CURVE_LENGTH,
        X9_PARAMETERS.getG().getAffineXCoord().toBigInteger());
    static final byte[] CURVE_GY = org.bouncycastle.util.BigIntegers.asUnsignedByteArray(
        CURVE_LENGTH,
        X9_PARAMETERS.getG().getAffineYCoord().toBigInteger());

    private SM2Domain() {
    }

    static GmSecurityContext context(GmSecurityContext securityContext) {
        return Checks.defaultIfNull(securityContext, GmSecurityContexts.defaults());
    }

    static SM2CipherMode cipherMode(SM2CipherMode mode) {
        return Checks.defaultIfNull(mode, SM2CipherMode.C1C3C2);
    }

    static SM2KeyExchangeOptions keyExchangeOptions(SM2KeyExchangeOptions options) {
        SM2KeyExchangeOptions resolved = Checks.defaultIfNull(options, SM2KeyExchangeOptions.builder().build());
        if (resolved.keyBits() <= 0) {
            throw new GmkitException(Messages.positiveValue("SM2 key exchange keyBits"));
        }
        return resolved;
    }

    static byte[] userIdBytes(String userId) {
        // 兼容旧版调用：null 与空字符串都表示“未指定”，统一使用标准默认 ID。
        String resolvedUserId = userId == null || userId.isEmpty() ? SM2.DEFAULT_USER_ID : userId;
        byte[] bytes = Texts.utf8(resolvedUserId);
        if (bytes.length >= 8192) {
            throw new GmkitException(Messages.sm2UserIdTooLong());
        }
        return bytes;
    }

    static byte[] userIdBitLength(byte[] userIdBytes) {
        return new byte[]{
            (byte) ((userIdBytes.length * 8) >>> 8),
            (byte) (userIdBytes.length * 8)
        };
    }
}
