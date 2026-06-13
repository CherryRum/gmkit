package cn.gmkit.core;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

/**
 * 文本与字节数组转换工具。
 * <p>
 * 默认字符集为 UTF-8，同时提供显式 {@link Charset} 重载，方便多语言文本或与外部协议对接。
 */
public final class Texts {

    /**
     * UTF-8字符集常量
     */
    public static final Charset UTF_8 = StandardCharsets.UTF_8;

    private Texts() {
    }

    /**
     * 将字符串编码为UTF-8字节数组
     *
     * @param input 待编码的字符串
     * @return UTF-8编码的字节数组
     * @throws GmkitException 如果输入为null
     */
    public static byte[] utf8(String input) {
        return bytes(input, UTF_8);
    }

    /**
     * 将UTF-8字节数组解码为字符串
     *
     * @param input UTF-8编码的字节数组
     * @return 解码后的字符串
     * @throws GmkitException 如果输入为null
     */
    public static String utf8(byte[] input) {
        return text(input, UTF_8);
    }

    /**
     * 使用指定字符集对字符串编码。
     *
     * @param input   待编码文本
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 编码后的字节数组
     */
    public static byte[] bytes(String input, Charset charset) {
        Charset resolved = Checks.defaultIfNull(charset, UTF_8);
        return Checks.requireNonNull(input, "Text input").getBytes(resolved);
    }

    /**
     * 使用指定字符集对字节数组解码。
     *
     * @param input   待解码字节数组
     * @param charset 字符集；传入 {@code null} 时默认使用 UTF-8
     * @return 解码后的字符串
     */
    public static String text(byte[] input, Charset charset) {
        Charset resolved = Checks.defaultIfNull(charset, UTF_8);
        return new String(Checks.requireNonNull(input, "Text input"), resolved);
    }
}
