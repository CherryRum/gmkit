package cn.gmkit.sm9;

/**
 * SM9 模块内部参数检查工具，统一空值与空白处理并抛出 {@link SM9Exception}。
 */
final class SM9Checks {

    private SM9Checks() {
    }

    static <T> T requireNonNull(T value, String label) {
        if (value == null) {
            throw new SM9Exception(SM9Messages.nullValue(label));
        }
        return value;
    }

    static String requireNonBlank(String value, String label) {
        requireNonNull(value, label);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new SM9Exception(SM9Messages.blankValue(label));
        }
        return trimmed;
    }

    static byte[] requireNonEmpty(byte[] value, String label) {
        requireNonNull(value, label);
        if (value.length == 0) {
            throw new SM9Exception(SM9Messages.emptyValue(label));
        }
        return value;
    }

    static byte[] requireRange(byte[] value, int offset, int length, String label) {
        requireNonNull(value, label);
        // 先比较剩余长度，避免 offset + length 在 int 范围内溢出。
        if (offset < 0 || length < 0 || offset > value.length || length > value.length - offset) {
            throw new SM9Exception(SM9Messages.emptyValue(label));
        }
        return value;
    }
}
