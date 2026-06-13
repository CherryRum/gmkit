package cn.gmkit.core;

/**
 * 统一的中英双语消息工具。
 * <p>
 * 中文优先用于直接展示，英文保留用于日志检索、搜索 issue 或与第三方实现对照。
 */
public final class Messages {

    private Messages() {
    }

    /**
     * 组合一条中英双语消息。
     *
     * @param zh 中文消息
     * @param en 英文消息
     * @return 双语消息，格式为 {@code 中文 / English}
     */
    public static String bilingual(String zh, String en) {
        return zh + " / " + en;
    }

    /**
     * 构造空值错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String nullValue(String label) {
        return bilingual(label + " 不能为空", label + " must not be null");
    }

    /**
     * 构造空内容错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String emptyValue(String label) {
        return bilingual(label + " 不能为空内容", label + " must not be empty");
    }

    /**
     * 构造空白字符串错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String blankValue(String label) {
        return bilingual(label + " 不能为空白", label + " must not be blank");
    }

    /**
     * 构造十六进制长度错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String invalidHexEven(String label) {
        return bilingual(label + " 必须是偶数长度的十六进制字符串", "Invalid " + label + ": hexadecimal strings must have an even length");
    }

    /**
     * 构造十六进制格式错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String invalidHex(String label) {
        return bilingual(label + " 必须是十六进制字符串", "Invalid " + label + ": must be a hexadecimal string");
    }

    /**
     * 构造 Base64 格式错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String invalidBase64(String label) {
        return bilingual(label + " 必须是 Base64 字符串", "Invalid " + label + ": must be base64");
    }

    /**
     * 构造十六进制或 Base64 自动识别失败消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String invalidHexOrBase64(String label) {
        return bilingual(label + " 必须是十六进制或 Base64 字符串", "Invalid " + label + ": must be hexadecimal or base64");
    }

    /**
     * 构造空白输入错误消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String invalidBlankInput(String label) {
        return bilingual(label + " 输入不能为空白", "Invalid " + label + ": input must not be blank");
    }

    /**
     * 构造定长校验失败消息。
     *
     * @param label          参数名称
     * @param expectedLength 期望长度
     * @param actualLength   实际长度
     * @return 双语错误消息
     */
    public static String expectedLength(String label, int expectedLength, int actualLength) {
        return bilingual(
            label + " 长度必须为 " + expectedLength + " 字节，实际为 " + actualLength + " 字节",
            label + " must be " + expectedLength + " bytes, but was " + actualLength);
    }

    /**
     * 构造整数倍长度校验失败消息。
     *
     * @param label 参数名称
     * @param blockSize 块大小
     * @return 双语错误消息
     */
    public static String multipleOf(String label, int blockSize) {
        return bilingual(
            label + " 长度必须是 " + blockSize + " 字节的整数倍",
            label + " length must be a multiple of " + blockSize + " bytes");
    }

    /**
     * 构造正数校验失败消息。
     *
     * @param label 参数名称
     * @return 双语错误消息
     */
    public static String positiveValue(String label) {
        return bilingual(label + " 必须为正数", label + " must be positive");
    }

    /**
     * 构造 SM2 加密失败消息。
     *
     * @return 双语错误消息
     */
    public static String sm2EncryptionFailed() {
        return bilingual(
            "SM2 加密失败，请检查公钥、明文和 Provider 配置",
            "SM2 encryption failed: please verify the public key, plaintext and Provider configuration");
    }

    /**
     * 构造 SM2 解密失败消息。
     *
     * @return 双语错误消息
     */
    public static String sm2DecryptionFailed() {
        return bilingual(
            "SM2 解密失败，请检查私钥、密文布局以及 ASN.1/RAW 编码",
            "SM2 decryption failed: please verify the private key, ciphertext layout and ASN.1/RAW encoding");
    }

    /**
     * 构造 SM2 签名失败消息。
     *
     * @return 双语错误消息
     */
    public static String sm2SigningFailed() {
        return bilingual("SM2 签名失败", "SM2 signing failed");
    }

    /**
     * 构造 SM2 发起方确认标签缺失消息。
     *
     * @return 双语错误消息
     */
    public static String sm2InitiatorConfirmationTagRequired() {
        return bilingual(
            "SM2 密钥协商发起方必须提供对端确认标签",
            "SM2 initiator must provide a peer confirmation tag");
    }

    /**
     * 构造 SM2 用户标识长度错误消息。
     *
     * @return 双语错误消息
     */
    public static String sm2UserIdTooLong() {
        return bilingual(
            "SM2 user ID 长度必须小于 2^16 位",
            "SM2 user ID must be less than 2^16 bits long");
    }

    /**
     * 构造 SM2 签名格式错误消息。
     *
     * @return 双语错误消息
     */
    public static String invalidSm2Signature() {
        return bilingual(
            "SM2 签名无效，应为 64 字节 RAW (r||s) 或 ASN.1 DER 序列",
            "Invalid SM2 signature: expected 64-byte RAW (r||s) or ASN.1 DER sequence");
    }

    /**
     * 构造 SM2 DER 签名格式错误消息。
     *
     * @return 双语错误消息
     */
    public static String invalidSm2DerSignature() {
        return bilingual(
            "SM2 签名 ASN.1 DER 编码无效，应为 SEQUENCE { r, s }",
            "Invalid SM2 signature ASN.1 DER encoding: expected SEQUENCE { r, s }");
    }

    /**
     * 构造 SM2 RAW 签名长度错误消息。
     *
     * @param expectedLength 期望长度
     * @return 双语错误消息
     */
    public static String invalidSm2RawSignatureLength(int expectedLength) {
        return bilingual(
            "SM2 RAW 签名长度无效，应为 " + expectedLength + " 字节 (r||s)",
            "Invalid SM2 RAW signature: expected " + expectedLength + " bytes (r||s)");
    }

    /**
     * 构造 SM2 RAW 签名编码失败消息。
     *
     * @return 双语错误消息
     */
    public static String invalidSm2RawSignatureEncoding() {
        return bilingual(
            "SM2 RAW 签名无法编码为 ASN.1 DER 序列",
            "Invalid SM2 RAW signature: unable to encode ASN.1 DER sequence");
    }
}
