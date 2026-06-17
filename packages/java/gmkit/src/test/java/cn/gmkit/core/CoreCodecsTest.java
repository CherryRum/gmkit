package cn.gmkit.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CoreCodecsTest {

    @Test
    void strictHexShouldRejectOddLength() {
        assertThrows(GmkitException.class, () -> HexCodec.decodeStrict("abc", "test"));
    }

    @Test
    void autoDecodeShouldPreferHexBeforeBase64() {
        byte[] decoded = ByteEncodings.decodeAuto("616263", "test");
        assertArrayEquals(Texts.utf8("abc"), decoded);
    }

    @Test
    void autoDecodeShouldRejectOddLengthHexCandidate() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> ByteEncodings.decodeAuto("0xabc", "test"));

        assertEquals(Messages.invalidHexEven("test"), exception.getMessage());
    }

    @Test
    void autoDecodeShouldAcceptHexWithWhitespace() {
        byte[] decoded = ByteEncodings.decodeAuto(" 0x61 62 63 ", "test");
        assertArrayEquals(Texts.utf8("abc"), decoded);
    }

    @Test
    void base64DecoderShouldRejectBlankInput() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> Base64Codec.decode("  ", "test"));

        assertEquals(Messages.invalidBlankInput("test"), exception.getMessage());
    }

    @Test
    void base64ClassifierShouldUseCheapLexicalValidation() {
        assertTrue(Base64Codec.looksLikeBase64("YWJjZA=="));
        assertTrue(Base64Codec.isBase64("YWJjZA=="));
        assertFalse(Base64Codec.looksLikeBase64("abc"));
        assertFalse(Base64Codec.looksLikeBase64("YWJj=ZA="));
        assertFalse(Base64Codec.looksLikeBase64("YWJjZA==="));
    }

    @Test
    void autoDecodeShouldRejectObviouslyInvalidNonHexNonBase64InputWithoutFallbackDecode() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> ByteEncodings.decodeAuto("hello-world", "test"));

        assertEquals(Messages.invalidHexOrBase64("test"), exception.getMessage());
    }
}
