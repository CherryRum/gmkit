package cn.gmkit.sm2;

import cn.gmkit.core.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SM2UtilTest {

    @Test
    void compressAndDecompressShouldRoundTrip() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        String compressed = SM2Util.compressPublicKey(keyPair.publicKey());
        String decompressed = SM2Util.decompressPublicKey(compressed);

        assertTrue(compressed.startsWith("02") || compressed.startsWith("03"));
        assertEquals(keyPair.publicKey(), decompressed);
    }

    @Test
    void signAndVerifyShouldSupportRawAndDer() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] message = Texts.utf8("gmkit-java-sm2");

        byte[] rawSignature = SM2Util.sign(
            keyPair.privateKey(),
            message,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.RAW)
                .build());
        byte[] derSignature = SM2Util.sign(
            keyPair.privateKey(),
            message,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.DER)
                .userId("")
                .build());

        assertTrue(SM2Util.verify(
            keyPair.publicKey(),
            message,
            rawSignature,
            SM2VerifyOptions.builder()
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
        assertTrue(SM2Util.verify(
            keyPair.publicKey(),
            message,
            derSignature,
            SM2VerifyOptions.builder()
                .signatureFormat(SM2SignatureInputFormat.DER)
                .userId("")
                .build()));
    }

    @Test
    void signAndVerifyShouldSupportSkipZ() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] message = Texts.utf8("skip-z");

        byte[] signature = SM2Util.sign(
            keyPair.privateKey(),
            message,
            SM2SignOptions.builder()
                .skipZComputation(true)
                .build());

        assertTrue(SM2Util.verify(
            keyPair.publicKey(),
            message,
            signature,
            SM2VerifyOptions.builder()
                .skipZComputation(true)
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
        assertFalse(SM2Util.verify(
            keyPair.publicKey(),
            message,
            signature,
            SM2VerifyOptions.builder()
                .skipZComputation(false)
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
    }

    @Test
    void encryptAndDecryptShouldSupportBothLayouts() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] plaintext = Texts.utf8("layout-compatibility");

        byte[] c1c3c2 = SM2Util.encrypt(
            keyPair.publicKey(),
            plaintext,
            SM2CipherMode.C1C3C2);
        byte[] c1c2c3 = SM2Util.encrypt(
            keyPair.publicKey(),
            plaintext,
            SM2CipherMode.C1C2C3);

        assertArrayEquals(
            plaintext,
            SM2Util.decrypt(keyPair.privateKey(), c1c3c2, SM2CipherMode.C1C3C2));
        assertArrayEquals(
            plaintext,
            SM2Util.decrypt(keyPair.privateKey(), c1c2c3, SM2CipherMode.C1C2C3));
        assertNotEquals(HexCodec.encode(c1c3c2), HexCodec.encode(c1c2c3));
    }

    @Test
    void ciphertextDerCodecShouldRoundTrip() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] ciphertext = SM2Util.encrypt(
            keyPair.publicKey(),
            Texts.utf8("der-roundtrip"));

        byte[] der = SM2Ciphertexts.encodeDer(ciphertext, SM2CipherMode.C1C3C2);
        byte[] restored = SM2Ciphertexts.decodeDer(der, SM2CipherMode.C1C3C2);

        assertArrayEquals(ciphertext, restored);
    }

    @Test
    void signatureCodecShouldRoundTripBetweenDerAndRaw() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] signature = SM2Util.sign(
            keyPair.privateKey(),
            Texts.utf8("codec"),
            SM2SignOptions.builder().signatureFormat(SM2SignatureFormat.DER).build());

        byte[] raw = SM2Signatures.derToRaw(signature);
        byte[] restored = SM2Signatures.rawToDer(raw);

        assertArrayEquals(signature, restored);
    }

    @Test
    void signDigestShouldSupportDirectEInput() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] directE = Texts.utf8("abc");
        byte[] rawSignature = SM2Util.signDigest(keyPair.privateKey(), directE, SM2SignatureFormat.RAW);

        assertTrue(SM2Util.verifyDigest(keyPair.publicKey(), directE, SM2Signatures.rawToDer(rawSignature)));
        assertFalse(SM2Util.verifyWithoutZ(keyPair.publicKey(), directE, rawSignature, SM2SignatureInputFormat.RAW));
    }

    @Test
    void decryptShouldAcceptAsn1CiphertextFromBytesHexAndBase64() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] plaintext = Texts.utf8("asn1-compatible");
        byte[] rawCiphertext = SM2Util.encrypt(keyPair.publicKey(), plaintext, SM2CipherMode.C1C3C2);
        byte[] asn1Ciphertext = SM2Ciphertexts.encodeAsn1(rawCiphertext, SM2CipherMode.C1C3C2);

        assertArrayEquals(plaintext, SM2Util.decrypt(keyPair.privateKey(), asn1Ciphertext, SM2CipherMode.C1C3C2));
        assertArrayEquals(
            plaintext,
            SM2Util.decrypt(keyPair.privateKey(), HexCodec.encode(asn1Ciphertext), SM2CipherMode.C1C3C2));
        assertArrayEquals(
            plaintext,
            SM2Util.decrypt(keyPair.privateKey(), Base64Codec.encode(asn1Ciphertext), SM2CipherMode.C1C3C2));
    }

    @Test
    void cryptToolsVectorsShouldDifferentiateWithZAndDirectE() {
        byte[] message = HexCodec.decodeStrict("616263", "message");
        String publicKey = "04609EA50E3212338AB9074492175300724BA2ACEC5DADAA26A0188CE426BE5769"
            + "7D5C8ECDA528D93EA689D5F4975508694299129C1AE6B2D10B11E9BE0CEF8C1B";
        byte[] withZSignature = HexCodec.decodeStrict(
            "44A6DDC9492AA9C16EA85FF4BC618F35AAF71D5599264E291AD3D4122FFE645B"
                + "18148DF631C2F3125A347D4C37123005DC5333707CA9DF48FD47FB9CC267DC7E",
            "withZSignature");
        byte[] directESignature = HexCodec.decodeStrict(
            "68E99D2487389A8F28483225B7119455951B937B1E9A9DDF61A77D96501AD6C9"
                + "9C4030684DA568D9D37CA10ACA7CA77F7D389C2E46630720B56323BF7B1A2E4B",
            "directESignature");

        assertTrue(SM2Util.verify(
            publicKey,
            message,
            withZSignature,
            SM2VerifyOptions.builder()
                .userId(SM2Util.DEFAULT_USER_ID)
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
        assertFalse(SM2Util.verifyWithoutZ(publicKey, message, withZSignature, SM2SignatureInputFormat.RAW));

        assertFalse(SM2Util.verify(
            publicKey,
            message,
            directESignature,
            SM2VerifyOptions.builder()
                .userId(SM2Util.DEFAULT_USER_ID)
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
        assertFalse(SM2Util.verifyWithoutZ(publicKey, message, directESignature, SM2SignatureInputFormat.RAW));
        assertFalse(SM2Util.verifyDigest(
            publicKey,
            SM2Util.computeEWithoutZ(message),
            SM2Signatures.rawToDer(directESignature)));
        assertTrue(SM2Util.verifyDigest(publicKey, message, SM2Signatures.rawToDer(directESignature)));
    }

    @Test
    void keyExchangeShouldDeriveSameSharedSecretAndConfirmTags() {
        SM2KeyPair initiatorStatic = SM2Util.generateKeyPair(false);
        SM2KeyPair initiatorEphemeral = SM2Util.generateKeyPair(false);
        SM2KeyPair responderStatic = SM2Util.generateKeyPair(false);
        SM2KeyPair responderEphemeral = SM2Util.generateKeyPair(false);

        byte[] initiatorKey = SM2Util.keyExchange(
            initiatorStatic.privateKey(),
            initiatorEphemeral.privateKey(),
            responderStatic.publicKey(),
            responderEphemeral.publicKey(),
            SM2KeyExchangeOptions.builder()
                .initiator(true)
                .keyBits(128)
                .selfId("ABCDEFG1234")
                .peerId("1234567ABCD")
                .build());
        byte[] responderKey = SM2Util.keyExchange(
            responderStatic.privateKey(),
            responderEphemeral.privateKey(),
            initiatorStatic.publicKey(),
            initiatorEphemeral.publicKey(),
            SM2KeyExchangeOptions.builder()
                .initiator(false)
                .keyBits(128)
                .selfId("1234567ABCD")
                .peerId("ABCDEFG1234")
                .build());

        assertArrayEquals(initiatorKey, responderKey);

        SM2KeyExchangeResult responderResult = SM2Util.keyExchangeWithConfirmation(
            responderStatic.privateKey(),
            responderEphemeral.privateKey(),
            initiatorStatic.publicKey(),
            initiatorEphemeral.publicKey(),
            SM2KeyExchangeOptions.builder()
                .initiator(false)
                .keyBits(128)
                .selfId("1234567ABCD")
                .peerId("ABCDEFG1234")
                .build());
        SM2KeyExchangeResult initiatorResult = SM2Util.keyExchangeWithConfirmation(
            initiatorStatic.privateKey(),
            initiatorEphemeral.privateKey(),
            responderStatic.publicKey(),
            responderEphemeral.publicKey(),
            SM2KeyExchangeOptions.builder()
                .initiator(true)
                .keyBits(128)
                .selfId("ABCDEFG1234")
                .peerId("1234567ABCD")
                .confirmationTag(responderResult.s1())
                .build());

        assertArrayEquals(responderResult.key(), initiatorResult.key());
        assertTrue(SM2Util.confirmResponder(responderResult.s2(), initiatorResult.s2()));
    }

    @Test
    void utilEntryPointShouldRemainUsable() {
        SM2KeyPair keyPair = SM2Util.generateKeyPair(false);
        byte[] message = Texts.utf8("compat-api");

        byte[] ciphertext = SM2Util.encrypt(keyPair.publicKey(), message, SM2CipherMode.C1C3C2);
        byte[] signature = SM2Util.signWithoutZ(keyPair.privateKey(), message, SM2SignatureFormat.RAW);

        assertArrayEquals(message, SM2Util.decrypt(keyPair.privateKey(), ciphertext, SM2CipherMode.C1C3C2));
        assertTrue(SM2Util.verifyWithoutZ(keyPair.publicKey(), message, signature, SM2SignatureInputFormat.RAW));
    }
}
