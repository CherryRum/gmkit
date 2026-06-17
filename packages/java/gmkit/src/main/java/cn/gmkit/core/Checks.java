package cn.gmkit.core;

/**
 * 通用参数检查工具，统一空值、空白和默认值处理。
 */
public final class Checks {

    private Checks() {
    }

    /**
     * 要求对象不为 {@code null}。
     *
     * @param value 待检查对象
     * @param label 错误标签
     * @param <T>   对象类型
     * @return 原对象
     */
    public static <T> T requireNonNull(T value, String label) {
        if (value == null) {
            throw new GmkitException(Messages.nullValue(label));
        }
        return value;
    }

    /**
     * 要求字符串不为 {@code null} 或空白。
     *
     * @param value 待检查字符串
     * @param label 错误标签
     * @return 去除首尾空白后的字符串
     */
    public static String requireNonBlank(String value, String label) {
        requireNonNull(value, label);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new GmkitException(Messages.blankValue(label));
        }
        return trimmed;
    }

    /**
     * 在值为 {@code null} 时返回默认值。
     *
     * @param value        原值
     * @param defaultValue 默认值
     * @param <T>          值类型
     * @return 原值或默认值
     */
    public static <T> T defaultIfNull(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }

    /**
     * 要求字节数组非空且至少包含一个字节。
     *
     * @param value 待检查数组
     * @param label 错误标签
     * @return 原数组
     */
    public static byte[] requireNonEmpty(byte[] value, String label) {
        requireNonNull(value, label);
        if (value.length == 0) {
            throw new GmkitException(Messages.emptyValue(label));
        }
        return value;
    }

    /**
     * 判断字节数组是否有内容。
     *
     * @param value 待检查数组
     * @return 非空且长度大于 0 时返回 {@code true}
     */
    public static boolean hasBytes(byte[] value) {
        return value != null && value.length > 0;
    }
}
