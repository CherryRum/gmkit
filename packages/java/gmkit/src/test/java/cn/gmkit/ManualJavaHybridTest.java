// #region manual-java-hybrid
package cn.gmkit;

import cn.gmkit.core.Base64Codec;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.SM4CipherMode;
import cn.gmkit.core.SM4Padding;
import cn.gmkit.integration.SM2Sm4Hybrid;
import cn.gmkit.integration.SM2Sm4HybridPayload;
import cn.gmkit.sm2.SM2;
import cn.gmkit.sm2.SM2KeyPair;
import cn.gmkit.sm4.SM4Options;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManualJavaHybridTest {

    @Test
    void serializesFieldsAndRejectsTampering() {
        // 1. 准备参数：生成接收方 SM2 密钥，并固定订单明文、AAD 和 GCM 选项。
        SM2KeyPair recipient = new SM2().generateKeyPair();
        String plaintext = "order=GMKIT-DEMO-0001&amount=88.00";
        byte[] aad = "tenant=demo;schema=1".getBytes(StandardCharsets.UTF_8);
        SM4Options options = SM4Options.builder()
            .mode(SM4CipherMode.GCM)
            .padding(SM4Padding.NONE)
            .aad(aad)
            .tagLength(16)
            .build();

        // 2. 混合加密：随机 SM4 会话 key 加密订单，SM2-C1C3C2 加密会话 key。
        SM2Sm4Hybrid hybrid = new SM2Sm4Hybrid();
        SM2Sm4HybridPayload payload = hybrid.encrypt(
            recipient.publicKey(),
            plaintext,
            StandardCharsets.UTF_8,
            options);

        // 3. 载荷字段断言：会话 key 密文、业务密文、nonce、AAD、tag、mode 和 padding 必须齐全。
        assertNotNull(payload.encryptedKey());
        assertNotNull(payload.ciphertext());
        assertTrue(payload.hasIv());
        assertTrue(payload.hasAad());
        assertTrue(payload.hasTag());
        assertEquals(SM4CipherMode.GCM, payload.mode());
        assertEquals(SM4Padding.NONE, payload.padding());

        // 4. 编码传输字段：二进制统一转为 Base64，枚举和 schema 使用独立字段。
        String encryptedKeyBase64 = payload.encryptedKeyBase64();
        String ciphertextBase64 = payload.ciphertextBase64();
        String nonceBase64 = Base64Codec.encode(payload.iv());
        String aadBase64 = Base64Codec.encode(payload.aad());
        String tagBase64 = payload.tagBase64();

        // 5. 重建载荷：接收方按 schema 显式解码每个字段，不反序列化 Java 对象。
        SM2Sm4HybridPayload received = new SM2Sm4HybridPayload(
            Base64Codec.decode(encryptedKeyBase64, "encryptedKey"),
            Base64Codec.decode(ciphertextBase64, "ciphertext"),
            Base64Codec.decode(nonceBase64, "nonce"),
            Base64Codec.decode(aadBase64, "aad"),
            Base64Codec.decode(tagBase64, "tag"),
            SM4CipherMode.GCM,
            SM4Padding.NONE);

        // 6. 混合解密：SM2 私钥恢复会话 key，SM4-GCM 认证后恢复 UTF-8 订单。
        String decrypted = hybrid.decryptToString(
            recipient.privateKey(),
            received,
            StandardCharsets.UTF_8);
        assertEquals(plaintext, decrypted);

        // 7. 构造篡改载荷：只修改 SM4-GCM tag，其他字段保持不变。
        byte[] tamperedTag = received.tag();
        tamperedTag[0] ^= 0x01;
        SM2Sm4HybridPayload tampered = new SM2Sm4HybridPayload(
            received.encryptedKey(),
            received.ciphertext(),
            received.iv(),
            received.aad(),
            tamperedTag,
            received.mode(),
            received.padding());

        // 8. 失败断言：tag 被修改后，混合解密必须抛出 GmkitException。
        assertThrows(
            GmkitException.class,
            () -> hybrid.decrypt(recipient.privateKey(), tampered));
    }
}
// #endregion manual-java-hybrid
