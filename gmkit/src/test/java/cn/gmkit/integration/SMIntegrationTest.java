package cn.gmkit.integration;

import cn.gmkit.core.*;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm3.SM3;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;
import cn.gmkit.zuc.ZUC;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SMIntegrationTest {

    @Test
    void sm2ShouldProtectSm4SessionKeyAndSm3ShouldDigestCiphertext() {
        SM2 sm2 = new SM2();
        SM3 sm3 = new SM3();
        SM4 sm4 = new SM4();
        SM2KeyPair sm2KeyPair = sm2.generateKeyPair(false);
        byte[] sm4Key = sm4.generateKey();
        byte[] iv = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "IV");
        byte[] plaintext = Texts.utf8("跨算法集成回归");

        byte[] wrappedKey = sm2.encrypt(sm2KeyPair.publicKey(), sm4Key, SM2CipherMode.C1C3C2);
        byte[] unwrappedKey = sm2.decrypt(sm2KeyPair.privateKey(), wrappedKey, SM2CipherMode.C1C3C2);
        SM4CipherResult ciphertext = sm4.encrypt(
            sm4Key,
            plaintext,
            SM4Options.builder()
                .mode(SM4CipherMode.CBC)
                .padding(SM4Padding.PKCS7)
                .iv(iv)
                .build());

        String digest = sm3.digestHex(ciphertext.ciphertext());

        assertArrayEquals(sm4Key, unwrappedKey);
        assertArrayEquals(
            plaintext,
            sm4.decrypt(
                unwrappedKey,
                ciphertext,
                SM4Options.builder()
                    .mode(SM4CipherMode.CBC)
                    .padding(SM4Padding.PKCS7)
                    .iv(iv)
                    .build()));
        assertEquals(digest, sm3.digestHex(ciphertext.ciphertext()));
        assertNotEquals(digest, sm3.digestHex(plaintext));
    }

    @Test
    void hybridHelperShouldRoundTripWithDefaultAeadSettings() {
        SM2KeyPair keyPair = new SM2().generateKeyPair(false);
        SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();

        SM2Sm4HybridPayload payload = hybrid.encrypt(keyPair.publicKey(), "后端统一混合加密");

        assertEquals(SM4CipherMode.GCM, payload.mode());
        assertEquals(SM4Padding.NONE, payload.padding());
        assertTrue(payload.hasIv());
        assertTrue(payload.hasTag());
        assertEquals(12, payload.iv().length);
        assertEquals(16, payload.tag().length);
        assertEquals("后端统一混合加密", hybrid.decryptToUtf8(keyPair.privateKey(), payload));
    }

    @Test
    void hybridHelperShouldPreserveExplicitSm4Options() {
        SM2KeyPair keyPair = new SM2().generateKeyPair(false);
        SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();
        byte[] iv = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "IV");
        byte[] aad = Texts.utf8("backend-metadata");

        SM2Sm4HybridPayload payload = hybrid.encrypt(
            keyPair.publicKey(),
            Texts.utf8("hybrid-gcm"),
            SM4Options.builder()
                .mode(SM4CipherMode.GCM)
                .padding(SM4Padding.NONE)
                .iv(iv)
                .aad(aad)
                .tagLength(16)
                .build());

        assertArrayEquals(iv, payload.iv());
        assertEquals("hybrid-gcm", hybrid.decryptToUtf8(keyPair.privateKey(), payload));
        assertNotNull(payload.ciphertextBase64());
        assertNotNull(payload.encryptedKeyBase64());
    }

    @Test
    void sharedAlgorithmsShouldProtectUnicodePayloadsWithAlignedKeys() {
        SM3 sm3 = new SM3();
        byte[] zucKey = HexCodec.decodeStrict("00112233445566778899aabbccddeeff", "ZUC key");
        byte[] zucIv = HexCodec.decodeStrict("ffeeddccbbaa99887766554433221100", "ZUC IV");
        byte[] payload = Texts.utf8("SM2/SM3/SM4/ZUC 联合链路 😊\n第二行");

        byte[] ciphertext = ZUC.encrypt(zucKey, zucIv, payload);
        String digest = sm3.digestHex(ciphertext);

        assertArrayEquals(payload, ZUC.decrypt(zucKey, zucIv, ciphertext));
        assertEquals(digest, sm3.digestHex(ciphertext));
        assertNotEquals(digest, sm3.digestHex(payload));
    }
}
