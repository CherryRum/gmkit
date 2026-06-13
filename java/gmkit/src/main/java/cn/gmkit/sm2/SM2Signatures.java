package cn.gmkit.sm2;

import cn.gmkit.core.Checks;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.Messages;
import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.core.SM2SignatureInputFormat;
import org.bouncycastle.crypto.signers.PlainDSAEncoding;
import org.bouncycastle.crypto.signers.StandardDSAEncoding;

import java.io.IOException;

/**
 * SM2 签名编码转换工具。
 * <p>
 * 提供 RAW 与 ASN.1 DER 两种常见签名格式之间的转换和自动识别。
 */
public final class SM2Signatures {

    private SM2Signatures() {
    }

    /**
     * 将 DER 签名规范化为请求的输出格式。
     *
     * @param signature DER 编码签名
     * @param format 目标输出格式；传入 {@code null} 时默认按 RAW 处理
     * @return 目标格式的签名
     */
    public static byte[] normalizeToRequested(byte[] signature, SM2SignatureFormat format) {
        if (format == SM2SignatureFormat.DER) {
            return signature;
        }
        return derToRaw(signature);
    }

    /**
     * 将输入签名规范化为 ASN.1 DER 格式。
     *
     * @param signature 原始签名
     * @param inputFormat 输入格式；传入 {@code AUTO} 时自动识别 RAW 与 DER
     * @return DER 编码签名
     * @throws GmkitException 当签名既不是合法 RAW 也不是合法 DER 时抛出
     */
    public static byte[] normalizeToDer(byte[] signature, SM2SignatureInputFormat inputFormat) {
        if (inputFormat == SM2SignatureInputFormat.DER) {
            return signature;
        }
        if (inputFormat == SM2SignatureInputFormat.RAW) {
            return rawToDer(signature);
        }
        Checks.requireNonNull(signature, "Invalid SM2 signature: input");
        if (signature.length == SM2Domain.RAW_SIGNATURE_LENGTH) {
            return rawToDer(signature);
        }
        if (looksLikeDerSignature(signature)) {
            return signature;
        }
        throw new GmkitException(Messages.invalidSm2Signature());
    }

    /**
     * 将 ASN.1 DER 签名转换为 RAW 格式。
     *
     * @param derSignature DER 编码签名
     * @return 64 字节的 RAW 签名（r||s）
     * @throws GmkitException 当输入不是合法 DER 签名时抛出
     */
    public static byte[] derToRaw(byte[] derSignature) {
        try {
            java.math.BigInteger[] rs = StandardDSAEncoding.INSTANCE.decode(SM2Domain.DOMAIN_PARAMS.getN(), derSignature);
            return PlainDSAEncoding.INSTANCE.encode(SM2Domain.DOMAIN_PARAMS.getN(), rs[0], rs[1]);
        } catch (IOException ex) {
            throw new GmkitException(Messages.invalidSm2DerSignature(), ex);
        }
    }

    /**
     * 将 RAW 签名转换为 ASN.1 DER 格式。
     *
     * @param rawSignature 64 字节的 RAW 签名（r||s）
     * @return DER 编码签名
     * @throws GmkitException 当输入不是 64 字节 RAW 签名时抛出
     */
    public static byte[] rawToDer(byte[] rawSignature) {
        Checks.requireNonNull(rawSignature, "SM2 RAW signature");
        if (rawSignature.length != SM2Domain.RAW_SIGNATURE_LENGTH) {
            throw new GmkitException(Messages.invalidSm2RawSignatureLength(SM2Domain.RAW_SIGNATURE_LENGTH));
        }
        try {
            java.math.BigInteger[] rs = PlainDSAEncoding.INSTANCE.decode(SM2Domain.DOMAIN_PARAMS.getN(), rawSignature);
            return StandardDSAEncoding.INSTANCE.encode(SM2Domain.DOMAIN_PARAMS.getN(), rs[0], rs[1]);
        } catch (IOException ex) {
            throw new GmkitException(Messages.invalidSm2RawSignatureEncoding(), ex);
        }
    }

    static boolean looksLikeDerSignature(byte[] signature) {
        return signature.length > 8
            && signature.length != SM2Domain.RAW_SIGNATURE_LENGTH
            && signature[0] == 0x30;
    }
}
