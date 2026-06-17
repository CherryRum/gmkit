package cn.gmkit.zuc;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.Texts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ZUCStandardVectorsTest {

    private static final String KEY_HEX = "00112233445566778899aabbccddeeff";
    private static final String IV_HEX = "ffeeddccbbaa99887766554433221100";

    @Test
    void projectKeystreamVectorsShouldMatchTypeScriptImplementation() {
        assertEquals(
            "fd3c73de9d095700",
            ZUC.keystreamWordsHex("00000000000000000000000000000000", "00000000000000000000000000000000", 2));
        assertEquals(
            "64504403f3e0af510600fc2b611f7f5797a2384b8b33f25ca4314e4471f90d80",
            ZUC.keystreamHex(KEY_HEX, IV_HEX, 32));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("unicodeRoundTripCases")
    void unicodeTextShouldRoundTripAndMatchProjectCiphertext(String name, String plaintext, String expectedHex) {
        String ciphertextHex = ZUC.encryptHex(KEY_HEX, IV_HEX, plaintext);
        String ciphertextBase64 = ZUC.encryptBase64(KEY_HEX, IV_HEX, plaintext);

        assertEquals(expectedHex, ciphertextHex, name);
        assertEquals(plaintext, ZUC.decryptHexToUtf8(KEY_HEX, IV_HEX, ciphertextHex), name);
        assertEquals(plaintext, ZUC.decryptBase64ToUtf8(KEY_HEX, IV_HEX, ciphertextBase64), name);
    }

    @Test
    void byteApiShouldAllowEmptyPayload() {
        byte[] key = HexCodec.decodeStrict(KEY_HEX, "ZUC key");
        byte[] iv = HexCodec.decodeStrict(IV_HEX, "ZUC IV");

        assertEquals("", ZUC.encryptHex(KEY_HEX, IV_HEX, ""));
        assertArrayEquals(new byte[0], ZUC.encrypt(key, iv, new byte[0]));
        assertArrayEquals(new byte[0], ZUC.decrypt(key, iv, new byte[0]));
    }

    @Test
    void byteArrayRoundTripShouldPreserveBinaryPayload() {
        byte[] key = HexCodec.decodeStrict(KEY_HEX, "ZUC key");
        byte[] iv = HexCodec.decodeStrict(IV_HEX, "ZUC IV");
        byte[] plaintext = HexCodec.decodeStrict("000102030405fffefdfc8040", "payload");

        byte[] ciphertext = ZUC.encrypt(key, iv, plaintext);
        assertEquals("64514600f7e550affbfc7c6b", HexCodec.encode(ciphertext));
        assertArrayEquals(plaintext, ZUC.decrypt(key, iv, ciphertext));
    }

    @Test
    void eea3AndEia3ShouldMatchTypeScriptProjectVectors() {
        assertEquals("a0d933edc1d7b696f920c8a2", ZUC.eea3(KEY_HEX, 0x398a59b4, 0x15, 1, 96));
        assertEquals("9580e4bc", ZUC.eia3(KEY_HEX, 0x398a59b4, 0x15, 1, "中文 + emoji 😊 + English + 123"));
    }

    @Test
    void utilFacadeShouldDelegateToZuc() {
        String ciphertext = ZUCUtil.encryptBase64(KEY_HEX, IV_HEX, "工具入口 😊");

        assertEquals("工具入口 😊", ZUCUtil.decryptBase64ToUtf8(KEY_HEX, IV_HEX, ciphertext));
        assertEquals(ZUC.keystreamHex(KEY_HEX, IV_HEX, 9), ZUCUtil.keystreamHex(KEY_HEX, IV_HEX, 9));
    }

    @Test
    void base64CiphertextShouldBeValidBase64() {
        String ciphertext = ZUC.encryptBase64(KEY_HEX, IV_HEX, "base64-zuc");

        assertArrayEquals(
            ZUC.encrypt(
                HexCodec.decodeStrict(KEY_HEX, "ZUC key"),
                HexCodec.decodeStrict(IV_HEX, "ZUC IV"),
                Texts.utf8("base64-zuc")),
            Base64Codec.decode(ciphertext, "ZUC ciphertext"));
    }

    private static Stream<Arguments> unicodeRoundTripCases() {
        return Stream.of(
            Arguments.of("ASCII", "hello gmkit", "0c35286f9cc0c83c6d6988"),
            Arguments.of("Chinese", "你好，国密", "80ede4e6565d40ed8ae5679684b0f9"),
            Arguments.of("Emoji", "国密测试 😊🚀🔥", "81cbf9e65c6649e48de853be41efe0cf1d52a7d10bc36dc801"),
            Arguments.of("Mixed Unicode", "中文 + emoji 😊 + English + 123", "80e8e9e565678f7a266591440b765fa7083ab26ba013b732c35d273719d926a003a2c6"),
            Arguments.of("Newlines and tabs", "第一行\nsecond line\t第三行", "83fce8e74b6047f08a0a8f4e02701133b7ce5125ee3a15f008d5f6cd995881"),
            Arguments.of("Spaces", "  前后空格\tspaces  ", "4470a18a7e053fdfe1a946cdc1a37624e7c35b2ef813d2"),
            Arguments.of("Symbols", "SM2/SM3/SM4/ZUC: !@#$%^&*()_+-=[]{}|;:,.<>?", "371d762ca0ad9c7e554dc8043b4a3c6db7837868af16ac7a8e19671b5ad430db6feb88af1b7d4c452f896a"));
    }
}
