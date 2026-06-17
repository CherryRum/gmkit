package cn.gmkit.sm2;

import cn.gmkit.core.*;
import cn.gmkit.sm3.SM3Util;
import org.bouncycastle.crypto.CryptoException;
import org.bouncycastle.crypto.params.ECPrivateKeyParameters;
import org.bouncycastle.crypto.params.ECPublicKeyParameters;
import org.bouncycastle.crypto.params.ParametersWithRandom;
import org.bouncycastle.math.ec.ECPoint;

import java.security.MessageDigest;

final class SM2SignerSupport {

    private SM2SignerSupport() {
    }

    static byte[] sign(String privateKeyHex, byte[] message, SM2SignOptions options) {
        SM2SignOptions resolved = Checks.defaultIfNull(options, SM2SignOptions.builder().build());
        byte[] safeMessage = Bytes.requireNonNull(message, "SM2 message");
        ECPrivateKeyParameters privateKey = SM2KeyOps.toPrivateKeyParameters(privateKeyHex);
        ECPoint publicPoint = SM2KeyOps.derivePublicPoint(privateKey);
        byte[] eHash = computeE(publicPoint, safeMessage, resolved.userId(), resolved.skipZComputation());
        return signDigest(privateKey, eHash, resolved.signatureFormat(), resolved.securityContext());
    }

    static String signHex(String privateKeyHex, byte[] message, SM2SignOptions options) {
        return HexCodec.encode(sign(privateKeyHex, message, options));
    }

    static String signBase64(String privateKeyHex, byte[] message, SM2SignOptions options) {
        return Base64Codec.encode(sign(privateKeyHex, message, options));
    }

    static byte[] signDigest(
        String privateKeyHex,
        byte[] eHash,
        SM2SignatureFormat signatureFormat,
        GmSecurityContext securityContext) {
        ECPrivateKeyParameters privateKey = SM2KeyOps.toPrivateKeyParameters(privateKeyHex);
        return signDigest(privateKey, Bytes.requireNonNull(eHash, "SM2 digest"), signatureFormat, securityContext);
    }

    private static byte[] signDigest(
        ECPrivateKeyParameters privateKey,
        byte[] eHash,
        SM2SignatureFormat signatureFormat,
        GmSecurityContext securityContext) {
        SM2DigestSigner signer = new SM2DigestSigner();
        signer.init(true, new ParametersWithRandom(privateKey, SM2Domain.context(securityContext).secureRandom()));
        try {
            byte[] der = signer.generateSignature(eHash);
            SM2SignatureFormat resolvedFormat = Checks.defaultIfNull(signatureFormat, SM2SignatureFormat.RAW);
            return resolvedFormat == SM2SignatureFormat.DER ? der : SM2Signatures.derToRaw(der);
        } catch (CryptoException ex) {
            throw new GmkitException(Messages.sm2SigningFailed(), ex);
        }
    }

    static boolean verify(String publicKeyHex, byte[] message, byte[] signature, SM2VerifyOptions options) {
        SM2VerifyOptions resolved = Checks.defaultIfNull(options, SM2VerifyOptions.builder().build());
        byte[] safeMessage = Bytes.requireNonNull(message, "SM2 message");
        byte[] safeSignature = Bytes.requireNonNull(signature, "SM2 signature");
        ECPublicKeyParameters publicKey = SM2KeyOps.toPublicKeyParameters(publicKeyHex);
        try {
            byte[] derSignature = SM2Signatures.normalizeToDer(safeSignature, resolved.signatureFormat());
            byte[] eHash = computeE(publicKey.getQ(), safeMessage, resolved.userId(), resolved.skipZComputation());
            return verifyDigest(publicKey, eHash, derSignature);
        } catch (GmkitException ex) {
            return false;
        }
    }

    static boolean verify(String publicKeyHex, byte[] message, String signature, SM2VerifyOptions options) {
        byte[] signatureBytes = ByteEncodings.decodeAuto(signature, "signature");
        return verify(publicKeyHex, message, signatureBytes, options);
    }

    static boolean verifyDigest(String publicKeyHex, byte[] eHash, byte[] derSignature) {
        ECPublicKeyParameters publicKey = SM2KeyOps.toPublicKeyParameters(publicKeyHex);
        return verifyDigest(publicKey, Bytes.requireNonNull(eHash, "SM2 digest"), Bytes.requireNonNull(derSignature, "SM2 signature"));
    }

    private static boolean verifyDigest(ECPublicKeyParameters publicKey, byte[] eHash, byte[] derSignature) {
        SM2DigestSigner signer = new SM2DigestSigner();
        signer.init(false, publicKey);
        return signer.verifySignature(eHash, derSignature);
    }

    static byte[] computeZ(String userId, String publicKeyHex) {
        return computeZ(userId, SM2KeyOps.toPublicKeyPoint(publicKeyHex));
    }

    private static byte[] computeZ(String userId, ECPoint publicPoint) {
        byte[] userIdBytes = SM2Domain.userIdBytes(userId);
        byte[] entl = SM2Domain.userIdBitLength(userIdBytes);
        ECPoint normalizedPoint = publicPoint.normalize();
        byte[] px = org.bouncycastle.util.BigIntegers.asUnsignedByteArray(
            SM2Domain.CURVE_LENGTH,
            normalizedPoint.getAffineXCoord().toBigInteger());
        byte[] py = org.bouncycastle.util.BigIntegers.asUnsignedByteArray(
            SM2Domain.CURVE_LENGTH,
            normalizedPoint.getAffineYCoord().toBigInteger());
        return SM3Util.digest(
            Bytes.concat(entl, userIdBytes, SM2Domain.CURVE_A, SM2Domain.CURVE_B, SM2Domain.CURVE_GX, SM2Domain.CURVE_GY, px, py));
    }

    static byte[] computeE(String publicKeyHex, byte[] message, String userId, boolean skipZComputation) {
        return computeE(SM2KeyOps.toPublicKeyPoint(publicKeyHex), message, userId, skipZComputation);
    }

    private static byte[] computeE(ECPoint publicPoint, byte[] message, String userId, boolean skipZComputation) {
        byte[] safeMessage = Bytes.requireNonNull(message, "SM2 message");
        if (skipZComputation) {
            return computeEWithoutZ(safeMessage);
        }
        return SM3Util.digest(Bytes.concat(computeZ(userId, publicPoint), safeMessage));
    }

    static byte[] computeEWithoutZ(byte[] message) {
        return SM3Util.digest(Bytes.requireNonNull(message, "SM2 message"));
    }

    static boolean confirmResponder(byte[] expectedS2, byte[] confirmationTag) {
        if (!Checks.hasBytes(expectedS2) || !Checks.hasBytes(confirmationTag)) {
            return false;
        }
        return MessageDigest.isEqual(expectedS2, confirmationTag);
    }
}
