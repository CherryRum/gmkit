package cn.gmkit.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression test for {@link Bytes#constantTimeEquals(byte[], byte[])}.
 *
 * <p>Audit-iter8-A 安排：当前生产代码尚未直接调用此方法（SM2 用 JDK 的
 * {@code MessageDigest.isEqual}；SM4 AEAD tag 由 JCE 内部校验），但此方法
 * 是未来 HMAC / 自定义认证 tag 校验的标准入口。锁定行为契约以避免后续
 * 引入早返回式比较时被无声替换。
 */
class BytesConstantTimeEqualsTest {

    @Test
    void equalArraysReturnTrue() {
        byte[] a = {1, 2, 3, 4, (byte) 0xff};
        byte[] b = {1, 2, 3, 4, (byte) 0xff};
        assertTrue(Bytes.constantTimeEquals(a, b));
    }

    @Test
    void differentLengthReturnsFalse() {
        assertFalse(Bytes.constantTimeEquals(new byte[]{1, 2}, new byte[]{1, 2, 3}));
        assertFalse(Bytes.constantTimeEquals(new byte[]{1, 2, 3}, new byte[]{1, 2}));
    }

    @Test
    void differentContentReturnsFalse() {
        byte[] a = {1, 2, 3, 4};
        byte[] b = {1, 2, 3, 5};
        assertFalse(Bytes.constantTimeEquals(a, b));
    }

    @Test
    void emptyArraysAreEqual() {
        assertTrue(Bytes.constantTimeEquals(new byte[0], new byte[0]));
    }

    @Test
    void nullHandled() {
        assertFalse(Bytes.constantTimeEquals(null, new byte[]{1}));
        assertFalse(Bytes.constantTimeEquals(new byte[]{1}, null));
    }

    @Test
    void mostSignificantByteDifferenceDetected() {
        // 确保比较扫描整个数组（不会因为首字节相等就早返回）
        byte[] a = new byte[256];
        byte[] b = new byte[256];
        b[255] = 1;
        assertFalse(Bytes.constantTimeEquals(a, b));
    }
}