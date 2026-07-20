package cn.gmkit;

import cn.gmkit.core.ByteEncodings;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 编译并执行官网公共 API 说明书中的代表性 Java 示例。 */
class PublicApiManualExamplesTest {

    @Test
    void explicitEncodingRoundTrips() {
        byte[] bytes = ByteEncodings.decode("AP+AQQ==", InputFormat.BASE64, "payload");
        assertEquals("00ff8041", ByteEncodings.encode(bytes, OutputFormat.HEX));
    }

    @Test
    void objectStyleSm2AndSm3WorkAsDocumented() {
        SM2 sm2 = new SM2();
        SM2KeyPair keys = sm2.generateKeyPair();
        String signature = sm2.signHex(
            keys.privateKey(),
            "公共 API 说明书",
            SM2SignOptions.builder().build());

        assertTrue(sm2.verify(
            keys.publicKey(),
            "公共 API 说明书",
            signature,
            SM2VerifyOptions.builder().build()));
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
            .aad("gmkit-manual-v1".getBytes(StandardCharsets.UTF_8))
            .tagLength(16)
            .build();

        SM4 sm4 = new SM4();
        SM4CipherResult encrypted = sm4.encrypt(key, "需要认证的消息", options);
        assertNotNull(encrypted.tag());
        assertEquals("需要认证的消息", sm4.decryptToUtf8(key, encrypted, options));
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
        SM2Sm4HybridPayload payload = hybrid.encrypt(keys.publicKey(), "混合加密说明书");

        assertNotNull(payload.encryptedKey());
        assertNotNull(payload.ciphertext());
        assertTrue(payload.hasIv());
        assertTrue(payload.hasTag());
        assertEquals(GCM, payload.mode());
        assertArrayEquals(
            "混合加密说明书".getBytes(StandardCharsets.UTF_8),
            hybrid.decrypt(keys.privateKey(), payload));
    }
}
