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
        // #region java-core-example
        // 1. Base64 解码：显式声明输入格式并取得原始字节。
        byte[] bytes = ByteEncodings.decode("AP+AQQ==", InputFormat.BASE64, "payload");

        // 2. Hex 编码断言：二进制必须编码为预期的小写 Hex。
        assertEquals("00ff8041", ByteEncodings.encode(bytes, OutputFormat.HEX));

        // 3. 非法输入断言：出现非 Hex 字符时必须抛出 GmkitException。
        assertThrows(GmkitException.class, () -> HexCodec.decodeStrict("0xz1", "payload"));
        // #endregion java-core-example
    }

    @Test
    void objectStyleSm2AndSm3WorkAsDocumented() {
        // #region java-sm2-example
        // 1. 准备输入：正常订单、篡改订单和签名身份分别保存。
        String message = "order=GMKIT-DEMO-0001&amount=88.00";
        String changedMessage = "order=GMKIT-DEMO-0001&amount=99.00";
        String userId = "merchant@gmkit.cn";

        // 2. 生成 SM2 密钥对：私钥签名，公钥验签。
        SM2 sm2 = new SM2();
        SM2KeyPair keys = sm2.generateKeyPair();

        // 3. SM2 签名：userId 参与 Z 值计算，输出使用默认 Hex。
        String signature = sm2.signHex(
            keys.privateKey(),
            message,
            SM2SignOptions.builder().userId(userId).build());

        // 4. SM2 验签：原消息和相同 userId 必须验证成功。
        assertTrue(sm2.verify(
            keys.publicKey(),
            message,
            signature,
            SM2VerifyOptions.builder().userId(userId).build()));

        // 5. 篡改断言：金额变化后必须验证失败。
        assertFalse(sm2.verify(
            keys.publicKey(),
            changedMessage,
            signature,
            SM2VerifyOptions.builder().userId(userId).build()));
        // #endregion java-sm2-example

        // #region java-sm3-example
        // 1. 计算 SM3 摘要：使用标准输入 abc。
        // 2. 固定向量断言：Hex 摘要必须与标准结果完全一致。
        assertEquals(
            "66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0",
            new SM3().digestHex("abc"));
        // #endregion java-sm3-example
    }

    @Test
    void sm4GcmReturnsCiphertextAndTag() {
        // #region java-sm4-example
        // 1. 准备参数：固定测试 key、12 字节 nonce、订单明文和业务 AAD。
        String message = "order=GMKIT-DEMO-0001&amount=88.00";
        byte[] aad = "tenant=demo;schema=1".getBytes(StandardCharsets.UTF_8);
        byte[] key = HexCodec.decodeStrict("0123456789abcdeffedcba9876543210", "SM4 key");
        SM4Options options = SM4Options.builder()
            .mode(GCM)
            .padding(NONE)
            .iv(HexCodec.decodeStrict("000102030405060708090a0b", "SM4 nonce"))
            .aad(aad)
            .tagLength(16)
            .build();

        // 2. SM4-GCM 加密：结果包含 ciphertext 和认证 tag。
        SM4 sm4 = new SM4();
        SM4CipherResult encrypted = sm4.encrypt(key, message, options);

        // 3. 加密结果断言：tag 不得缺失。
        assertNotNull(encrypted.tag());

        // 4. SM4-GCM 解密：使用相同 key、nonce 和 AAD 恢复文本。
        String decrypted = sm4.decryptToUtf8(key, encrypted, options);

        // 5. 成功断言：解密结果必须等于订单原文。
        assertEquals(message, decrypted);

        // 6. 构造篡改结果：复制 tag 后修改第一个字节。
        byte[] tamperedTag = encrypted.tag();
        tamperedTag[0] ^= 0x01;
        SM4CipherResult tampered = new SM4CipherResult(encrypted.ciphertext(), tamperedTag);

        // 7. 失败断言：认证失败必须抛错，不能返回未认证明文。
        assertThrows(GmkitException.class, () -> sm4.decryptToUtf8(key, tampered, options));
        // #endregion java-sm4-example
    }

    @Test
    void hmacChangesWhenOrderAmountChanges() {
        // #region java-sm3-hmac-example
        // 1. 准备认证输入：正常订单与篡改金额使用同一 HMAC key。
        String message = "order=GMKIT-DEMO-0001&amount=88.00";
        String changedMessage = "order=GMKIT-DEMO-0001&amount=99.00";
        byte[] key = "merchant-demo-key".getBytes(StandardCharsets.UTF_8);

        // 2. 计算 HMAC-SM3 并断言：消息变化后认证值必须不同。
        assertFalse(SM3Util.hmacHex(key, message).equals(SM3Util.hmacHex(key, changedMessage)));
        // #endregion java-sm3-hmac-example
    }

    @Test
    void zucLengthIsMeasuredInBytes() {
        // #region java-zuc-example
        // 1. 生成 ZUC 字节密钥流：长度参数 8 的单位是 byte。
        // 2. 固定向量断言：前 8 字节必须匹配全零 key/IV 标准结果。
        assertEquals(
            "27bede74018082da",
            ZUC.keystreamHex(
                "00000000000000000000000000000000",
                "00000000000000000000000000000000",
                8));

        // 3. 非法参数断言：key 不是 16 字节时必须抛错。
        assertThrows(
            GmkitException.class,
            () -> ZUC.keystreamHex("00", "00000000000000000000000000000000", 8));
        // #endregion java-zuc-example
    }

    @Test
    void hybridPayloadCarriesAllDecryptionMetadata() {
        // #region java-hybrid-example
        // 1. 准备参数：生成接收方 SM2 密钥对，并固定订单明文与 AAD。
        String message = "order=GMKIT-DEMO-0001&amount=88.00";
        byte[] aad = "tenant=demo;schema=1".getBytes(StandardCharsets.UTF_8);
        SM2KeyPair keys = new SM2().generateKeyPair();
        SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();
        SM4Options options = SM4Options.builder()
            .mode(GCM)
            .padding(NONE)
            .aad(aad)
            .tagLength(16)
            .build();

        // 2. 混合加密：随机 SM4 会话 key 加密明文，SM2 加密会话 key。
        SM2Sm4HybridPayload payload = hybrid.encrypt(keys.publicKey(), message, StandardCharsets.UTF_8, options);

        // 3. 载荷字段断言：解密所需的密钥密文、数据密文、IV、AAD 和 tag 必须齐全。
        assertNotNull(payload.encryptedKey());
        assertNotNull(payload.ciphertext());
        assertTrue(payload.hasIv());
        assertTrue(payload.hasAad());
        assertTrue(payload.hasTag());
        assertEquals(GCM, payload.mode());

        // 4. 混合解密：使用接收方 SM2 私钥恢复会话 key 和订单明文。
        byte[] decrypted = hybrid.decrypt(keys.privateKey(), payload);

        // 5. 成功断言：解密字节必须与原始订单 UTF-8 字节一致。
        assertArrayEquals(
            message.getBytes(StandardCharsets.UTF_8),
            decrypted);

        // 6. 构造篡改载荷：只修改 SM4-GCM tag。
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

        // 7. 失败断言：tag 被篡改后必须拒绝混合解密。
        assertThrows(GmkitException.class, () -> hybrid.decrypt(keys.privateKey(), tampered));
        // #endregion java-hybrid-example
    }
}
