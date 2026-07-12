package cn.gmkit;

import cn.gmkit.core.HexCodec;
import cn.gmkit.core.SM2CipherMode;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm2.SM2SignOptions;
import cn.gmkit.sm2.SM2VerifyOptions;
import cn.gmkit.sm3.SM3Util;
import cn.gmkit.sm4.SM4;
import cn.gmkit.sm4.SM4CipherResult;
import cn.gmkit.sm4.SM4Options;
import cn.gmkit.zuc.ZUC;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 编译并运行技术文档中的最小 Java 示例，防止文档 API 随代码演进失真。 */
class DocumentationExamplesTest {

    @Test
    void sm2ExampleRoundTripsAndVerifies() {
        SM2 sm2 = new SM2();
        SM2KeyPair keys = sm2.generateKeyPair();
        String message = "GMKit Java release check";

        String ciphertext = sm2.encryptHex(keys.publicKey(), message, SM2CipherMode.C1C3C2);
        assertEquals(message, sm2.decryptToUtf8(keys.privateKey(), ciphertext, SM2CipherMode.C1C3C2));

        String signature = sm2.signHex(keys.privateKey(), message, SM2SignOptions.builder().build());
        assertTrue(sm2.verify(keys.publicKey(), message, signature, SM2VerifyOptions.builder().build()));
    }

    @Test
    void sm3AndZucExamplesMatchFixedVectors() {
        assertEquals(
            "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
            SM3Util.digestHex("abc"));
        assertEquals(
            "27bede74018082da",
            ZUC.keystreamHex("00000000000000000000000000000000", "00000000000000000000000000000000", 8));
        assertEquals(
            "1b3d0f74",
            ZUC.eia3(
                "000102030405060708090a0b0c0d0e0f",
                0x01234567,
                0x0a,
                0,
                HexCodec.decodeStrict("5bad724710ba1c56", "message"),
                64));
    }

    @Test
    void sm4ExampleRoundTripsWithFluentResult() {
        byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
        byte[] iv = HexCodec.decodeStrict("000102030405060708090a0b0c0d0e0f", "SM4 IV");
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.CBC)
            .padding(SM4Padding.PKCS7)
            .iv(iv)
            .build();

        SM4 sm4 = new SM4();
        SM4CipherResult encrypted = sm4.encrypt(key, "sensitive data", options);
        assertTrue(encrypted.ciphertext().length > 0);
        assertEquals("sensitive data", sm4.decryptToUtf8(key, encrypted, options));
    }
}
