package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 执行官网 SM9 说明书中的句柄生命周期、签名与 IBE 示例。 */
@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class SM9ManualExamplesTest {

    @Test
    void handlesAreClosedAfterSignAndEncryptExamples() {
        // #region java-sm9-example
        // 1. 准备身份与消息：正常订单和篡改金额分别保存为 UTF-8 字节。
        String recipientId = "warehouse@gmkit.cn";
        byte[] message =
            "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);
        byte[] changedMessage =
            "order=GMKIT-DEMO-0001&amount=99.00".getBytes(StandardCharsets.UTF_8);

        // 2. 创建 KGC 主密钥并派生身份私钥：所有本地句柄都由 try-with-resources 关闭。
        try (SM9SignMasterKey signMaster = SM9.generateSignMasterKey();
             SM9SignKey signKey = signMaster.extractKey(recipientId);
             SM9EncMasterKey encMaster = SM9.generateEncMasterKey();
             SM9EncKey encKey = encMaster.extractKey(recipientId)) {
            // 3. SM9 签名：使用与 recipientId 绑定的签名私钥。
            byte[] signature = SM9.sign(signKey, message);

            // 4. SM9 验签：主公钥、相同身份和原消息必须验证成功。
            assertTrue(SM9.verify(signMaster, recipientId, message, signature));

            // 5. 身份失败断言：换成其他身份必须验证失败。
            assertFalse(SM9.verify(signMaster, "other@gmkit.cn", message, signature));

            // 6. 消息篡改断言：金额变化后必须验证失败。
            assertFalse(SM9.verify(signMaster, recipientId, changedMessage, signature));

            // 7. SM9 IBE 加密：使用加密主公钥和接收方身份保护小消息。
            byte[] ciphertext = SM9.encrypt(encMaster, recipientId, message);

            // 8. SM9 IBE 解密：身份私钥恢复原始订单字节。
            byte[] decrypted = SM9.decrypt(encKey, ciphertext);

            // 9. 成功断言：解密结果必须与原始消息一致。
            assertArrayEquals(message, decrypted);

            // 10. 长度失败断言：超过 255 字节的单次 IBE 明文必须被拒绝。
            byte[] tooLong = new byte[SM9EncMasterKey.MAX_PLAINTEXT_SIZE + 1];
            assertThrows(SM9Exception.class, () -> SM9.encrypt(encMaster, recipientId, tooLong));
        }
        // #endregion java-sm9-example
    }
}
