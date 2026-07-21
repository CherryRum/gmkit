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
        // #region java-sm9-pem-example
        // 1. 准备身份、订单消息和临时 PEM 文件路径。
        byte[] message =
            "order=GMKIT-DEMO-0001&amount=88.00".getBytes(StandardCharsets.UTF_8);
        String id = "warehouse@gmkit.cn";
        String keyFile = dir.resolve("sign_user.pem").toString();
        String mpkFile = dir.resolve("sign_mpk3.pem").toString();

        // 2. 生成 KGC 签名主密钥，并导出可分发的主公钥 PEM。
        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            master.exportPublicMasterKeyPem(mpkFile);

            // 3. 派生身份私钥，并使用口令加密后写入 PEM。
            try (SM9SignKey signKey = master.extractKey(id)) {
                signKey.exportEncryptedPrivateKeyInfoPem(PASSWORD, keyFile);
            }
        }

        // 4. 重新导入加密身份私钥，并用它签名订单消息。
        byte[] signature;
        try (SM9SignKey reloaded =
                     SM9SignKey.importEncryptedPrivateKeyInfoPem(PASSWORD, keyFile, id)) {
            signature = SM9.sign(reloaded, message);
        }

        // 5. 导入主公钥 PEM，使用相同身份完成验签。
        try (SM9SignMasterKey pub = SM9SignMasterKey.importPublicMasterKeyPem(mpkFile)) {
            // 6. 成功断言：重新加载后的私钥签名必须验证成功。
            assertTrue(SM9.verify(pub, id, message, signature));
        }
        // #endregion java-sm9-pem-example
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
