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
        String recipientId = "warehouse@gmkit.cn";
        byte[] message =
            "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);
        byte[] changedMessage =
            "order=GMKIT-DEMO-0001&amount=99.00".getBytes(StandardCharsets.UTF_8);
        try (SM9SignMasterKey signMaster = SM9.generateSignMasterKey();
             SM9SignKey signKey = signMaster.extractKey(recipientId);
             SM9EncMasterKey encMaster = SM9.generateEncMasterKey();
             SM9EncKey encKey = encMaster.extractKey(recipientId)) {
            byte[] signature = SM9.sign(signKey, message);
            assertTrue(SM9.verify(signMaster, recipientId, message, signature));
            assertFalse(SM9.verify(signMaster, "other@gmkit.cn", message, signature));
            assertFalse(SM9.verify(signMaster, recipientId, changedMessage, signature));

            byte[] ciphertext = SM9.encrypt(encMaster, recipientId, message);
            assertArrayEquals(message, SM9.decrypt(encKey, ciphertext));

            byte[] tooLong = new byte[SM9EncMasterKey.MAX_PLAINTEXT_SIZE + 1];
            assertThrows(SM9Exception.class, () -> SM9.encrypt(encMaster, recipientId, tooLong));
        }
        // #endregion java-sm9-example
    }
}
