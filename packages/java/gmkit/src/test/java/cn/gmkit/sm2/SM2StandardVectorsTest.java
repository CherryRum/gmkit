package cn.gmkit.sm2;

import cn.gmkit.core.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class SM2StandardVectorsTest {

    private static final byte[] FIXED_MESSAGE = HexCodec.decodeStrict("616263", "message");
    private static final String FIXED_PUBLIC_KEY = "04609EA50E3212338AB9074492175300724BA2ACEC5DADAA26A0188CE426BE5769"
        + "7D5C8ECDA528D93EA689D5F4975508694299129C1AE6B2D10B11E9BE0CEF8C1B";
    private static final byte[] FIXED_SIGNATURE_WITH_Z = HexCodec.decodeStrict(
        "44A6DDC9492AA9C16EA85FF4BC618F35AAF71D5599264E291AD3D4122FFE645B"
            + "18148DF631C2F3125A347D4C37123005DC5333707CA9DF48FD47FB9CC267DC7E",
        "withZSignature");
    private final SM2 sm2 = new SM2();

    @Test
    void fixedDefaultUserIdVectorShouldVerify() {
        assertTrue(sm2.verify(
            FIXED_PUBLIC_KEY,
            FIXED_MESSAGE,
            FIXED_SIGNATURE_WITH_Z,
            SM2VerifyOptions.builder()
                .userId(SM2.DEFAULT_USER_ID)
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
    }

    @Test
    void signHexAndBase64ShouldVerify() {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] message = Texts.utf8("signature-string");

        String hexSignature = sm2.signHex(
            keyPair.privateKey(),
            message,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.RAW)
                .build());
        String base64Signature = sm2.signBase64(
            keyPair.privateKey(),
            message,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.DER)
                .build());

        assertTrue(sm2.verify(
            keyPair.publicKey(),
            message,
            hexSignature,
            SM2VerifyOptions.builder()
                .signatureFormat(SM2SignatureInputFormat.RAW)
                .build()));
        assertTrue(sm2.verify(
            keyPair.publicKey(),
            message,
            base64Signature,
            SM2VerifyOptions.builder()
                .signatureFormat(SM2SignatureInputFormat.DER)
                .build()));
    }

    @ParameterizedTest
    @EnumSource(value = SM2CipherMode.class)
    void ciphertextAsn1CodecShouldRoundTripForBothModes(SM2CipherMode mode) {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] plaintext = Texts.utf8("asn1-" + mode.name());
        byte[] ciphertext = sm2.encrypt(keyPair.publicKey(), plaintext, mode);

        byte[] encoded = SM2Ciphertexts.encodeAsn1(ciphertext, mode);
        byte[] decoded = SM2Ciphertexts.decodeAsn1(encoded, mode);

        assertArrayEquals(ciphertext, decoded);
        assertArrayEquals(plaintext, sm2.decrypt(keyPair.privateKey(), encoded, mode));
    }

    @Test
    void precomputedDigestShouldMatchVerifyDigest() {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] message = Texts.utf8("digest-sign");
        byte[] eHash = sm2.computeE(keyPair.publicKey(), message, SM2.DEFAULT_USER_ID, false);
        byte[] derSignature = sm2.signDigest(keyPair.privateKey(), eHash, SM2SignatureFormat.DER);

        assertTrue(sm2.verifyDigest(keyPair.publicKey(), eHash, derSignature));
    }

    @Test
    void decryptShouldAcceptGmsslStyleCiphertextWithoutPointPrefix() {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] plaintext = Texts.utf8("gmssl-compatible");
        byte[] ciphertext = sm2.encrypt(keyPair.publicKey(), plaintext, SM2CipherMode.C1C3C2);
        byte[] gmsslStyleCiphertext = new byte[ciphertext.length - 1];
        System.arraycopy(ciphertext, 1, gmsslStyleCiphertext, 0, gmsslStyleCiphertext.length);

        assertArrayEquals(plaintext, sm2.decrypt(keyPair.privateKey(), gmsslStyleCiphertext, SM2CipherMode.C1C3C2));
    }

    @Test
    void derCiphertextCodecShouldRemainStableOver1000Iterations() {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] ciphertext = sm2.encrypt(keyPair.publicKey(), Texts.utf8("der-stability"), SM2CipherMode.C1C3C2);

        for (int i = 0; i < 1000; i++) {
            byte[] der = SM2Ciphertexts.encodeDer(ciphertext, SM2CipherMode.C1C3C2);
            ciphertext = SM2Ciphertexts.decodeDer(der, SM2CipherMode.C1C3C2);
        }

        assertArrayEquals(Texts.utf8("der-stability"), sm2.decrypt(keyPair.privateKey(), ciphertext, SM2CipherMode.C1C3C2));
    }

    @Test
    void computeZShouldRemainStableForFixedPublicKey() {
        byte[] defaultZ = sm2.computeZ(SM2.DEFAULT_USER_ID, FIXED_PUBLIC_KEY);
        assertEquals("e1e7bae6607d915da177536ff7f800b5d1c523572424653b0d7ab9647a763966", HexCodec.encode(defaultZ));
        assertArrayEquals(defaultZ, sm2.computeZ("", FIXED_PUBLIC_KEY));
    }

    @Test
    void base64CiphertextShouldRoundTrip() {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        byte[] plaintext = Texts.utf8("base64-ciphertext");
        String ciphertext = Base64Codec.encode(sm2.encrypt(keyPair.publicKey(), plaintext, SM2CipherMode.C1C3C2));

        assertArrayEquals(plaintext, sm2.decrypt(keyPair.privateKey(), ciphertext, SM2CipherMode.C1C3C2));
    }

    @Test
    void multilingualTextShouldEncryptDecryptAndSignAcrossCharsets() {
        SM2KeyPair keyPair = sm2.generateKeyPair(false);
        String message = "Hello 你好 مرحبا Привет 👋";

        String utf8Ciphertext = sm2.encryptBase64(keyPair.publicKey(), message, SM2CipherMode.C1C3C2);
        String utf16Ciphertext = sm2.encryptBase64(keyPair.publicKey(), message, StandardCharsets.UTF_16LE, SM2CipherMode.C1C3C2);
        String utf8Signature = sm2.signBase64(
            keyPair.privateKey(),
            message,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.DER)
                .build());
        String utf16Signature = sm2.signBase64(
            keyPair.privateKey(),
            message,
            StandardCharsets.UTF_16LE,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.DER)
                .build());

        assertEquals(message, sm2.decryptToUtf8(keyPair.privateKey(), utf8Ciphertext, SM2CipherMode.C1C3C2));
        assertEquals(
            message,
            sm2.decryptToString(
                keyPair.privateKey(),
                Base64Codec.decode(utf16Ciphertext, "ciphertext"),
                StandardCharsets.UTF_16LE,
                SM2CipherMode.C1C3C2));
        assertTrue(
            sm2.verify(
                keyPair.publicKey(),
                message,
                utf8Signature,
                SM2VerifyOptions.builder()
                    .signatureFormat(SM2SignatureInputFormat.DER)
                    .build()));
        assertTrue(
            sm2.verify(
                keyPair.publicKey(),
                message,
                StandardCharsets.UTF_16LE,
                Base64Codec.decode(utf16Signature, "signature"),
                SM2VerifyOptions.builder()
                    .signatureFormat(SM2SignatureInputFormat.DER)
                    .build()));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("unicodeMessages")
    void unicodeMessagesShouldEncryptDecryptAndSignInBothCipherLayouts(String name, String message) {
        SM2KeyPair keyPair = sm2.generateKeyPair(true);
        byte[] plaintext = Texts.utf8(message);

        for (SM2CipherMode mode : SM2CipherMode.values()) {
            byte[] ciphertext = sm2.encrypt(keyPair.publicKey(), plaintext, mode);

            assertArrayEquals(plaintext, sm2.decrypt(keyPair.privateKey(), ciphertext, mode), name + " " + mode);
        }

        byte[] rawSignature = sm2.sign(
            keyPair.privateKey(),
            plaintext,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.RAW)
                .build());
        byte[] derSignature = sm2.sign(
            keyPair.privateKey(),
            plaintext,
            SM2SignOptions.builder()
                .signatureFormat(SM2SignatureFormat.DER)
                .build());

        assertTrue(
            sm2.verify(
                keyPair.publicKey(),
                plaintext,
                rawSignature,
                SM2VerifyOptions.builder()
                    .signatureFormat(SM2SignatureInputFormat.RAW)
                    .build()),
            name);
        assertTrue(
            sm2.verify(
                keyPair.publicKey(),
                plaintext,
                derSignature,
                SM2VerifyOptions.builder()
                    .signatureFormat(SM2SignatureInputFormat.DER)
                    .build()),
            name);
    }

    private static Stream<Arguments> unicodeMessages() {
        return Stream.of(
            Arguments.of("Chinese punctuation", "你好，GMKit！这是中文测试。"),
            Arguments.of("Emoji", "国密测试 😊🚀🔥"),
            Arguments.of("Mixed Unicode", "中文 + emoji 😊 + English + 123"),
            Arguments.of("Newlines and tabs", "第一行\nsecond line\t第三行"),
            Arguments.of("Leading and trailing spaces", "  前后空格\tspaces  "),
            Arguments.of("Long text", longMessage()));
    }

    private static String longMessage() {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 80; i++) {
            builder.append("国密长文本😊");
        }
        return builder.toString();
    }
}
