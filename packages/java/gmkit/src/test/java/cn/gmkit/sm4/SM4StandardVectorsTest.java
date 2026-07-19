package cn.gmkit.sm4;

import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.core.Texts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class SM4StandardVectorsTest {

    private static final byte[] KEY = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
    private static final byte[] IV = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "IV");
    private static final byte[] NONCE_12 = HexCodec.decodeStrict("00112233445566778899aabb", "nonce");
    private final SM4 sm4 = new SM4();

    @Test
    void ecbNoPaddingShouldMatchOfficialVector() {
        byte[] plaintext = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "plaintext");

        SM4CipherResult encrypted = sm4.encrypt(
            KEY,
            plaintext,
            SM4Options.builder()
                .mode(SM4CipherMode.ECB)
                .padding(SM4Padding.NONE)
                .build());

        assertEquals("681edf34d206965e86b3e94f536e4246", encrypted.ciphertextHex());
        assertArrayEquals(
            plaintext,
            sm4.decrypt(
                KEY,
                encrypted.ciphertext(),
                SM4Options.builder()
                    .mode(SM4CipherMode.ECB)
                    .padding(SM4Padding.NONE)
                    .build()));
    }

    @Test
    void gcmShouldMatchBouncyCastleVector() {
        byte[] plaintext = HexCodec.decodeStrict(
            "00112233445566778899aabbccddeeff102030405060708090a0b0c0d0e0f000",
            "plaintext");
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .iv(HexCodec.decodeStrict("000102030405060708090a0b", "nonce"))
            .aad(HexCodec.decodeStrict("a1a2a3a4a5", "AAD"))
            .tagLength(16)
            .build();

        SM4CipherResult encrypted = sm4.encrypt(KEY, plaintext, options);

        // 与 TypeScript 测试使用同一组 Bouncy Castle 固定输出，避免仅验证自身往返。
        assertEquals(
            "55303aa2f5e4cf68ec192910178188aa98d919ed1031ce3fd61419ef400de37b",
            encrypted.ciphertextHex());
        assertEquals("e1fc34aeb1fc2cc1fd4dff35500763eb", encrypted.tagHex());
        assertArrayEquals(plaintext, sm4.decrypt(KEY, encrypted, options));
    }

    @Test
    void ccmShouldMatchBouncyCastleVector() {
        byte[] plaintext = HexCodec.decodeStrict(
            "00112233445566778899aabbccddeeff102030405060708090a0b0c0d0e0f000",
            "plaintext");
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.CCM)
            .padding(SM4Padding.NONE)
            .iv(NONCE_12)
            .aad(HexCodec.decodeStrict("a1a2a3a4a5", "AAD"))
            .tagLength(12)
            .build();

        SM4CipherResult encrypted = sm4.encrypt(KEY, plaintext, options);

        assertEquals(
            "257356b9c53ddf366101dda6c6fc781ba563684a023b6320b950188eb6e0c0bd",
            encrypted.ciphertextHex());
        assertEquals("5b90d0072b9352c59d7b1623", encrypted.tagHex());
        assertArrayEquals(plaintext, sm4.decrypt(KEY, encrypted, options));
    }

    @ParameterizedTest(name = "{0} should match the shared differential output")
    @MethodSource("streamModeVectors")
    void streamModesShouldMatchTypeScriptDifferentialVectors(
        SM4CipherMode mode,
        String expectedCiphertext) {
        byte[] plaintext = HexCodec.decodeStrict(
            "00112233445566778899aabbccddeeff102030405060708090a0b0c0d0e0f000",
            "plaintext");
        SM4Options options = SM4Options.builder()
            .mode(mode)
            .padding(SM4Padding.NONE)
            .iv(IV)
            .build();

        SM4CipherResult encrypted = sm4.encrypt(KEY, plaintext, options);

        assertEquals(expectedCiphertext, encrypted.ciphertextHex());
        assertArrayEquals(plaintext, sm4.decrypt(KEY, encrypted, options));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("roundTripCases")
    void roundTripShouldCoverMultipleModes(String name, byte[] plaintext, SM4Options options) {
        SM4CipherResult encrypted = sm4.encrypt(KEY, plaintext, options);
        byte[] decrypted = sm4.decrypt(KEY, encrypted, options);

        assertArrayEquals(plaintext, decrypted, name);
        if (options.mode() == SM4CipherMode.GCM || options.mode() == SM4CipherMode.CCM) {
            assertEquals(options.tagLength().intValue(), encrypted.tag().length, name);
        }
    }

    @Test
    void ecbShouldBeDeterministicForSamePlaintextAndKey() {
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.ECB)
            .padding(SM4Padding.PKCS7)
            .build();

        SM4CipherResult left = sm4.encrypt(KEY, Texts.utf8("deterministic"), options);
        SM4CipherResult right = sm4.encrypt(KEY, Texts.utf8("deterministic"), options);

        assertEquals(left.ciphertextHex(), right.ciphertextHex());
    }

    @Test
    void cbcShouldProduceDifferentCiphertextForDifferentIv() {
        byte[] plaintext = Texts.utf8("same plaintext");

        SM4CipherResult left = sm4.encrypt(
            KEY,
            plaintext,
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(IV)
                .build());
        SM4CipherResult right = sm4.encrypt(
            KEY,
            plaintext,
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(HexCodec.decodeStrict("0f0e0d0c0b0a09080706050403020100", "IV"))
                .build());

        assertNotEquals(left.ciphertextHex(), right.ciphertextHex());
    }

    @Test
    void multilingualStringShouldRoundTripAcrossCharsets() {
        String plaintext = "Hello 你好 مرحبا Привет 👋";

        SM4CipherResult utf8Encrypted = sm4.encrypt(
            KEY,
            plaintext,
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(IV)
                .build());
        SM4CipherResult utf16Encrypted = sm4.encrypt(
            KEY,
            plaintext,
            StandardCharsets.UTF_16LE,
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(IV)
                .build());

        assertEquals(
            plaintext,
            sm4.decryptToUtf8(
                KEY,
                utf8Encrypted,
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(IV)
                    .build()));
        assertEquals(
            plaintext,
            sm4.decryptToString(
                KEY,
                utf16Encrypted,
                StandardCharsets.UTF_16LE,
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(IV)
                    .build()));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("unicodePlaintexts")
    void unicodePlaintextsShouldRoundTripAcrossBlockAndAeadModes(String name, String plaintext) {
        SM4Options cbc = SM4Options.builder()
            .mode(SM4CipherMode.CBC)
            .padding(SM4Padding.PKCS7)
            .iv(IV)
            .build();
        SM4Options gcm = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .iv(NONCE_12)
            .aad(Texts.utf8("aad-" + name))
            .tagLength(16)
            .build();

        SM4CipherResult cbcEncrypted = sm4.encrypt(KEY, plaintext, cbc);
        SM4CipherResult gcmEncrypted = sm4.encrypt(KEY, plaintext, gcm);

        assertEquals(plaintext, sm4.decryptToUtf8(KEY, cbcEncrypted, cbc), name);
        assertEquals(plaintext, sm4.decryptToUtf8(KEY, gcmEncrypted, gcm), name);
    }

    private static Stream<Arguments> roundTripCases() {
        return Stream.of(
            Arguments.of(
                "ECB/PKCS7 UTF-8",
                Texts.utf8("hello gmkit"),
                SM4Options.builder()
                    .mode(SM4CipherMode.ECB)
                    .padding(SM4Padding.PKCS7)
                    .build()),
            Arguments.of(
                "CBC/PKCS7 UTF-8",
                Texts.utf8("cbc-pkcs7"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(IV)
                    .build()),
            Arguments.of(
                "CBC/NONE block-aligned",
                HexCodec.decodeStrict("00112233445566778899aabbccddeeff", "plaintext"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.NONE)
                    .iv(IV)
                    .build()),
            Arguments.of(
                "CBC/ZERO short input",
                Texts.utf8("zero-padding"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.ZERO)
                    .iv(IV)
                    .build()),
            Arguments.of(
                "CTR binary payload",
                HexCodec.decodeStrict("00112233445566778899aabbccddee", "plaintext"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CTR)
                    .padding(SM4Padding.NONE)
                    .iv(IV)
                    .build()),
            Arguments.of(
                "CFB Chinese text",
                Texts.utf8("国密工具"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CFB)
                    .padding(SM4Padding.NONE)
                    .iv(IV)
                    .build()),
            Arguments.of(
                "OFB empty payload",
                new byte[0],
                SM4Options.builder()
                    .mode(SM4CipherMode.OFB)
                    .padding(SM4Padding.NONE)
                    .iv(IV)
                    .build()),
            Arguments.of(
                "GCM with AAD",
                Texts.utf8("authenticated payload"),
                SM4Options.builder()
                    .mode(SM4CipherMode.GCM)
                    .padding(SM4Padding.NONE)
                    .iv(NONCE_12)
                    .aad(Texts.utf8("aad"))
                    .tagLength(16)
                    .build()),
            Arguments.of(
                "CCM with AAD",
                Texts.utf8("ccm payload"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CCM)
                    .padding(SM4Padding.NONE)
                    .iv(NONCE_12)
                    .aad(Texts.utf8("aad"))
                    .tagLength(12)
                    .build()));
    }

    private static Stream<Arguments> streamModeVectors() {
        return Stream.of(
            Arguments.of(
                SM4CipherMode.CTR,
                "0689be5279f30edaa2145d392d7517957f273d0b10c38c814a31a32551e05d1a"),
            Arguments.of(
                SM4CipherMode.CFB,
                "0689be5279f30edaa2145d392d751795f2bea09ebfa5646f1fd54174c3e52b5d"),
            Arguments.of(
                SM4CipherMode.OFB,
                "0689be5279f30edaa2145d392d751795e3cf720ce7e32afdf1ff5c540dc31820"));
    }

    private static Stream<Arguments> unicodePlaintexts() {
        return Stream.of(
            Arguments.of("Chinese punctuation", "你好，GMKit！这是中文测试。"),
            Arguments.of("Emoji", "国密测试 😊🚀🔥"),
            Arguments.of("Mixed Unicode", "中文 + emoji 😊 + English + 123"),
            Arguments.of("Newlines and tabs", "第一行\nsecond line\t第三行"),
            Arguments.of("Leading and trailing spaces", "  前后空格\tspaces  "),
            Arguments.of("Long text", longPlaintext()));
    }

    private static String longPlaintext() {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 80; i++) {
            builder.append("国密长文本😊");
        }
        return builder.toString();
    }
}
