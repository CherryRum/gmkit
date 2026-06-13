package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SM9 native 端到端冒烟测试。
 * <p>
 * 普通 CI 不强制要求 native 库；发布机或 native CI 可通过
 * {@code -Dgmkit.sm9.requireNative=true} 要求本测试必须完整跑通。
 */
class SM9NativeSmokeTest {

    @Test
    void nativeShouldRunSignatureAndEncryptionSmokeWhenAvailableOrRequired() {
        if (!SM9.isAvailable()) {
            assertTrue(!Boolean.getBoolean(SM9Assumptions.REQUIRE_NATIVE_PROPERTY),
                    SM9.nativeLoadErrorMessage());
            return;
        }

        byte[] message = "gmkit-sm9-native-smoke".getBytes(StandardCharsets.UTF_8);
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("smoke-signer@example.com")) {
            byte[] signature = SM9.sign(signKey, message);
            assertNotNull(signature);
            assertTrue(signature.length > 0);
            assertTrue(SM9.verify(master, "smoke-signer@example.com", message, signature));
        }

        byte[] plaintext = "sm9-ibe-smoke".getBytes(StandardCharsets.UTF_8);
        try (SM9EncMasterKey master = SM9.generateEncMasterKey();
             SM9EncKey encKey = master.extractKey("smoke-recipient@example.com")) {
            byte[] ciphertext = SM9.encrypt(master, "smoke-recipient@example.com", plaintext);
            assertNotNull(ciphertext);
            assertTrue(ciphertext.length > plaintext.length);
            assertArrayEquals(plaintext, SM9.decrypt(encKey, ciphertext));
        }
    }
}
