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
            "27bede74018082da",
            ZUC.keystreamWordsHex("00000000000000000000000000000000", "00000000000000000000000000000000", 2));
        assertEquals(
            "deeb81e388e6bbad1c44b2bbf56776644a80953ad9005380ec8d392fb3a1548b",
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
        assertEquals("deea83e08ce34453e1b832fb", HexCodec.encode(ciphertext));
        assertArrayEquals(plaintext, ZUC.decrypt(key, iv, ciphertext));
    }

    @Test
    void eea3AndEia3ShouldMatchTypeScriptProjectVectors() {
        assertEquals("ace6d69c177966fcc92ef61c", ZUC.eea3(KEY_HEX, 0x398a59b4, 0x15, 1, 96));
        assertEquals("71493e99", ZUC.eia3(KEY_HEX, 0x398a59b4, 0x15, 1, "中文 + emoji 😊 + English + 123"));
    }

    @Test
    void eia3ShouldMatchOfficialOneBitVector() {
        assertEquals(
            "c8a9595e",
            ZUC.eia3("00000000000000000000000000000000", 0, 0, 0, new byte[] {0}, 1));
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
            Arguments.of("ASCII", "hello gmkit", "b68eed8fe7c6dcc0772dc6"),
            Arguments.of("Chinese", "你好，国密", "3a5621062d5b541190a1290610c8f0"),
            Arguments.of("Emoji", "国密测试 😊🚀🔥", "3b703c0627605d1897ac1d2ed597e9fcc0700aa059f0cc1449"),
            Arguments.of("Mixed Unicode", "中文 + emoji 😊 + English + 123", "3a532c051e619b863c21dfd49f0e5694d5181f1af22016ee8be1505cdb817faba1d3d2"),
            Arguments.of("Newlines and tabs", "第一行\nsecond line\t第三行", "39472d073066530c904ec1de960818006aecfc54bc09b42c406981a65b00d8"),
            Arguments.of("Spaces", "  前后空格\tspaces  ", "fecb646a05032b23fbed085d55db7f173ae1f65faa2073"),
            Arguments.of("Symbols", "SM2/SM3/SM4/ZUC: !@#$%^&*()_+-=[]{}|;:,.<>?", "8da6b3ccdbab88824f098694af32355e6aa1d519fd250da6c6a51070988c69d0cd9a9c83938be9a45e680c"));
    }
}
