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

    private static final String RECIPIENT_ID = "warehouse@gmkit.cn";
    private static final byte[] MESSAGE =
        "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);
    private static final byte[] TAMPERED =
        "order=GMKIT-DEMO-0001&amount=99.00".getBytes(StandardCharsets.UTF_8);

    @Test
    void handlesAreClosedAfterSignAndEncryptExamples() {
        try (SM9SignMasterKey signMaster = SM9.generateSignMasterKey();
             SM9SignKey signKey = signMaster.extractKey(RECIPIENT_ID);
             SM9EncMasterKey encMaster = SM9.generateEncMasterKey();
             SM9EncKey encKey = encMaster.extractKey(RECIPIENT_ID)) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            assertTrue(SM9.verify(signMaster, RECIPIENT_ID, MESSAGE, signature));
            assertFalse(SM9.verify(signMaster, "other@gmkit.cn", MESSAGE, signature));
            assertFalse(SM9.verify(signMaster, RECIPIENT_ID, TAMPERED, signature));

            byte[] ciphertext = SM9.encrypt(encMaster, RECIPIENT_ID, MESSAGE);
            assertArrayEquals(MESSAGE, SM9.decrypt(encKey, ciphertext));

            byte[] tooLong = new byte[SM9EncMasterKey.MAX_PLAINTEXT_SIZE + 1];
            assertThrows(SM9Exception.class, () -> SM9.encrypt(encMaster, RECIPIENT_ID, tooLong));
        }
    }
}
