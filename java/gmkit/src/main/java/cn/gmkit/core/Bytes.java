package cn.gmkit.core;

import java.util.Arrays;

/**
 * 字节数组工具。
 * <p>
 * 负责最基础的拷贝、拼接、定长校验和常量时间比较。
 */
public final class Bytes {

    private Bytes() {
    }

    /**
     * 克隆字节数组
     *
     * @param input 待克隆的字节数组
     * @return 克隆后的新字节数组，如果输入为null则返回null
     */
    public static byte[] clone(byte[] input) {
        return input == null ? null : Arrays.copyOf(input, input.length);
    }

    /**
     * 验证字节数组不为null
     *
     * @param input 待验证的字节数组
     * @param label 错误提示标签
     * @return 输入的字节数组
     * @throws GmkitException 如果字节数组为null
     */
    public static byte[] requireNonNull(byte[] input, String label) {
        return Checks.requireNonNull(input, label);
    }

    /**
     * 验证字节数组非空且至少包含一个字节。
     *
     * @param input 待验证的字节数组
     * @param label 错误提示标签
     * @return 输入的字节数组
     * @throws GmkitException 如果字节数组为 {@code null} 或长度为 0
     */
    public static byte[] requireNonEmpty(byte[] input, String label) {
        return Checks.requireNonEmpty(input, label);
    }

    /**
     * 验证字节数组长度是否符合要求
     *
     * @param input          待验证的字节数组
     * @param expectedLength 期望的长度
     * @param label          错误提示标签
     * @return 输入的字节数组
     * @throws GmkitException 如果字节数组为null或长度不符合要求
     */
    public static byte[] requireLength(byte[] input, int expectedLength, String label) {
        requireNonNull(input, label);
        if (input.length != expectedLength) {
            throw new GmkitException(Messages.expectedLength(label, expectedLength, input.length));
        }
        return input;
    }

    /**
     * 连接多个字节数组
     *
     * @param arrays 待连接的字节数组
     * @return 连接后的新字节数组
     */
    public static byte[] concat(byte[]... arrays) {
        int total = 0;
        for (byte[] array : arrays) {
            if (array != null) {
                total += array.length;
            }
        }
        byte[] merged = new byte[total];
        int offset = 0;
        for (byte[] array : arrays) {
            if (array == null) {
                continue;
            }
            System.arraycopy(array, 0, merged, offset, array.length);
            offset += array.length;
        }
        return merged;
    }

    /**
     * 常量时间比较两个字节数组是否相等，防止时间攻击
     *
     * @param left  第一个字节数组
     * @param right 第二个字节数组
     * @return 如果两个数组内容相同返回true，否则返回false
     */
    public static boolean constantTimeEquals(byte[] left, byte[] right) {
        if (!Checks.hasBytes(left) || !Checks.hasBytes(right) || left.length != right.length) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < left.length; i++) {
            diff |= left[i] ^ right[i];
        }
        return diff == 0;
    }

    /**
     * 复制字节数组的指定范围
     *
     * @param input 源字节数组
     * @param from  起始索引（包含）
     * @param to    结束索引（不包含）
     * @return 复制的字节数组
     */
    public static byte[] copyOfRange(byte[] input, int from, int to) {
        return Arrays.copyOfRange(input, from, to);
    }
}
