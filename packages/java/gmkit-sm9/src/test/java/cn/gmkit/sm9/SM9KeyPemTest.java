package cn.gmkit.sm9;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SM9 主密钥 / 用户密钥 PEM 导出导入测试（需要 native 库）。
 */
@EnabledIf("cn.gmkit.sm9.SM9Assumptions#nativeAvailable")
class SM9KeyPemTest {

    private static final String PASSWORD = "Passw0rd!";

    private static final String UNICODE_PASSWORD = "密钥-😊-Passw0rd!";

    @Test
    void signMasterKeyPublicPemRoundTripShouldVerify(@TempDir Path dir) {
        byte[] message = "pem-sign".getBytes(StandardCharsets.UTF_8);
        String mpkFile = dir.resolve("sign_mpk.pem").toString();

        byte[] signature;
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("alice@example.com")) {
            signature = SM9.sign(signKey, message);
            master.exportPublicMasterKeyPem(mpkFile);
        }

        try (SM9SignMasterKey imported = SM9SignMasterKey.importPublicMasterKeyPem(mpkFile)) {
            assertTrue(SM9.verify(imported, "alice@example.com", message, signature));
        }
    }

    @Test
    void signMasterKeyEncryptedPemRoundTripShouldExtractUsableKey(@TempDir Path dir) {
        byte[] message = "pem-master".getBytes(StandardCharsets.UTF_8);
        String mskFile = dir.resolve("sign_msk.pem").toString();
        String mpkFile = dir.resolve("sign_mpk2.pem").toString();

        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            master.exportEncryptedMasterKeyInfoPem(PASSWORD, mskFile);
            master.exportPublicMasterKeyPem(mpkFile);
        }

        byte[] signature;
        try (SM9SignMasterKey reloaded =
                     SM9SignMasterKey.importEncryptedMasterKeyInfoPem(PASSWORD, mskFile);
             SM9SignKey signKey = reloaded.extractKey("alice@example.com")) {
            signature = SM9.sign(signKey, message);
        }

        try (SM9SignMasterKey pub = SM9SignMasterKey.importPublicMasterKeyPem(mpkFile)) {
            assertTrue(SM9.verify(pub, "alice@example.com", message, signature));
        }
    }

    @Test
    void encMasterKeyPublicPemRoundTripShouldDecrypt(@TempDir Path dir) {
        byte[] plaintext = "pem-enc".getBytes(StandardCharsets.UTF_8);
        String mpkFile = dir.resolve("enc_mpk.pem").toString();

        byte[] ciphertext;
        try (SM9EncMasterKey master = SM9.generateEncMasterKey();
             SM9EncKey encKey = master.extractKey("bob@example.com")) {
            master.exportPublicMasterKeyPem(mpkFile);

            try (SM9EncMasterKey pub = SM9EncMasterKey.importPublicMasterKeyPem(mpkFile)) {
                ciphertext = SM9.encrypt(pub, "bob@example.com", plaintext);
            }
            byte[] decrypted = SM9.decrypt(encKey, ciphertext);
            assertArrayEquals(plaintext, decrypted);
        }
    }

    @Test
    void signUserKeyEncryptedPemRoundTripShouldSign(@TempDir Path dir) {
        byte[] message = "pem-user".getBytes(StandardCharsets.UTF_8);
        String keyFile = dir.resolve("sign_user.pem").toString();
        String mpkFile = dir.resolve("sign_mpk3.pem").toString();

        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            master.exportPublicMasterKeyPem(mpkFile);
            try (SM9SignKey signKey = master.extractKey("alice@example.com")) {
                signKey.exportEncryptedPrivateKeyInfoPem(PASSWORD, keyFile);
            }
        }

        byte[] signature;
        try (SM9SignKey reloaded =
                     SM9SignKey.importEncryptedPrivateKeyInfoPem(PASSWORD, keyFile, "alice@example.com")) {
            signature = SM9.sign(reloaded, message);
        }

        try (SM9SignMasterKey pub = SM9SignMasterKey.importPublicMasterKeyPem(mpkFile)) {
            assertTrue(SM9.verify(pub, "alice@example.com", message, signature));
        }
    }

    @Test
    void unicodePasswordAndPathShouldRoundTrip(@TempDir Path dir) {
        byte[] message = "unicode-pem".getBytes(StandardCharsets.UTF_8);
        Path unicodeDir = dir.resolve("中文-😊");
        assertTrue(unicodeDir.toFile().mkdirs());
        String keyFile = unicodeDir.resolve("签名私钥.pem").toString();
        String publicFile = unicodeDir.resolve("签名主公钥.pem").toString();

        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            master.exportPublicMasterKeyPem(publicFile);
            try (SM9SignKey signKey = master.extractKey("用户-😊")) {
                signKey.exportEncryptedPrivateKeyInfoPem(UNICODE_PASSWORD, keyFile);
            }
        }

        byte[] signature;
        try (SM9SignKey key = SM9SignKey.importEncryptedPrivateKeyInfoPem(
                UNICODE_PASSWORD, keyFile, "用户-😊")) {
            signature = SM9.sign(key, message);
        }
        try (SM9SignMasterKey publicKey = SM9SignMasterKey.importPublicMasterKeyPem(publicFile)) {
            assertTrue(SM9.verify(publicKey, "用户-😊", message, signature));
        }
    }
}
