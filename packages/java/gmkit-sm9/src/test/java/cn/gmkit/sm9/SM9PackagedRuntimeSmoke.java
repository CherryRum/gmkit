package cn.gmkit.sm9;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

/**
 * Runs against the packaged gmkit-sm9 JAR without relying on JUnit at runtime.
 */
public final class SM9PackagedRuntimeSmoke {

    private SM9PackagedRuntimeSmoke() {
    }

    public static void main(String[] args) throws Exception {
        if (!SM9.isAvailable()) {
            throw new IllegalStateException(SM9.nativeLoadErrorMessage());
        }

        String[] identities = {"用户-发布", "release-😊", "  spaced-release  ", "release\u0000id"};
        byte[] message = "gmkit-sm9-packaged-runtime".getBytes(StandardCharsets.UTF_8);
        for (String id : identities) {
            try (SM9SignMasterKey master = SM9.generateSignMasterKey();
                 SM9SignKey signKey = master.extractKey(id)) {
                byte[] signature = SM9.sign(signKey, message);
                if (!SM9.verify(master, id, message, signature)) {
                    throw new IllegalStateException("SM9 packaged signature verification failed for identity");
                }
            }

            byte[] plaintext = "gmkit-sm9-packaged-ibe".getBytes(StandardCharsets.UTF_8);
            try (SM9EncMasterKey master = SM9.generateEncMasterKey();
                 SM9EncKey encKey = master.extractKey(id)) {
                byte[] ciphertext = SM9.encrypt(master, id, plaintext);
                if (!Arrays.equals(plaintext, SM9.decrypt(encKey, ciphertext))) {
                    throw new IllegalStateException("SM9 packaged encryption round-trip failed for identity");
                }
            }
        }

        // 最终聚合 JAR 必须能处理标准 UTF-8 口令和 Unicode 文件路径。
        Path pemDirectory = Files.createTempDirectory("gmkit-sm9-发布-😊-");
        String masterFile = pemDirectory.resolve("签名主密钥.pem").toString();
        String password = "密钥-😊-Passw0rd!";
        try (SM9SignMasterKey master = SM9.generateSignMasterKey()) {
            master.exportEncryptedMasterKeyInfoPem(password, masterFile);
        }
        try (SM9SignMasterKey imported =
                 SM9SignMasterKey.importEncryptedMasterKeyInfoPem(password, masterFile);
             SM9SignKey signKey = imported.extractKey("用户-发布")) {
            byte[] signature = SM9.sign(signKey, message);
            if (!SM9.verify(imported, "用户-发布", message, signature)) {
                throw new IllegalStateException("SM9 packaged Unicode PEM round-trip failed");
            }
        }

        System.out.println("SM9 packaged runtime passed: " + SM9.nativePlatform());
    }
}
