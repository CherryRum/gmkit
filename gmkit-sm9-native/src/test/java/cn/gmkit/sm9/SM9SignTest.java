package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SM9 签名 / 验签功能测试（需要 native 库）。
 */
@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class SM9SignTest {

    private static final byte[] MESSAGE = "Hello GMKit SM9!".getBytes(StandardCharsets.UTF_8);

    @Test
    void signAndVerifyShouldSucceed() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            assertNotNull(signature);
            assertTrue(signature.length > 0);
            assertTrue(SM9.verify(master, "alice@example.com", MESSAGE, signature));
        }
    }

    @Test
    void verifyWithWrongIdShouldFail() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            assertFalse(SM9.verify(master, "bob@example.com", MESSAGE, signature));
        }
    }

    @Test
    void verifyWithTamperedDataShouldFail() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            byte[] tampered = MESSAGE.clone();
            tampered[0] ^= 0x01;
            assertFalse(SM9.verify(master, "alice@example.com", tampered, signature));
        }
    }

    @Test
    void verifyWithTamperedSignatureShouldFail() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            byte[] signature = SM9.sign(signKey, MESSAGE);
            signature[signature.length - 1] ^= 0x01;
            assertFalse(SM9.verify(master, "alice@example.com", MESSAGE, signature));
        }
    }

    @Test
    void blankIdShouldThrow() {
        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            assertThrows(SM9Exception.class, () -> master.extractKey("  "));
        }
    }
}
