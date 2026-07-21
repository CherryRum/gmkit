package cn.gmkit.sm2;

import cn.gmkit.core.SM2SignatureFormat;
import cn.gmkit.core.SM2SignatureInputFormat;
import cn.gmkit.core.Texts;
import org.bouncycastle.crypto.params.ParametersWithID;
import org.bouncycastle.crypto.params.ParametersWithRandom;
import org.bouncycastle.crypto.signers.SM2Signer;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SM2BouncyCastleInteropTest {

    private static final byte[] MESSAGE = Texts.utf8("order=GMKIT-DEMO-0001&amount=88.00");
    private static final String USER_ID = "merchant@gmkit.cn";
    private static final String OTHER_USER_ID = "warehouse@gmkit.cn";

    private final SM2 sm2 = new SM2();

    @Test
    void standardSignatureShouldInteroperateWithBouncyCastleInBothDirections() throws Exception {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);

        byte[] gmkitSignature = sm2.sign(
            keyPair.privateKey(),
            MESSAGE,
            SM2SignOptions.builder()
                .userId(USER_ID)
                .signatureFormat(SM2SignatureFormat.DER)
                .build());
        assertTrue(verifyWithBouncyCastle(keyPair.publicKey(), USER_ID, MESSAGE, gmkitSignature));

        byte[] bouncyCastleSignature = signWithBouncyCastle(keyPair.privateKey(), USER_ID, MESSAGE);
        assertTrue(sm2.verify(
            keyPair.publicKey(),
            MESSAGE,
            bouncyCastleSignature,
            SM2VerifyOptions.builder()
                .userId(USER_ID)
                .signatureFormat(SM2SignatureInputFormat.DER)
                .build()));
    }

    @Test
    void standardSignatureShouldRejectDifferentUserId() throws Exception {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] signature = signWithBouncyCastle(keyPair.privateKey(), USER_ID, MESSAGE);

        assertFalse(sm2.verify(
            keyPair.publicKey(),
            MESSAGE,
            signature,
            SM2VerifyOptions.builder()
                .userId(OTHER_USER_ID)
                .signatureFormat(SM2SignatureInputFormat.DER)
                .build()));
        assertFalse(verifyWithBouncyCastle(keyPair.publicKey(), OTHER_USER_ID, MESSAGE, signature));
    }

    @Test
    void legacyNoZSignatureShouldNotPassBouncyCastleStandardVerification() throws Exception {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        SM2SignOptions signOptions = SM2SignOptions.builder()
            .skipZComputation(true)
            .signatureFormat(SM2SignatureFormat.DER)
            .build();
        SM2VerifyOptions verifyOptions = SM2VerifyOptions.builder()
            .skipZComputation(true)
            .signatureFormat(SM2SignatureInputFormat.DER)
            .build();

        byte[] signature = sm2.sign(keyPair.privateKey(), MESSAGE, signOptions);

        assertTrue(sm2.verify(keyPair.publicKey(), MESSAGE, signature, verifyOptions));
        assertFalse(verifyWithBouncyCastle(keyPair.publicKey(), USER_ID, MESSAGE, signature));
    }

    private static byte[] signWithBouncyCastle(String privateKey, String userId, byte[] message) throws Exception {
        SM2Signer signer = new SM2Signer();
        signer.init(
            true,
            new ParametersWithID(
                new ParametersWithRandom(SM2KeyOps.toSigningPrivateKeyParameters(privateKey), new SecureRandom()),
                Texts.utf8(userId)));
        signer.update(message, 0, message.length);
        return signer.generateSignature();
    }

    private static boolean verifyWithBouncyCastle(
        String publicKey,
        String userId,
        byte[] message,
        byte[] signature) {
        SM2Signer signer = new SM2Signer();
        signer.init(false, new ParametersWithID(SM2KeyOps.toPublicKeyParameters(publicKey), Texts.utf8(userId)));
        signer.update(message, 0, message.length);
        return signer.verifySignature(signature);
    }
}
