package cn.gmkit.sm3;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.Texts;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SM3ContractsTest {

    private static final String DIGEST_TEXT = "国密摘要";
    private static final byte[] DIGEST_BYTES = Texts.utf8(DIGEST_TEXT);
    private static final byte[] HMAC_KEY = Texts.utf8("secret-key");
    private static final String HMAC_TEXT = "hmac-payload";
    private static final byte[] HMAC_BYTES = Texts.utf8(HMAC_TEXT);
    private static final String MULTILINGUAL_TEXT = "Hello 你好 مرحبا Привет 👋";
    private static final byte[] MULTILINGUAL_KEY = Texts.utf8("密钥-key");

    private final SM3 sm3 = new SM3();

    @Test
    void digestOverloadsShouldRemainConsistentAcrossReturnFormats() {
        byte[] binary = sm3.digest(DIGEST_BYTES);

        assertArrayEquals(binary, sm3.digest(DIGEST_TEXT));
        assertEquals(HexCodec.encode(binary), sm3.digestHex(DIGEST_TEXT));
        assertEquals(Base64Codec.encode(binary), sm3.digestBase64(DIGEST_TEXT));
    }

    @Test
    void hmacOverloadsShouldRemainConsistentAcrossReturnFormats() {
        byte[] binary = sm3.hmac(HMAC_KEY, HMAC_BYTES);

        assertArrayEquals(binary, sm3.hmac(HMAC_KEY, HMAC_TEXT));
        assertEquals(HexCodec.encode(binary), sm3.hmacHex(HMAC_KEY, HMAC_BYTES));
        assertEquals(HexCodec.encode(binary), sm3.hmacHex(HMAC_KEY, HMAC_TEXT));
        assertEquals(Base64Codec.encode(binary), sm3.hmacBase64(HMAC_KEY, HMAC_BYTES));
        assertEquals(Base64Codec.encode(binary), sm3.hmacBase64(HMAC_KEY, HMAC_TEXT));
    }

    @Test
    void charsetAwareApisShouldFollowDocumentedEncodingContract() {
        byte[] utf16Bytes = MULTILINGUAL_TEXT.getBytes(StandardCharsets.UTF_16LE);

        assertArrayEquals(utf16Bytes, Texts.bytes(MULTILINGUAL_TEXT, StandardCharsets.UTF_16LE));
        assertArrayEquals(sm3.digest(utf16Bytes), sm3.digest(MULTILINGUAL_TEXT, StandardCharsets.UTF_16LE));
        assertEquals(
            HexCodec.encode(sm3.digest(utf16Bytes)),
            sm3.digestHex(MULTILINGUAL_TEXT, StandardCharsets.UTF_16LE));
        assertArrayEquals(
            sm3.digest(Texts.utf8(MULTILINGUAL_TEXT)),
            sm3.digest(MULTILINGUAL_TEXT, null));
        assertArrayEquals(
            sm3.hmac(MULTILINGUAL_KEY, utf16Bytes),
            sm3.hmac(MULTILINGUAL_KEY, MULTILINGUAL_TEXT, StandardCharsets.UTF_16LE));
        assertEquals(
            Base64Codec.encode(sm3.hmac(MULTILINGUAL_KEY, utf16Bytes)),
            sm3.hmacBase64(MULTILINGUAL_KEY, MULTILINGUAL_TEXT, StandardCharsets.UTF_16LE));
        assertArrayEquals(
            sm3.hmac(MULTILINGUAL_KEY, Texts.utf8(MULTILINGUAL_TEXT)),
            sm3.hmac(MULTILINGUAL_KEY, MULTILINGUAL_TEXT, null));
    }
}
