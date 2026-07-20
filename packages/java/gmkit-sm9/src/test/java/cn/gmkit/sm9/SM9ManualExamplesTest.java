package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 执行官网 SM9 说明书中的句柄生命周期、签名与 IBE 示例。 */
@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class SM9ManualExamplesTest {

    @Test
    void handlesAreClosedAfterSignAndEncryptExamples() {
        String id = "manual@example";
        byte[] message = "SM9 公共 API 说明书".getBytes(StandardCharsets.UTF_8);

        try (SM9SignMasterKey signMaster = SM9.generateSignMasterKey();
             SM9SignKey signKey = signMaster.extractKey(id);
             SM9EncMasterKey encMaster = SM9.generateEncMasterKey();
             SM9EncKey encKey = encMaster.extractKey(id)) {
            byte[] signature = SM9.sign(signKey, message);
            assertTrue(SM9.verify(signMaster, id, message, signature));

            byte[] ciphertext = SM9.encrypt(encMaster, id, message);
            assertArrayEquals(message, SM9.decrypt(encKey, ciphertext));
        }
    }
}
