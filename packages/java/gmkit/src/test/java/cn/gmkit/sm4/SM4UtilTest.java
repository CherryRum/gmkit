package cn.gmkit.sm4;

import cn.gmkit.core.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SM4UtilTest {

    private static final byte[] KEY = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
    private static final byte[] IV = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "IV");

    @Test
    void cbcPkcs7ShouldRoundTrip() {
        SM4CipherResult encrypted = SM4Util.encrypt(
            KEY,
            Texts.utf8("hello gmkit-java"),
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(IV)
                .build());

        byte[] decrypted = SM4Util.decrypt(
            KEY,
            encrypted,
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(IV)
                .build());

        assertEquals("hello gmkit-java", Texts.utf8(decrypted));
    }

    @Test
    void gcmShouldRoundTripWithAad() {
        byte[] aad = Texts.utf8("metadata");
        byte[] gcmIv = HexCodec.decodeStrict("00112233445566778899aabb", "IV");

        SM4CipherResult encrypted = SM4Util.encrypt(
            KEY,
            Texts.utf8("aead payload"),
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .iv(gcmIv)
                .aad(aad)
                .tagLength(16)
                .build());

        assertNotNull(encrypted.tag());
        assertEquals(16, encrypted.tag().length);

        byte[] decrypted = SM4Util.decrypt(
            KEY,
            encrypted,
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .iv(gcmIv)
                .aad(aad)
                .tagLength(16)
                .build());

        assertArrayEquals(Texts.utf8("aead payload"), decrypted);
    }

    @Test
    void gcmShouldRejectTruncatedTag() {
        byte[] aad = Texts.utf8("metadata");
        byte[] gcmIv = HexCodec.decodeStrict("00112233445566778899aabb", "IV");

        SM4CipherResult encrypted = SM4Util.encrypt(
            KEY,
            Texts.utf8("aead payload"),
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .iv(gcmIv)
                .aad(aad)
                .build());

        byte[] truncatedTag = new byte[12];
        System.arraycopy(encrypted.tag(), 0, truncatedTag, 0, truncatedTag.length);

        assertThrows(
            GmkitException.class,
            () -> SM4Util.decrypt(
                KEY,
                encrypted.ciphertext(),
                SM4Options.builder()
                    .mode(SM4CipherMode.GCM)
                    .iv(gcmIv)
                    .aad(aad)
                    .tagLength(16)
                    .tag(truncatedTag)
                    .build()));
    }

    @Test
    void utilEntryPointShouldRemainUsable() {
        SM4CipherResult encrypted = SM4Util.encrypt(
            KEY,
            Texts.utf8("compat-api"),
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(IV)
                .build());

        assertEquals(
            "compat-api",
            SM4Util.decryptToUtf8(
                KEY,
                encrypted,
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(IV)
                    .build()));
    }
}
