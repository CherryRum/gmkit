package cn.gmkit.core;

import java.util.Base64;

/**
 * Base64 编解码工具。
 */
public final class Base64Codec {

    private static final Base64.Decoder DECODER = Base64.getDecoder();
    private static final Base64.Encoder ENCODER = Base64.getEncoder();

    private Base64Codec() {
    }

    /**
     * Base64解码
     *
     * @param input Base64编码的字符串
     * @param label 错误提示标签
     * @return 解码后的字节数组
     * @throws GmkitException 如果输入不是有效的Base64字符串
     */
    public static byte[] decode(String input, String label) {
        if (input == null || input.trim().isEmpty()) {
            throw new GmkitException(Messages.invalidBlankInput(label));
        }
        String trimmed = input.trim();
        if (!isCanonicalBase64(trimmed, true)) {
            throw new GmkitException(Messages.invalidBase64(label));
        }
        try {
            return DECODER.decode(trimmed);
        } catch (IllegalArgumentException ex) {
            throw new GmkitException(Messages.invalidBase64(label), ex);
        }
    }

    /**
     * Base64编码
     *
     * @param input 待编码的字节数组
     * @return Base64编码后的字符串
     */
    public static String encode(byte[] input) {
        return ENCODER.encodeToString(Bytes.requireNonNull(input, "Base64 input"));
    }

    /**
     * 判断字符串是否为有效的Base64编码
     *
     * @param input 待判断的字符串
     * @return 如果是有效的Base64编码返回true，否则返回false
     */
    public static boolean isBase64(String input) {
        return looksLikeBase64(input);
    }

    /**
     * 轻量判断字符串是否符合 Base64 字符集和填充规则。
     * <p>
     * 这里只检查编码形态，不分配结果缓冲区，也不执行解码。
     *
     * @param input 待判断字符串
     * @return 看起来像标准 Base64 时返回 {@code true}
     */
    public static boolean looksLikeBase64(String input) {
        if (input == null) {
            return false;
        }
        String trimmed = input.trim();
        int length = trimmed.length();
        if (length == 0 || (length & 3) != 0) {
            return false;
        }
        return isCanonicalBase64(trimmed, false);
    }

    /**
     * 校验 RFC 4648 标准 Base64 的字符、填充和 pad bits。
     * 显式解码允许省略末尾填充；格式探测仍由调用方限制为 4 字符对齐，保持旧版自动识别边界。
     *
     * @param input 待校验的 Base64 文本
     * @param allowUnpadded 是否允许省略末尾 {@code =} 填充
     * @return 字符、填充位置和 pad bits 均合法时返回 {@code true}
     */
    private static boolean isCanonicalBase64(String input, boolean allowUnpadded) {
        int length = input.length();
        int paddingStart = input.indexOf('=');
        int dataLength = paddingStart < 0 ? length : paddingStart;
        int paddingCount = length - dataLength;

        if (dataLength == 0 || dataLength % 4 == 1 || paddingCount > 2) {
            return false;
        }
        if (!allowUnpadded && (length & 3) != 0) {
            return false;
        }
        if (paddingCount > 0 && (length & 3) != 0) {
            return false;
        }
        if ((paddingCount == 1 && dataLength % 4 != 3)
            || (paddingCount == 2 && dataLength % 4 != 2)) {
            return false;
        }

        for (int i = 0; i < dataLength; i++) {
            if (base64Value(input.charAt(i)) < 0) {
                return false;
            }
        }
        for (int i = dataLength; i < length; i++) {
            if (input.charAt(i) != '=') {
                return false;
            }
        }

        int remainder = dataLength % 4;
        int lastValue = base64Value(input.charAt(dataLength - 1));
        return (remainder != 2 || (lastValue & 0x0f) == 0)
            && (remainder != 3 || (lastValue & 0x03) == 0);
    }

    private static int base64Value(char ch) {
        if (ch >= 'A' && ch <= 'Z') {
            return ch - 'A';
        }
        if (ch >= 'a' && ch <= 'z') {
            return ch - 'a' + 26;
        }
        if (ch >= '0' && ch <= '9') {
            return ch - '0' + 52;
        }
        if (ch == '+') {
            return 62;
        }
        if (ch == '/') {
            return 63;
        }
        return -1;
    }
}
