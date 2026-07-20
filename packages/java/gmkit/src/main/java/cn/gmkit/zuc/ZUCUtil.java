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

    /**
     * 生成 ZUC 密钥流字节。
     *
     * @param key 16 字节密钥
     * @param iv 16 字节初始化向量
     * @param lengthBytes 输出字节数，不能为负
     * @return 密钥流字节
     * @see ZUC#keystream(byte[], byte[], int)
     */
    public static byte[] keystream(byte[] key, byte[] iv, int lengthBytes) {
        return ZUC.keystream(key, iv, lengthBytes);
    }

    /**
     * 生成十六进制 ZUC 密钥流。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param ivHex 32 个十六进制字符的 IV
     * @param lengthBytes 输出字节数
     * @return 小写十六进制密钥流
     * @see ZUC#keystreamHex(String, String, int)
     */
    public static String keystreamHex(String keyHex, String ivHex, int lengthBytes) {
        return ZUC.keystreamHex(keyHex, ivHex, lengthBytes);
    }

    /**
     * 生成按大端解释的 32 位 ZUC 密钥流字。
     *
     * @param key 16 字节密钥
     * @param iv 16 字节初始化向量
     * @param lengthWords 输出的 32 位字数量
     * @return 无符号 32 位值使用 {@code int} 承载的数组
     * @see ZUC#keystreamWords(byte[], byte[], int)
     */
    public static int[] keystreamWords(byte[] key, byte[] iv, int lengthWords) {
        return ZUC.keystreamWords(key, iv, lengthWords);
    }

    /**
     * 生成按大端字序拼接的十六进制密钥流字。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param ivHex 32 个十六进制字符的 IV
     * @param lengthWords 输出的 32 位字数量
     * @return 小写十六进制密钥流
     * @see ZUC#keystreamWordsHex(String, String, int)
     */
    public static String keystreamWordsHex(String keyHex, String ivHex, int lengthWords) {
        return ZUC.keystreamWordsHex(keyHex, ivHex, lengthWords);
    }

    /**
     * 使用 ZUC 对字节消息加密；ZUC 是异或流密码，解密使用同一方法。
     *
     * @param key 16 字节密钥
     * @param iv 16 字节初始化向量
     * @param plaintext 明文字节
     * @return 密文字节
     * @see ZUC#encrypt(byte[], byte[], byte[])
     */
    public static byte[] encrypt(byte[] key, byte[] iv, byte[] plaintext) {
        return ZUC.encrypt(key, iv, plaintext);
    }

    /**
     * 按 UTF-8 文本输入执行 ZUC 加密并返回十六进制密文。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param ivHex 32 个十六进制字符的 IV
     * @param plaintext UTF-8 明文
     * @return 小写十六进制密文
     * @see ZUC#encryptHex(String, String, String)
     */
    public static String encryptHex(String keyHex, String ivHex, String plaintext) {
        return ZUC.encryptHex(keyHex, ivHex, plaintext);
    }

    /**
     * 按 UTF-8 文本输入执行 ZUC 加密并返回 Base64 密文。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param ivHex 32 个十六进制字符的 IV
     * @param plaintext UTF-8 明文
     * @return Base64 密文
     * @see ZUC#encryptBase64(String, String, String)
     */
    public static String encryptBase64(String keyHex, String ivHex, String plaintext) {
        return ZUC.encryptBase64(keyHex, ivHex, plaintext);
    }

    /**
     * 使用 ZUC 对字节密文解密；实现与 {@link #encrypt(byte[], byte[], byte[])} 相同。
     *
     * @param key 16 字节密钥
     * @param iv 16 字节初始化向量
     * @param ciphertext 密文字节
     * @return 明文字节
     * @see ZUC#decrypt(byte[], byte[], byte[])
     */
    public static byte[] decrypt(byte[] key, byte[] iv, byte[] ciphertext) {
        return ZUC.decrypt(key, iv, ciphertext);
    }

    /**
     * 解密十六进制密文并按 UTF-8 解码。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param ivHex 32 个十六进制字符的 IV
     * @param ciphertextHex 十六进制密文
     * @return UTF-8 明文
     * @see ZUC#decryptHexToUtf8(String, String, String)
     */
    public static String decryptHexToUtf8(String keyHex, String ivHex, String ciphertextHex) {
        return ZUC.decryptHexToUtf8(keyHex, ivHex, ciphertextHex);
    }

    /**
     * 解密 Base64 密文并按 UTF-8 解码。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param ivHex 32 个十六进制字符的 IV
     * @param ciphertextBase64 Base64 密文
     * @return UTF-8 明文
     * @see ZUC#decryptBase64ToUtf8(String, String, String)
     */
    public static String decryptBase64ToUtf8(String keyHex, String ivHex, String ciphertextBase64) {
        return ZUC.decryptBase64ToUtf8(keyHex, ivHex, ciphertextBase64);
    }

    /**
     * 生成兼容入口的 EEA3 字对齐密钥流。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param count 32 位计数器
     * @param bearer 5 位承载标识，范围 0 至 31
     * @param direction 方向位，只能为 0 或 1
     * @param bitLength 需要的有效位数
     * @return 字对齐的小写十六进制密钥流
     * @see ZUC#eea3(String, int, int, int, int)
     */
    public static String eea3(String keyHex, int count, int bearer, int direction, int bitLength) {
        return ZUC.eea3(keyHex, count, bearer, direction, bitLength);
    }

    /**
     * 按指定有效位数执行 3GPP EEA3 加密。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param count 32 位计数器
     * @param bearer 5 位承载标识，范围 0 至 31
     * @param direction 方向位，只能为 0 或 1
     * @param message 消息字节
     * @param bitLength 有效消息位数，不能超过消息字节数乘 8
     * @return 与有效位数对应的密文字节，末字节未使用位清零
     * @see ZUC#eea3Encrypt(String, int, int, int, byte[], int)
     */
    public static byte[] eea3Encrypt(
        String keyHex,
        int count,
        int bearer,
        int direction,
        byte[] message,
        int bitLength
    ) {
        return ZUC.eea3Encrypt(keyHex, count, bearer, direction, message, bitLength);
    }

    /**
     * 按完整消息字节长度执行 EEA3 加密。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param count 32 位计数器
     * @param bearer 5 位承载标识，范围 0 至 31
     * @param direction 方向位，只能为 0 或 1
     * @param message 消息字节
     * @return 与输入等长的密文字节
     * @see ZUC#eea3Encrypt(String, int, int, int, byte[])
     */
    public static byte[] eea3Encrypt(String keyHex, int count, int bearer, int direction, byte[] message) {
        return ZUC.eea3Encrypt(keyHex, count, bearer, direction, message);
    }

    /**
     * 计算完整消息的 EIA3 兼容 MAC。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param count 32 位计数器
     * @param bearer 5 位承载标识，范围 0 至 31
     * @param direction 方向位，只能为 0 或 1
     * @param message 消息字节
     * @return 8 个十六进制字符的 MAC
     * @see ZUC#eia3(String, int, int, int, byte[])
     */
    public static String eia3(String keyHex, int count, int bearer, int direction, byte[] message) {
        return ZUC.eia3(keyHex, count, bearer, direction, message);
    }

    /**
     * 按指定有效位数计算标准 EIA3 MAC。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param count 32 位计数器
     * @param bearer 5 位承载标识，范围 0 至 31
     * @param direction 方向位，只能为 0 或 1
     * @param message 消息字节
     * @param bitLength 有效消息位数，不能超过消息字节数乘 8
     * @return 8 个十六进制字符的 MAC
     * @see ZUC#eia3(String, int, int, int, byte[], int)
     */
    public static String eia3(
        String keyHex,
        int count,
        int bearer,
        int direction,
        byte[] message,
        int bitLength
    ) {
        return ZUC.eia3(keyHex, count, bearer, direction, message, bitLength);
    }

    /**
     * 按 UTF-8 文本计算完整消息的 EIA3 兼容 MAC。
     *
     * @param keyHex 32 个十六进制字符的密钥
     * @param count 32 位计数器
     * @param bearer 5 位承载标识，范围 0 至 31
     * @param direction 方向位，只能为 0 或 1
     * @param message UTF-8 消息文本
     * @return 8 个十六进制字符的 MAC
     * @see ZUC#eia3(String, int, int, int, String)
     */
    public static String eia3(String keyHex, int count, int bearer, int direction, String message) {
        return ZUC.eia3(keyHex, count, bearer, direction, message);
    }
}
