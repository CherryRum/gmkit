// #region manual-java-sm9
package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class ManualJavaSm9UserGuideTest {

    @Test
    void signsEncryptsAndReloadsPem(@TempDir Path directory) {
        // 1. 检查平台：执行密码操作前确认本地动态库已加载，并记录版本与平台。
        assertTrue(SM9.isAvailable());
        assertNotNull(SM9.nativeVersion());
        assertNotNull(SM9.nativePlatform());

        // 2. 准备参数：身份、正常订单、篡改订单、PEM 口令和临时文件路径分别保存。
        String recipientId = "warehouse@gmkit.cn";
        byte[] plaintext =
            "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);
        byte[] tampered =
            "order=GMKIT-DEMO-0001&amount=99.00".getBytes(StandardCharsets.UTF_8);
        String password = "Passw0rd!";
        String signPublicFile = directory.resolve("sm9-sign-master-public.pem").toString();
        String signKeyFile = directory.resolve("sm9-sign-user-private.pem").toString();
        String encPublicFile = directory.resolve("sm9-enc-master-public.pem").toString();
        String encKeyFile = directory.resolve("sm9-enc-user-private.pem").toString();

        // 3. 生成签名 KGC 主密钥：主私钥留在 KGC，只把主公钥 PEM 分发给验签方。
        try (SM9SignMasterKey signMaster = SM9.generateSignMasterKey()) {
            signMaster.exportPublicMasterKeyPem(signPublicFile);

            // 4. 派生签名身份私钥：私钥与 recipientId 绑定，并用口令加密后保存为 PEM。
            try (SM9SignKey signKey = signMaster.extractKey(recipientId)) {
                signKey.exportEncryptedPrivateKeyInfoPem(password, signKeyFile);
            }
        }

        // 5. 导入签名材料：业务方只加载身份私钥，验签方只加载主公钥。
        byte[] signature;
        try (SM9SignKey signKey =
                 SM9SignKey.importEncryptedPrivateKeyInfoPem(password, signKeyFile, recipientId);
             SM9SignMasterKey signPublic =
                 SM9SignMasterKey.importPublicMasterKeyPem(signPublicFile)) {
            // 6. SM9 签名：身份私钥对订单字节签名。
            signature = SM9.sign(signKey, plaintext);

            // 7. SM9 验签：主公钥、同一身份和原消息必须验证成功。
            assertTrue(SM9.verify(signPublic, recipientId, plaintext, signature));

            // 8. 验签失败断言：身份或订单金额变化后必须返回 false。
            assertFalse(SM9.verify(signPublic, "other@gmkit.cn", plaintext, signature));
            assertFalse(SM9.verify(signPublic, recipientId, tampered, signature));
        }

        // 9. 生成加密 KGC 主密钥：导出加密主公钥，并派生接收方 IBE 私钥。
        try (SM9EncMasterKey encMaster = SM9.generateEncMasterKey()) {
            encMaster.exportPublicMasterKeyPem(encPublicFile);
            try (SM9EncKey encKey = encMaster.extractKey(recipientId)) {
                encKey.exportEncryptedPrivateKeyInfoPem(password, encKeyFile);
            }
        }

        // 10. 导入加密材料：发送方加载主公钥，接收方加载绑定身份的 IBE 私钥。
        try (SM9EncMasterKey encPublic =
                 SM9EncMasterKey.importPublicMasterKeyPem(encPublicFile);
             SM9EncKey encKey =
                 SM9EncKey.importEncryptedPrivateKeyInfoPem(password, encKeyFile, recipientId)) {
            // 11. SM9 IBE 加密：发送方用主公钥和 recipientId 保护小消息。
            byte[] ciphertext = SM9.encrypt(encPublic, recipientId, plaintext);

            // 12. SM9 IBE 解密：接收方身份私钥恢复订单字节。
            byte[] decrypted = SM9.decrypt(encKey, ciphertext);
            assertArrayEquals(plaintext, decrypted);

            // 13. 身份失败断言：为其他身份生成的密文不能由当前身份私钥解密。
            byte[] wrongIdentityCiphertext = SM9.encrypt(encPublic, "other@gmkit.cn", plaintext);
            assertThrows(SM9Exception.class, () -> SM9.decrypt(encKey, wrongIdentityCiphertext));

            // 14. 长度失败断言：单次 IBE 明文超过 255 字节时必须抛出 SM9Exception。
            byte[] tooLong = new byte[SM9EncMasterKey.MAX_PLAINTEXT_SIZE + 1];
            assertThrows(SM9Exception.class, () -> SM9.encrypt(encPublic, recipientId, tooLong));
        }

        // 15. 流式 SM9 签名：大消息分块 update 后签名，再按相同分块顺序验签。
        try (SM9SignKey signKey =
                 SM9SignKey.importEncryptedPrivateKeyInfoPem(password, signKeyFile, recipientId);
             SM9SignMasterKey signPublic =
                 SM9SignMasterKey.importPublicMasterKeyPem(signPublicFile);
             SM9Signature signer = new SM9Signature(true);
             SM9Signature verifier = new SM9Signature(false)) {
            signer.update(plaintext, 0, 10).update(plaintext, 10, plaintext.length - 10);
            byte[] streamingSignature = signer.sign(signKey);
            verifier.update(plaintext, 0, 10).update(plaintext, 10, plaintext.length - 10);
            assertTrue(verifier.verify(streamingSignature, signPublic, recipientId));
        }
    }
}
// #endregion manual-java-sm9
