package cn.gmkit.sm9;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Runs against the packaged gmkit-sm9 JAR without relying on JUnit at runtime.
 */
public final class SM9PackagedRuntimeSmoke {

    private SM9PackagedRuntimeSmoke() {
    }

    public static void main(String[] args) {
        if (!SM9.isAvailable()) {
            throw new IllegalStateException(SM9.nativeLoadErrorMessage());
        }

        byte[] message = "gmkit-sm9-packaged-runtime".getBytes(StandardCharsets.UTF_8);
        try (SM9SignMasterKey master = SM9.generateSignMasterKey();
             SM9SignKey signKey = master.extractKey("release-signer@example.com")) {
            byte[] signature = SM9.sign(signKey, message);
            if (!SM9.verify(master, "release-signer@example.com", message, signature)) {
                throw new IllegalStateException("SM9 packaged signature verification failed");
            }
        }

        byte[] plaintext = "gmkit-sm9-packaged-ibe".getBytes(StandardCharsets.UTF_8);
        try (SM9EncMasterKey master = SM9.generateEncMasterKey();
             SM9EncKey encKey = master.extractKey("release-recipient@example.com")) {
            byte[] ciphertext = SM9.encrypt(master, "release-recipient@example.com", plaintext);
            if (!Arrays.equals(plaintext, SM9.decrypt(encKey, ciphertext))) {
                throw new IllegalStateException("SM9 packaged encryption round-trip failed");
            }
        }

        System.out.println("SM9 packaged runtime passed: " + SM9.nativePlatform());
    }
}
