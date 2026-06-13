package cn.gmkit.sm4;

import cn.gmkit.core.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SM4ErrorHandlingTest {

    private static final byte[] KEY = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
    private static final byte[] IV = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "IV");
    private static final byte[] NONCE_12 = HexCodec.decodeStrict("00112233445566778899aabb", "nonce");
    private final SM4 sm4 = new SM4();

    @Test
    void shouldRejectInvalidKeyLength() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.encrypt(new byte[8], Texts.utf8("hello"), SM4Options.builder().build()));

        assertEquals(Messages.expectedLength("SM4 key", 16, 8), exception.getMessage());
    }

    @Test
    void cbcShouldRequireIv() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.encrypt(
                KEY,
                Texts.utf8("hello"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .build()));

        assertEquals(
            Messages.bilingual("SM4 CBC 模式必须提供 IV/nonce", "SM4 CBC mode requires an IV/nonce"),
            exception.getMessage());
    }

    @Test
    void cbcShouldRejectInvalidIvLength() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.encrypt(
                KEY,
                Texts.utf8("hello"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(new byte[8])
                    .build()));

        assertEquals(Messages.expectedLength("SM4 CBC IV", 16, 8), exception.getMessage());
    }

    @Test
    void gcmShouldRejectInvalidNonceLength() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.encrypt(
                KEY,
                Texts.utf8("hello"),
                SM4Options.builder()
                    .mode(SM4CipherMode.GCM)
                    .iv(new byte[8])
                    .tagLength(16)
                    .build()));

        assertEquals(
            Messages.bilingual("SM4 GCM nonce 长度无效，应为 12 到 16 字节", "Invalid SM4 GCM nonce length: expected 12 to 16 bytes"),
            exception.getMessage());
    }

    @Test
    void cbcShouldRejectAad() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.encrypt(
                KEY,
                Texts.utf8("hello"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(IV)
                    .aad(Texts.utf8("aad"))
                    .build()));

        assertEquals(
            Messages.bilingual("SM4 的 AAD 仅在 GCM 或 CCM 模式下受支持", "SM4 AAD is only supported in GCM or CCM mode"),
            exception.getMessage());
    }

    @Test
    void gcmDecryptShouldRequireTagWhenCiphertextOnlyIsProvided() {
        SM4CipherResult encrypted = sm4.encrypt(
            KEY,
            Texts.utf8("payload"),
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .iv(NONCE_12)
                .tagLength(16)
                .build());

        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.decrypt(
                KEY,
                encrypted.ciphertext(),
                SM4Options.builder()
                    .mode(SM4CipherMode.GCM)
                    .iv(NONCE_12)
                    .tagLength(16)
                    .build()));

        assertEquals(
            Messages.bilingual(
                "SM4 GCM 解密必须提供认证 tag，请通过 SM4Options.tag(...) 设置",
                "SM4 GCM decryption requires an authentication tag; set it via SM4Options.tag(...)"),
            exception.getMessage());
    }

    @Test
    void gcmShouldReportAuthenticationFailureForWrongTag() {
        SM4CipherResult encrypted = sm4.encrypt(
            KEY,
            Texts.utf8("payload"),
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .iv(NONCE_12)
                .aad(Texts.utf8("aad"))
                .tagLength(16)
                .build());
        byte[] wrongTag = encrypted.tag();
        wrongTag[0] ^= 0x01;

        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.decrypt(
                KEY,
                encrypted.ciphertext(),
                SM4Options.builder()
                    .mode(SM4CipherMode.GCM)
                    .iv(NONCE_12)
                    .aad(Texts.utf8("aad"))
                    .tagLength(16)
                    .tag(wrongTag)
                    .build()));

        assertTrue(exception.getMessage().contains("authentication failed"));
    }

    @Test
    void gcmShouldReportAuthenticationFailureForWrongAad() {
        SM4CipherResult encrypted = sm4.encrypt(
            KEY,
            Texts.utf8("payload"),
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .iv(NONCE_12)
                .aad(Texts.utf8("aad"))
                .tagLength(16)
                .build());

        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.decrypt(
                KEY,
                encrypted.ciphertext(),
                SM4Options.builder()
                    .mode(SM4CipherMode.GCM)
                    .iv(NONCE_12)
                    .aad(Texts.utf8("other-aad"))
                    .tagLength(16)
                    .tag(encrypted.tag())
                    .build()));

        assertTrue(exception.getMessage().contains("authentication failed"));
    }

    @Test
    void nonePaddingShouldRejectNonBlockAlignedInput() {
        GmkitException exception = assertThrows(
            GmkitException.class,
            () -> sm4.encrypt(
                KEY,
                Texts.utf8("not-block-aligned"),
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.NONE)
                    .iv(IV)
                    .build()));

        assertEquals(Messages.multipleOf("Plaintext", 16), exception.getMessage());
    }
}
