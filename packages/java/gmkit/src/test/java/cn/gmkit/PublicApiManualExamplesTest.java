package cn.gmkit;

import cn.gmkit.core.ByteEncodings;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.HexCodec;
import cn.gmkit.core.InputFormat;
import cn.gmkit.core.OutputFormat;
import cn.gmkit.integration.SM2Sm4Hybrid;
import cn.gmkit.integration.SM2Sm4HybridPayload;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.sm3.SM3;
import cn.gmkit.sm3.SM3Util;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;
import cn.gmkit.zuc.ZUC;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static cn.gmkit.core.SM4CipherMode.GCM;
import static cn.gmkit.core.SM4Padding.NONE;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 编译并执行官网公共 API 说明书中的代表性 Java 示例。 */
class PublicApiManualExamplesTest {

    private static final String MESSAGE = "order=GMKIT-DEMO-0001&amount=88.00";
    private static final String TAMPERED = "order=GMKIT-DEMO-0001&amount=99.00";
    private static final String USER_ID = "merchant@gmkit.cn";
    private static final byte[] AAD = "tenant=demo;schema=1".getBytes(StandardCharsets.UTF_8);

    @Test
    void quickStartFlowMatchesGuide() {
        assertEquals(
            "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
            SM3Util.digestHex("abc"));

        SM2 sm2 = new SM2();
        SM2KeyPair keys = sm2.generateKeyPair();
        String signature = sm2.signHex(
            keys.privateKey(),
            MESSAGE,
            SM2SignOptions.builder().userId(USER_ID).build());
        assertTrue(sm2.verify(
            keys.publicKey(),
            MESSAGE,
            signature,
            SM2VerifyOptions.builder().userId(USER_ID).build()));
        assertFalse(sm2.verify(
            keys.publicKey(),
            TAMPERED,
            signature,
            SM2VerifyOptions.builder().userId(USER_ID).build()));

        byte[] sm4Key = new SM4().generateKey();
        SM4Options options = SM4Options.builder()
            .mode(GCM)
            .padding(NONE)
            .iv(HexCodec.decodeStrict("000102030405060708090a0b", "nonce"))
            .aad(AAD)
            .tagLength(16)
            .build();
        SM4CipherResult encrypted = new SM4().encrypt(sm4Key, MESSAGE, options);
        assertEquals(MESSAGE, new SM4().decryptToUtf8(sm4Key, encrypted, options));
    }

    @Test
    void explicitEncodingRoundTrips() {
        byte[] bytes = ByteEncodings.decode("AP+AQQ==", InputFormat.BASE64, "payload");
        assertEquals("00ff8041", ByteEncodings.encode(bytes, OutputFormat.HEX));
        assertThrows(GmkitException.class, () -> HexCodec.decodeStrict("0xz1", "payload"));
    }

    @Test
    void objectStyleSm2AndSm3WorkAsDocumented() {
        SM2 sm2 = new SM2();
        SM2KeyPair keys = sm2.generateKeyPair();
        String signature = sm2.signHex(
            keys.privateKey(),
            MESSAGE,
            SM2SignOptions.builder().userId(USER_ID).build());

        assertTrue(sm2.verify(
            keys.publicKey(),
            MESSAGE,
            signature,
            SM2VerifyOptions.builder().userId(USER_ID).build()));
        assertEquals(
            "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
            new SM3().digestHex("abc"));
    }

    @Test
    void sm4GcmReturnsCiphertextAndTag() {
        byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
        SM4Options options = SM4Options.builder()
            .mode(GCM)
            .padding(NONE)
            .iv(HexCodec.decodeStrict("000102030405060708090a0b", "SM4 nonce"))
            .aad(AAD)
            .tagLength(16)
            .build();

        SM4 sm4 = new SM4();
        SM4CipherResult encrypted = sm4.encrypt(key, MESSAGE, options);
        assertNotNull(encrypted.tag());
        assertEquals(MESSAGE, sm4.decryptToUtf8(key, encrypted, options));

        byte[] tamperedTag = encrypted.tag();
        tamperedTag[0] ^= 0x01;
        SM4CipherResult tampered = new SM4CipherResult(encrypted.ciphertext(), tamperedTag);
        assertThrows(GmkitException.class, () -> sm4.decryptToUtf8(key, tampered, options));
    }

    @Test
    void hmacChangesWhenOrderAmountChanges() {
        byte[] key = "merchant-demo-key".getBytes(StandardCharsets.UTF_8);
        assertFalse(SM3Util.hmacHex(key, MESSAGE).equals(SM3Util.hmacHex(key, TAMPERED)));
    }

    @Test
    void zucLengthIsMeasuredInBytes() {
        assertEquals(
            "27bede74018082da",
            ZUC.keystreamHex(
                "00000000000000000000000000000000",
                "00000000000000000000000000000000",
                8));
    }

    @Test
    void hybridPayloadCarriesAllDecryptionMetadata() {
        SM2KeyPair keys = new SM2().generateKeyPair();
        SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();
        SM4Options options = SM4Options.builder()
            .mode(GCM)
            .padding(NONE)
            .aad(AAD)
            .tagLength(16)
            .build();
        SM2Sm4HybridPayload payload = hybrid.encrypt(keys.publicKey(), MESSAGE, StandardCharsets.UTF_8, options);

        assertNotNull(payload.encryptedKey());
        assertNotNull(payload.ciphertext());
        assertTrue(payload.hasIv());
        assertTrue(payload.hasAad());
        assertTrue(payload.hasTag());
        assertEquals(GCM, payload.mode());
        assertArrayEquals(
            MESSAGE.getBytes(StandardCharsets.UTF_8),
            hybrid.decrypt(keys.privateKey(), payload));

        byte[] changedTag = payload.tag();
        changedTag[0] ^= 0x01;
        SM2Sm4HybridPayload tampered = new SM2Sm4HybridPayload(
            payload.encryptedKey(),
            payload.ciphertext(),
            payload.iv(),
            payload.aad(),
            changedTag,
            payload.mode(),
            payload.padding());
        assertThrows(GmkitException.class, () -> hybrid.decrypt(keys.privateKey(), tampered));
    }
}
