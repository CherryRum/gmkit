package cn.gmkit.core;

/**
 * 二进制、十六进制与 Base64 之间的统一转换工具。
 */
public final class ByteEncodings {

    private ByteEncodings() {
    }

    /**
     * 将字节数组编码为字符串
     *
     * @param input        待编码的字节数组
     * @param outputFormat 输出格式，支持HEX和BASE64
     * @return 编码后的字符串
     */
    public static String encode(byte[] input, OutputFormat outputFormat) {
        OutputFormat format = Checks.defaultIfNull(outputFormat, OutputFormat.HEX);
        if (format == OutputFormat.HEX) {
            return HexCodec.encode(input);
        }
        if (format == OutputFormat.BASE64) {
            return Base64Codec.encode(input);
        }
        throw new GmkitException(Messages.bilingual("不支持的输出格式: " + format, "Unsupported output format: " + format));
    }

    /**
     * 将字符串解码为字节数组
     *
     * @param input       待解码的字符串
     * @param inputFormat 输入格式，支持HEX和BASE64，为null时自动检测
     * @param label       错误提示标签
     * @return 解码后的字节数组
     */
    public static byte[] decode(String input, InputFormat inputFormat, String label) {
        if (inputFormat == null) {
            return decodeAuto(input, label);
        }
        if (inputFormat == InputFormat.HEX) {
            return HexCodec.decodeStrict(input, label);
        }
        if (inputFormat == InputFormat.BASE64) {
            return Base64Codec.decode(input, label);
        }
        throw new GmkitException(Messages.bilingual("不支持的输入格式: " + inputFormat, "Unsupported input format: " + inputFormat));
    }

    /**
     * 自动检测输入格式并解码为字节数组
     *
     * @param input 待解码的字符串
     * @param label 错误提示标签
     * @return 解码后的字节数组
     */
    public static byte[] decodeAuto(String input, String label) {
        if (input == null || input.trim().isEmpty()) {
            throw new GmkitException(Messages.invalidBlankInput(label));
        }
        String trimmed = input.trim();
        String normalizedHex = HexCodec.normalize(trimmed, label);
        if (looksLikeHexInput(trimmed, normalizedHex)) {
            return HexCodec.decodeStrict(normalizedHex, label);
        }
        if (Base64Codec.looksLikeBase64(trimmed)) {
            return Base64Codec.decode(trimmed, label);
        }
        throw new GmkitException(Messages.invalidHexOrBase64(label));
    }

    private static boolean looksLikeHexInput(String originalInput, String normalizedHex) {
        if (originalInput.startsWith("0x") || originalInput.startsWith("0X")) {
            return true;
        }
        return HexCodec.isHex(normalizedHex);
    }
}
