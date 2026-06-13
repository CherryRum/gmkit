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
     * 这里不做真正解码，避免把“格式探测”变成一次完整的分配和解码。
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
        int paddingStart = length;
        int paddingCount = 0;
        for (int i = 0; i < length; i++) {
            char ch = trimmed.charAt(i);
            if (ch == '=') {
                if (paddingStart == length) {
                    paddingStart = i;
                }
                paddingCount++;
                if (paddingCount > 2) {
                    return false;
                }
                continue;
            }
            if (paddingStart != length) {
                return false;
            }
            if (!isBase64Char(ch)) {
                return false;
            }
        }
        return true;
    }

    private static boolean isBase64Char(char ch) {
        return (ch >= 'A' && ch <= 'Z')
            || (ch >= 'a' && ch <= 'z')
            || (ch >= '0' && ch <= '9')
            || ch == '+'
            || ch == '/';
    }
}
