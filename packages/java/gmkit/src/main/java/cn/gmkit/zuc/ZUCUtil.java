package cn.gmkit.zuc;

/**
 * Static convenience entry point for ZUC-128.
 * <p>
 * This class mirrors {@link ZUC}; it exists for users who prefer a utility
 * naming style consistent with SM2/SM3/SM4 helpers in this module.
 */
public final class ZUCUtil {

    /**
     * ZUC-128 key length in bytes.
     */
    public static final int KEY_LENGTH = ZUC.KEY_LENGTH;

    /**
     * ZUC-128 IV length in bytes.
     */
    public static final int IV_LENGTH = ZUC.IV_LENGTH;

    private ZUCUtil() {
    }

    public static byte[] keystream(byte[] key, byte[] iv, int lengthBytes) {
        return ZUC.keystream(key, iv, lengthBytes);
    }

    public static String keystreamHex(String keyHex, String ivHex, int lengthBytes) {
        return ZUC.keystreamHex(keyHex, ivHex, lengthBytes);
    }

    public static int[] keystreamWords(byte[] key, byte[] iv, int lengthWords) {
        return ZUC.keystreamWords(key, iv, lengthWords);
    }

    public static String keystreamWordsHex(String keyHex, String ivHex, int lengthWords) {
        return ZUC.keystreamWordsHex(keyHex, ivHex, lengthWords);
    }

    public static byte[] encrypt(byte[] key, byte[] iv, byte[] plaintext) {
        return ZUC.encrypt(key, iv, plaintext);
    }

    public static String encryptHex(String keyHex, String ivHex, String plaintext) {
        return ZUC.encryptHex(keyHex, ivHex, plaintext);
    }

    public static String encryptBase64(String keyHex, String ivHex, String plaintext) {
        return ZUC.encryptBase64(keyHex, ivHex, plaintext);
    }

    public static byte[] decrypt(byte[] key, byte[] iv, byte[] ciphertext) {
        return ZUC.decrypt(key, iv, ciphertext);
    }

    public static String decryptHexToUtf8(String keyHex, String ivHex, String ciphertextHex) {
        return ZUC.decryptHexToUtf8(keyHex, ivHex, ciphertextHex);
    }

    public static String decryptBase64ToUtf8(String keyHex, String ivHex, String ciphertextBase64) {
        return ZUC.decryptBase64ToUtf8(keyHex, ivHex, ciphertextBase64);
    }

    public static String eea3(String keyHex, int count, int bearer, int direction, int bitLength) {
        return ZUC.eea3(keyHex, count, bearer, direction, bitLength);
    }

    public static String eia3(String keyHex, int count, int bearer, int direction, byte[] message) {
        return ZUC.eia3(keyHex, count, bearer, direction, message);
    }

    public static String eia3(String keyHex, int count, int bearer, int direction, String message) {
        return ZUC.eia3(keyHex, count, bearer, direction, message);
    }
}
