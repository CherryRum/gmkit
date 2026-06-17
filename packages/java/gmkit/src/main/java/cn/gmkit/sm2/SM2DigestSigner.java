package cn.gmkit.sm2;

import org.bouncycastle.crypto.CipherParameters;
import org.bouncycastle.crypto.CryptoException;
import org.bouncycastle.crypto.CryptoServicesRegistrar;
import org.bouncycastle.crypto.params.*;
import org.bouncycastle.crypto.signers.DSAKCalculator;
import org.bouncycastle.crypto.signers.RandomDSAKCalculator;
import org.bouncycastle.crypto.signers.StandardDSAEncoding;
import org.bouncycastle.math.ec.*;

import java.io.IOException;
import java.math.BigInteger;
import java.security.SecureRandom;

/**
 * SM2 摘要签名器。
 * <p>
 * 该类型仅供库内部复用，用于基于 e 值执行签名与验签。
 */
final class SM2DigestSigner implements ECConstants {

    private final DSAKCalculator kCalculator = new RandomDSAKCalculator();

    private ECDomainParameters domainParameters;
    private ECKeyParameters keyParameters;
    private SecureRandom secureRandom;

    /**
     * 初始化签名器
     *
     * @param forSigning true表示用于签名，false表示用于验签
     * @param parameters 密钥参数
     */
    public void init(boolean forSigning, CipherParameters parameters) {
        if (forSigning) {
            if (parameters instanceof ParametersWithRandom) {
                ParametersWithRandom withRandom = (ParametersWithRandom) parameters;
                this.keyParameters = (ECKeyParameters) withRandom.getParameters();
                this.secureRandom = withRandom.getRandom();
            } else {
                this.keyParameters = (ECKeyParameters) parameters;
                this.secureRandom = CryptoServicesRegistrar.getSecureRandom();
            }
            this.domainParameters = keyParameters.getParameters();
            this.kCalculator.init(domainParameters.getN(), secureRandom);
            return;
        }
        this.keyParameters = (ECKeyParameters) parameters;
        this.domainParameters = keyParameters.getParameters();
    }

    /**
     * 生成签名
     *
     * @param eHash 待签名的摘要值（e值）
     * @return DER格式的签名
     * @throws CryptoException 如果签名生成失败
     */
    public byte[] generateSignature(byte[] eHash) throws CryptoException {
        BigInteger n = domainParameters.getN();
        BigInteger e = new BigInteger(1, eHash);
        BigInteger d = ((ECPrivateKeyParameters) keyParameters).getD();
        ECMultiplier multiplier = new FixedPointCombMultiplier();

        BigInteger r;
        BigInteger s;
        do {
            BigInteger k;
            do {
                k = kCalculator.nextK();
                ECPoint point = multiplier.multiply(domainParameters.getG(), k).normalize();
                r = e.add(point.getAffineXCoord().toBigInteger()).mod(n);
            } while (r.equals(ZERO) || r.add(k).equals(n));

            BigInteger dPlusOne = d.add(ONE).modInverse(n);
            s = dPlusOne.multiply(k.subtract(r.multiply(d)).mod(n)).mod(n);
        } while (s.equals(ZERO));

        try {
            return StandardDSAEncoding.INSTANCE.encode(n, r, s);
        } catch (IOException ex) {
            throw new CryptoException("Unable to encode SM2 signature", ex);
        }
    }

    /**
     * 验证签名
     *
     * @param eHash        待验证的摘要值（e值）
     * @param derSignature DER格式的签名
     * @return 验证通过返回true，否则返回false
     */
    public boolean verifySignature(byte[] eHash, byte[] derSignature) {
        BigInteger[] rs;
        try {
            rs = StandardDSAEncoding.INSTANCE.decode(domainParameters.getN(), derSignature);
        } catch (IOException ex) {
            return false;
        }

        BigInteger n = domainParameters.getN();
        BigInteger r = rs[0];
        BigInteger s = rs[1];
        if (r.compareTo(ONE) < 0 || r.compareTo(n) >= 0) {
            return false;
        }
        if (s.compareTo(ONE) < 0 || s.compareTo(n) >= 0) {
            return false;
        }

        BigInteger e = new BigInteger(1, eHash);
        BigInteger t = r.add(s).mod(n);
        if (t.equals(ZERO)) {
            return false;
        }
        ECPoint publicPoint = ((ECPublicKeyParameters) keyParameters).getQ();
        ECPoint point = ECAlgorithms.sumOfTwoMultiplies(domainParameters.getG(), s, publicPoint, t).normalize();
        if (point.isInfinity()) {
            return false;
        }
        BigInteger expected = e.add(point.getAffineXCoord().toBigInteger()).mod(n);
        return expected.equals(r);
    }
}

